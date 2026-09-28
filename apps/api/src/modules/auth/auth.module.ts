import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { ActorService } from './actor.service';
import { OtpService } from './otp.service';

@Global()
@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, TokenService, ActorService, OtpService],
  exports: [AuthService, TokenService, ActorService, OtpService],
})
export class AuthModule {}
