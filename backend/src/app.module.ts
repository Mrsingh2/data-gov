import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DatasetsModule } from './datasets/datasets.module';
import { UploadModule } from './upload/upload.module';
import { VersionsModule } from './versions/versions.module';
import { ProtectionModule } from './protection/protection.module';
import { PreviewModule } from './preview/preview.module';
import { AccessModule } from './access/access.module';
import { DownloadsModule } from './downloads/downloads.module';
import { AuditModule } from './audit/audit.module';
import { KpiModule } from './kpi/kpi.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    DatasetsModule,
    UploadModule,
    VersionsModule,
    ProtectionModule,
    PreviewModule,
    AccessModule,
    DownloadsModule,
    AuditModule,
    KpiModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
