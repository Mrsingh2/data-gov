import { Module } from '@nestjs/common';
import { ProtectionService } from './protection.service';
import { ProtectionController } from './protection.controller';

@Module({
  providers: [ProtectionService],
  controllers: [ProtectionController],
  exports: [ProtectionService],
})
export class ProtectionModule {}
