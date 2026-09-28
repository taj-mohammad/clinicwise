import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { createHash, randomInt } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { AuditService } from '../audit/audit.service';
import { loadEnv } from '../../config/env';
import type { OtpPurpose } from '@cliniqx/db';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly env = loadEnv();

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Issues a one-time code. The plaintext is never stored; in development it is
   * logged so the flow is testable without an SMS provider.
   */
  async issue(args: {
    purpose: OtpPurpose;
    mobile?: string;
    email?: string;
    userId?: string | null;
    ipAddress?: string;
  }): Promise<{ expiresInSeconds: number; devCode?: string }> {
    const target = args.mobile ?? args.email;
    if (!target) throw new BadRequestException('A mobile number or email is required');

    await this.enforceResendCooldown(target);
    await this.enforceIssueQuota(target, args.ipAddress);

    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    const expiresAt = new Date(Date.now() + this.env.OTP_TTL_SECONDS * 1000);

    // Only the newest code for a target may be used.
    await this.prisma.otpChallenge.updateMany({
      where: {
        purpose: args.purpose,
        consumedAt: null,
        ...(args.mobile ? { mobile: args.mobile } : { email: args.email }),
      },
      data: { consumedAt: new Date() },
    });

    await this.prisma.otpChallenge.create({
      data: {
        userId: args.userId ?? null,
        mobile: args.mobile ?? null,
        email: args.email ?? null,
        purpose: args.purpose,
        codeHash: this.hash(code),
        maxAttempts: this.env.OTP_MAX_ATTEMPTS,
        expiresAt,
        ipAddress: args.ipAddress ?? null,
      },
    });

    if (this.env.NODE_ENV === 'production') {
      // Delivery is handled by the notifications module; nothing is logged here.
    } else {
      this.logger.warn(`[dev] OTP for ${target} (${args.purpose}): ${code}`);
    }

    return {
      expiresInSeconds: this.env.OTP_TTL_SECONDS,
      ...(this.env.NODE_ENV === 'production' ? {} : { devCode: code }),
    };
  }

  /** Consumes a code. Attempt counting is per challenge, so guessing is bounded. */
  async verify(args: {
    purpose: OtpPurpose;
    code: string;
    mobile?: string;
    email?: string;
    ipAddress?: string;
  }): Promise<{ challengeId: string; userId: string | null }> {
    const challenge = await this.prisma.otpChallenge.findFirst({
      where: {
        purpose: args.purpose,
        consumedAt: null,
        expiresAt: { gt: new Date() },
        ...(args.mobile ? { mobile: args.mobile } : { email: args.email }),
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!challenge) {
      await this.audit.security('OTP_FAILED', {
        mobile: args.mobile ?? null,
        email: args.email ?? null,
        ipAddress: args.ipAddress ?? null,
        severity: 'warning',
        metadata: { reason: 'no_active_challenge', purpose: args.purpose },
      });
      throw new BadRequestException('That code is invalid or has expired');
    }

    if (challenge.attempts >= challenge.maxAttempts) {
      await this.prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { consumedAt: new Date() },
      });
      await this.audit.security('OTP_RATE_LIMITED', {
        userId: challenge.userId,
        mobile: args.mobile ?? null,
        ipAddress: args.ipAddress ?? null,
        severity: 'critical',
      });
      throw new BadRequestException('Too many incorrect attempts. Request a new code.');
    }

    if (!this.timingSafeEqual(this.hash(args.code), challenge.codeHash)) {
      await this.prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { attempts: { increment: 1 } },
      });
      await this.audit.security('OTP_FAILED', {
        userId: challenge.userId,
        mobile: args.mobile ?? null,
        ipAddress: args.ipAddress ?? null,
        severity: 'warning',
        metadata: { attempt: challenge.attempts + 1 },
      });
      throw new BadRequestException('That code is invalid or has expired');
    }

    await this.prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { consumedAt: new Date() },
    });
    return { challengeId: challenge.id, userId: challenge.userId };
  }

  private async enforceResendCooldown(target: string): Promise<void> {
    const key = `otp:cooldown:${target}`;
    const existing = await this.redis.ttl(key);
    if (existing > 0) {
      throw new BadRequestException(`Please wait ${existing}s before requesting another code`);
    }
    await this.redis.client.set(key, '1', 'EX', this.env.OTP_RESEND_COOLDOWN_SECONDS);
  }

  /** Caps codes per target and per source IP within a rolling hour. */
  private async enforceIssueQuota(target: string, ipAddress?: string): Promise<void> {
    const perTarget = await this.redis.hit(`otp:quota:target:${target}`, 3600);
    if (perTarget > 10) throw new BadRequestException('Too many code requests. Try again later.');
    if (ipAddress) {
      const perIp = await this.redis.hit(`otp:quota:ip:${ipAddress}`, 3600);
      if (perIp > 40) throw new BadRequestException('Too many code requests. Try again later.');
    }
  }

  private hash(code: string): string {
    return createHash('sha256').update(`${code}`).digest('hex');
  }

  private timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
  }
}
