import { Module } from '@nestjs/common';
import { PreviewService } from './preview.service';
import { PreviewController } from './preview.controller';
import { ProtectionModule } from '../protection/protection.module';

@Module({
  imports: [ProtectionModule],
  providers: [PreviewService],
  controllers: [PreviewController],
})
export class PreviewModule {}
