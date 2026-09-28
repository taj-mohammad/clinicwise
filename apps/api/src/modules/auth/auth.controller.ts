import {
  Body, Controller, Get, HttpCode, Post, Req, Res, UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { CurrentActor, Public } from '../../common/decorators';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { Actor } from '../../common/actor';
import { AuthService, type AuthResult } from './auth.service';
import {
  changePasswordSchema, passwordLoginSchema, requestOtpSchema, verifyOtpSchema,
  type ChangePasswordDto, type PasswordLoginDto, type RequestOtpDto, type VerifyOtpDto,
} from './auth.dto';
import { loadEnv } from '../../config/env';

/** "CLINIC_ADMIN" reads as "Clinic Admin" in the profile menu. */
function humaniseRole(role: string | undefined): string {
  if (!role) return 'Member';
  return role
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

const ACCESS_COOKIE = 'cliniqx_access';
const REFRESH_COOKIE = 'cliniqx_refresh';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly env = loadEnv();

  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Sign in with email or mobile and password' })
  @UsePipes(new ZodValidationPipe(passwordLoginSchema))
  async login(@Body() dto: PasswordLoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.loginWithPassword(dto, this.meta(req));
    return this.respond(res, result);
  }

  @Public()
  @Post('otp/request')
  @HttpCode(200)
  @ApiOperation({ summary: 'Send a one-time login code by SMS' })
  @UsePipes(new ZodValidationPipe(requestOtpSchema))
  async requestOtp(@Body() dto: RequestOtpDto, @Req() req: Request) {
    return this.auth.requestLoginOtp(dto.portal, dto.mobile, this.meta(req));
  }

  @Public()
  @Post('otp/verify')
  @HttpCode(200)
  @ApiOperation({ summary: 'Exchange a one-time code for a session' })
  @UsePipes(new ZodValidationPipe(verifyOtpSchema))
  async verifyOtp(@Body() dto: VerifyOtpDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.loginWithOtp(dto, this.meta(req));
    return this.respond(res, result);
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Rotate the refresh token and issue a new session' })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = (req as Request & { cookies?: Record<string, string> }).cookies?.[REFRESH_COOKIE]
      ?? (req.body as { refreshToken?: string } | undefined)?.refreshToken;
    if (!token) {
      res.status(401);
      return { statusCode: 401, message: 'Session expired. Please sign in again.' };
    }
    const result = await this.auth.refresh(token, this.meta(req));
    return this.respond(res, result);
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@CurrentActor() actor: Actor, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(actor.sessionId, actor.userId, this.meta(req));
    this.clearCookies(res);
  }

  @Post('logout-all')
  @HttpCode(204)
  @ApiOperation({ summary: 'Revoke every session for the signed-in user' })
  async logoutAll(@CurrentActor() actor: Actor, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logoutAll(actor.userId, this.meta(req));
    this.clearCookies(res);
  }

  @Get('me')
  @ApiOperation({ summary: 'The signed-in user with their effective permissions' })
  async me(@CurrentActor() actor: Actor) {
    const profile = await this.auth.profile(actor);
    return {
      ...profile,
      // A staff designation is more useful in the UI than the raw role key.
      primaryRoleLabel: profile.primaryRoleLabel ?? humaniseRole(actor.roles[0]),
      id: actor.userId,
      organizationId: actor.organizationId,
      principalType: actor.principalType,
      roles: actor.roles,
      permissions: [...actor.permissions],
      clinicIds: actor.clinicIds,
      doctorId: actor.doctorId ?? null,
      staffId: actor.staffId ?? null,
      patientId: actor.patientId ?? null,
    };
  }

  @Get('sessions')
  async sessions(@CurrentActor() actor: Actor) {
    return this.auth.listSessions(actor.userId);
  }

  @Post('password/change')
  @HttpCode(204)
  @UsePipes(new ZodValidationPipe(changePasswordSchema))
  async changePassword(
    @CurrentActor() actor: Actor,
    @Body() dto: ChangePasswordDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.auth.changePassword(actor.userId, dto.currentPassword, dto.newPassword, this.meta(req));
    this.clearCookies(res);
  }

  private meta(req: Request) {
    return { ipAddress: req.ip, userAgent: req.get('user-agent') ?? undefined };
  }

  /**
   * Tokens travel in HttpOnly cookies so page scripts cannot read them.
   * They are also returned in the body for native clients, which have no cookie jar.
   */
  private respond(res: Response, result: AuthResult) {
    const secure = this.env.NODE_ENV === 'production';
    const base = {
      httpOnly: true,
      secure,
      sameSite: 'lax' as const,
      domain: this.env.COOKIE_DOMAIN,
      path: '/',
    };
    res.cookie(ACCESS_COOKIE, result.accessToken, {
      ...base,
      maxAge: result.accessTtlSeconds * 1000,
    });
    res.cookie(REFRESH_COOKIE, result.refreshToken, {
      ...base,
      path: '/api/auth',
      expires: result.refreshExpiresAt,
    });
    return {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: result.accessTtlSeconds,
    };
  }

  private clearCookies(res: Response) {
    res.clearCookie(ACCESS_COOKIE, { domain: this.env.COOKIE_DOMAIN, path: '/' });
    res.clearCookie(REFRESH_COOKIE, { domain: this.env.COOKIE_DOMAIN, path: '/api/auth' });
  }
}
