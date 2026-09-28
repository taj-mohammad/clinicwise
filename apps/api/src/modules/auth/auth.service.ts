import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { LOGIN_PORTALS, type LoginPortal, type SystemRole } from '@cliniqx/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { RedisService } from '../redis/redis.service';
import { TokenService } from './token.service';
import { ActorService } from './actor.service';
import { OtpService } from './otp.service';
import type { PasswordLoginDto, VerifyOtpDto } from './auth.dto';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  accessTtlSeconds: number;
  refreshExpiresAt: Date;
  user: {
    id: string;
    fullName: string;
    email: string | null;
    mobile: string | null;
    roles: SystemRole[];
    permissions: string[];
    clinicIds: string[];
    doctorId: string | null;
    patientId: string | null;
    staffId: string | null;
  };
}

interface RequestMeta {
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
    private readonly actors: ActorService,
    private readonly otp: OtpService,
    private readonly audit: AuditService,
    private readonly redis: RedisService,
  ) {}

  async loginWithPassword(dto: PasswordLoginDto, meta: RequestMeta): Promise<AuthResult> {
    await this.throttleLogin(dto.identifier, meta.ipAddress);

    const identifier = dto.identifier.trim().toLowerCase();
    const user = await this.prisma.user.findFirst({
      where: {
        deletedAt: null,
        OR: [{ email: identifier }, { mobile: dto.identifier.trim() }],
      },
      select: {
        id: true, passwordHash: true, status: true, lockedUntil: true,
        failedAttempts: true, email: true, mobile: true,
      },
    });

    // The same message and cost are returned whether or not the account exists.
    if (!user?.passwordHash) {
      await argon2.hash('cliniqx-timing-equaliser');
      await this.audit.security('LOGIN_FAILED', {
        email: identifier, ipAddress: meta.ipAddress, userAgent: meta.userAgent,
        severity: 'warning', metadata: { reason: 'unknown_account', portal: dto.portal },
      });
      throw new UnauthorizedException('Incorrect credentials');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException('Account is temporarily locked. Try again later.');
    }

    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) {
      await this.registerFailedAttempt(user.id, user.failedAttempts, meta);
      throw new UnauthorizedException('Incorrect credentials');
    }

    if (user.status !== 'ACTIVE') throw new UnauthorizedException('This account is not active');

    await this.assertPortal(user.id, dto.portal);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
    });
    await this.redis.reset(this.loginKey(dto.identifier));

    return this.establishSession(user.id, meta, {
      rememberDevice: dto.rememberDevice,
      deviceLabel: dto.deviceLabel,
    });
  }

  async requestLoginOtp(
    portal: LoginPortal,
    mobile: string,
    meta: RequestMeta,
  ): Promise<{ expiresInSeconds: number; devCode?: string }> {
    const user = await this.prisma.user.findFirst({
      where: { mobile, deletedAt: null },
      select: { id: true, status: true },
    });

    // An unregistered number must not be distinguishable from a registered one.
    if (!user || user.status !== 'ACTIVE') {
      return { expiresInSeconds: 300 };
    }

    return this.otp.issue({
      purpose: 'LOGIN',
      mobile,
      userId: user.id,
      ipAddress: meta.ipAddress,
    });
  }

  async loginWithOtp(dto: VerifyOtpDto, meta: RequestMeta): Promise<AuthResult> {
    const { userId } = await this.otp.verify({
      purpose: 'LOGIN',
      code: dto.code,
      mobile: dto.mobile,
      ipAddress: meta.ipAddress,
    });
    if (!userId) throw new UnauthorizedException('Incorrect credentials');

    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { id: true, status: true },
    });
    if (!user || user.status !== 'ACTIVE') throw new UnauthorizedException('This account is not active');

    await this.assertPortal(user.id, dto.portal);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedAttempts: 0, lockedUntil: null, lastLoginAt: new Date(), mobileVerifiedAt: new Date() },
    });

    return this.establishSession(user.id, meta, {
      rememberDevice: dto.rememberDevice,
      deviceLabel: dto.deviceLabel,
    });
  }

  /** Rotates the refresh token: the presented one is revoked as it is exchanged. */
  async refresh(refreshToken: string, meta: RequestMeta): Promise<AuthResult> {
    const hash = this.tokens.hashRefresh(refreshToken);
    const session = await this.prisma.userSession.findUnique({
      where: { refreshHash: hash },
      select: { id: true, userId: true, revokedAt: true, expiresAt: true, trustedDevice: true, deviceLabel: true },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      if (session?.userId) {
        // A revoked token being replayed usually means it was stolen.
        await this.prisma.userSession.updateMany({
          where: { userId: session.userId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
        await this.audit.security('SUSPICIOUS_LOGIN', {
          userId: session.userId, ipAddress: meta.ipAddress, userAgent: meta.userAgent,
          severity: 'critical', metadata: { reason: 'refresh_token_reuse' },
        });
      }
      throw new UnauthorizedException('Session expired. Please sign in again.');
    }

    await this.prisma.userSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    return this.establishSession(session.userId, meta, {
      rememberDevice: session.trustedDevice,
      deviceLabel: session.deviceLabel ?? undefined,
    });
  }

  async logout(sessionId: string, userId: string, meta: RequestMeta): Promise<void> {
    await this.prisma.userSession.updateMany({
      where: { id: sessionId, userId },
      data: { revokedAt: new Date() },
    });
    await this.audit.record({
      userId, action: 'auth.logout', resourceType: 'session', resourceId: sessionId,
      ipAddress: meta.ipAddress, userAgent: meta.userAgent,
    });
  }

  async logoutAll(userId: string, meta: RequestMeta): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.userSession.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
      // Invalidates access tokens that have not expired yet.
      this.prisma.user.update({ where: { id: userId }, data: { tokensValidFrom: new Date() } }),
    ]);
    await this.audit.security('SESSION_REVOKED', {
      userId, ipAddress: meta.ipAddress, userAgent: meta.userAgent,
      metadata: { scope: 'all_devices' },
    });
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    meta: RequestMeta,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });
    if (!user?.passwordHash) throw new BadRequestException('Password sign-in is not enabled for this account');

    const valid = await argon2.verify(user.passwordHash, currentPassword);
    if (!valid) throw new UnauthorizedException('Current password is incorrect');

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash: await this.hashPassword(newPassword), tokensValidFrom: new Date() },
      }),
      this.prisma.userSession.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
    await this.audit.security('PASSWORD_CHANGED', {
      userId, ipAddress: meta.ipAddress, userAgent: meta.userAgent,
    });
  }

  async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, { type: argon2.argon2id, memoryCost: 19_456, timeCost: 2, parallelism: 1 });
  }

  /** Profile and display context for the signed-in user, used by the app shell. */
  async profile(actor: { userId: string; organizationId: string | null }) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: actor.userId },
      select: {
        fullName: true, email: true, mobile: true, avatarKey: true,
        organization: { select: { name: true } },
        doctor: {
          select: {
            qualification: true,
            specialties: {
              where: { isPrimary: true },
              select: { specialty: { select: { name: true } } },
            },
            practiceLocations: {
              where: { status: 'ACTIVE', deletedAt: null },
              select: {
                location: {
                  select: { id: true, name: true, clinic: { select: { name: true } } },
                },
              },
            },
          },
        },
        staff: { select: { designation: true } },
      },
    });

    return {
      fullName: user.fullName,
      email: user.email,
      mobile: user.mobile,
      organizationName: user.organization?.name ?? null,
      specialty: user.doctor?.specialties[0]?.specialty.name ?? null,
      qualification: user.doctor?.qualification ?? null,
      primaryRoleLabel: user.staff?.designation ?? null,
      locations:
        user.doctor?.practiceLocations.map((pl) => ({
          id: pl.location.id,
          name: pl.location.name,
          clinicName: pl.location.clinic.name,
        })) ?? [],
    };
  }

  async listSessions(userId: string) {
    return this.prisma.userSession.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      select: {
        id: true, deviceLabel: true, userAgent: true, ipAddress: true,
        trustedDevice: true, lastUsedAt: true, createdAt: true,
      },
      orderBy: { lastUsedAt: 'desc' },
    });
  }

  private async establishSession(
    userId: string,
    meta: RequestMeta,
    opts: { rememberDevice?: boolean; deviceLabel?: string },
  ): Promise<AuthResult> {
    const refresh = this.tokens.issueRefreshToken();
    const session = await this.prisma.userSession.create({
      data: {
        userId,
        refreshHash: refresh.hash,
        expiresAt: refresh.expiresAt,
        ipAddress: meta.ipAddress ?? null,
        userAgent: meta.userAgent ?? null,
        deviceLabel: opts.deviceLabel ?? null,
        trustedDevice: opts.rememberDevice ?? false,
      },
      select: { id: true },
    });

    const accessToken = await this.tokens.signAccess(userId, session.id);
    const actor = await this.actors.build(userId, session.id, meta);
    if (!actor) throw new UnauthorizedException('This account is not active');

    await this.audit.security('LOGIN_SUCCESS', {
      userId, ipAddress: meta.ipAddress, userAgent: meta.userAgent,
    });

    const profile = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { fullName: true, email: true, mobile: true },
    });

    return {
      accessToken,
      refreshToken: refresh.token,
      accessTtlSeconds: 900,
      refreshExpiresAt: refresh.expiresAt,
      user: {
        id: userId,
        fullName: profile.fullName,
        email: profile.email,
        mobile: profile.mobile,
        roles: actor.roles,
        permissions: [...actor.permissions],
        clinicIds: actor.clinicIds,
        doctorId: actor.doctorId ?? null,
        patientId: actor.patientId ?? null,
        staffId: actor.staffId ?? null,
      },
    };
  }

  /** A doctor must not be able to sign in through the patient app, and so on. */
  private async assertPortal(userId: string, portal: LoginPortal): Promise<void> {
    const allowed = LOGIN_PORTALS[portal] as readonly string[];
    const roles = await this.prisma.userRole.findMany({
      where: { userId },
      select: { role: { select: { key: true } } },
    });
    const has = roles.some((r) => allowed.includes(r.role.key));
    if (!has) throw new UnauthorizedException('Incorrect credentials');
  }

  private async registerFailedAttempt(
    userId: string,
    current: number,
    meta: RequestMeta,
  ): Promise<void> {
    const attempts = current + 1;
    const locked = attempts >= MAX_FAILED_ATTEMPTS;
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        failedAttempts: attempts,
        lockedUntil: locked ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null,
      },
    });
    await this.audit.security(locked ? 'ACCOUNT_LOCKED' : 'LOGIN_FAILED', {
      userId, ipAddress: meta.ipAddress, userAgent: meta.userAgent,
      severity: locked ? 'critical' : 'warning',
      metadata: { attempts },
    });
  }

  private async throttleLogin(identifier: string, ipAddress?: string): Promise<void> {
    const byIdentifier = await this.redis.hit(this.loginKey(identifier), 900);
    if (byIdentifier > 20) throw new UnauthorizedException('Too many attempts. Try again later.');
    if (ipAddress) {
      const byIp = await this.redis.hit(`login:ip:${ipAddress}`, 900);
      if (byIp > 100) throw new UnauthorizedException('Too many attempts. Try again later.');
    }
  }

  private loginKey(identifier: string): string {
    return `login:id:${identifier.trim().toLowerCase()}`;
  }
}
