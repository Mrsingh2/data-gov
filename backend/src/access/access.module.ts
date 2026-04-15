import { Module } from '@nestjs/common';
import { AccessService } from './access.service';
import { AccessController } from './access.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  providers: [AccessService],
  controllers: [AccessController],
  exports: [AccessService],
})
export class AccessModule {}
