import { z } from 'zod';

export const LOGIN_PORTAL_VALUES = ['admin', 'portal', 'patient', 'mr', 'pharmacy', 'lab'] as const;

export const passwordLoginSchema = z.object({
  portal: z.enum(LOGIN_PORTAL_VALUES),
  identifier: z.string().min(3).max(190),
  password: z.string().min(8).max(256),
  rememberDevice: z.boolean().optional().default(false),
  deviceLabel: z.string().max(120).optional(),
});
export type PasswordLoginDto = z.infer<typeof passwordLoginSchema>;

/** Indian mobile numbers, stored and compared in a single canonical form. */
export const mobileSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s-]/g, ''))
  .pipe(z.string().regex(/^(?:\+91)?[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'))
  .transform((v) => (v.startsWith('+91') ? v.slice(3) : v));

export const requestOtpSchema = z.object({
  portal: z.enum(LOGIN_PORTAL_VALUES),
  mobile: mobileSchema,
});
export type RequestOtpDto = z.infer<typeof requestOtpSchema>;

export const verifyOtpSchema = z.object({
  portal: z.enum(LOGIN_PORTAL_VALUES),
  mobile: mobileSchema,
  code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code'),
  rememberDevice: z.boolean().optional().default(false),
  deviceLabel: z.string().max(120).optional(),
});
export type VerifyOtpDto = z.infer<typeof verifyOtpSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(8).max(256),
  newPassword: z
    .string()
    .min(10, 'Use at least 10 characters')
    .max(256)
    .regex(/[a-z]/, 'Include a lowercase letter')
    .regex(/[A-Z]/, 'Include an uppercase letter')
    .regex(/\d/, 'Include a number'),
});
export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;

export const requestPasswordResetSchema = z.object({ email: z.string().email() });
export const confirmPasswordResetSchema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/),
  newPassword: changePasswordSchema.shape.newPassword,
});
