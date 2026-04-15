import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { CsvParserService } from './csv-parser.service';
import { LocalStorageService } from './storage/local-storage.service';
import { BlobStorageService } from './storage/blob-storage.service';
import { STORAGE_SERVICE } from './storage/storage.interface';
import { ProtectionModule } from '../protection/protection.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [ProtectionModule, AuditModule],
  providers: [
    UploadService,
    CsvParserService,
    {
      provide: STORAGE_SERVICE,
      useClass:
        process.env.NODE_ENV === 'production' ? BlobStorageService : LocalStorageService,
    },
  ],
  controllers: [UploadController],
  exports: [UploadService, STORAGE_SERVICE, CsvParserService],
})
export class UploadModule {}
