import { Controller, Get } from '@nestjs/common';
import { KpiService } from './kpi.service';
import { Public } from '../common/decorators/public.decorator';

@Controller('kpi')
export class KpiController {
  constructor(private kpiService: KpiService) {}

  @Public()
  @Get()
  getKpis() {
    return this.kpiService.getKpis();
  }
}
