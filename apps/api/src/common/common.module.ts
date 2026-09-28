import { Global, Module } from '@nestjs/common';
import { AccessService } from './services/access.service';
import { CodeService } from './services/code.service';

@Global()
@Module({ providers: [AccessService, CodeService], exports: [AccessService, CodeService] })
export class CommonModule {}
