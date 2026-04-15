import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { DatasetsService } from './datasets.service';
import { CreateDatasetDto } from './dto/create-dataset.dto';
import { UpdateDatasetDto } from './dto/update-dataset.dto';
import { SearchDatasetDto } from './dto/search-dataset.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('datasets')
export class DatasetsController {
  constructor(private datasetsService: DatasetsService) {}

  @Public()
  @Get()
  search(@Query() dto: SearchDatasetDto, @CurrentUser() user: any) {
    return this.datasetsService.search(dto, user?.id);
  }

  @Get('mine')
  findMine(@CurrentUser() user: any) {
    return this.datasetsService.findMine(user.id);
  }

  @Public()
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.datasetsService.findOne(id, user?.id, req.ip);
  }

  @Post()
  create(
    @CurrentUser() user: any,
    @Body() dto: CreateDatasetDto,
    @Req() req: Request,
  ) {
    return this.datasetsService.create(user.id, dto, req.ip);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateDatasetDto,
    @Req() req: Request,
  ) {
    return this.datasetsService.update(id, user.id, dto, req.ip);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.datasetsService.remove(id, user.id);
  }
}
