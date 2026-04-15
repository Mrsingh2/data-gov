import { Module } from '@nestjs/common';
import { DownloadsService } from './downloads.service';
import { DownloadsController } from './downloads.controller';
import { ProtectionModule } from '../protection/protection.module';
import { AuditModule } from '../audit/audit.module';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [ProtectionModule, AuditModule, UploadModule],
  providers: [DownloadsService],
  controllers: [DownloadsController],
})
export class DownloadsModule {}
