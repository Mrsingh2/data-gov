import { Controller, Post, Get, Patch, Param, Body, Req } from '@nestjs/common';
import { AccessService } from './access.service';
import { CreateAccessRequestDto } from './dto/create-access-request.dto';
import { ReviewAccessRequestDto } from './dto/review-access-request.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Request } from 'express';

@Controller('access')
export class AccessController {
  constructor(private accessService: AccessService) {}

  @Post('request')
  requestAccess(
    @CurrentUser() user: any,
    @Body() dto: CreateAccessRequestDto,
    @Req() req: Request,
  ) {
    return this.accessService.requestAccess(user.id, dto, req.ip);
  }

  @Get('pending')
  getPending(@CurrentUser() user: any) {
    return this.accessService.getPendingRequests(user.id);
  }

  @Get('mine')
  getMine(@CurrentUser() user: any) {
    return this.accessService.getMyRequests(user.id);
  }

  @Patch('request/:id/review')
  review(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: ReviewAccessRequestDto,
    @Req() req: Request,
  ) {
    return this.accessService.reviewRequest(id, user.id, dto, req.ip);
  }
}
