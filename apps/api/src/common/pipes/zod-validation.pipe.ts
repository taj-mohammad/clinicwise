import { BadRequestException, Injectable, type PipeTransform } from '@nestjs/common';
import type { ZodSchema } from 'zod';

/** Validates and *replaces* the payload, so unknown keys never reach a service. */
@Injectable()
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        message: 'Please check the highlighted fields',
        errors: result.error.issues.map((i) => ({
          field: i.path.join('.') || '_',
          message: i.message,
        })),
      });
    }
    return result.data;
  }
}
