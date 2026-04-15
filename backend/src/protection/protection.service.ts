import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateColumnRuleDto } from './dto/create-column-rule.dto';
import { CreateRowRuleDto } from './dto/create-row-rule.dto';
import { ColumnProtectionRule, RowProtectionRule } from '@prisma/client';
import { applyMask } from './strategies/mask.strategy';
import { applyAnonymize } from './strategies/anonymize.strategy';
import { applySynthetic } from './strategies/synthetic.strategy';

@Injectable()
export class ProtectionService {
  constructor(private prisma: PrismaService) {}

  // ── Column rule CRUD ─────────────────────────────────────────

  async addColumnRule(datasetId: string, ownerId: string, dto: CreateColumnRuleDto) {
    await this.assertOwner(datasetId, ownerId);
    return this.prisma.columnProtectionRule.upsert({
      where: { datasetId_columnName: { datasetId, columnName: dto.columnName } },
      create: { datasetId, columnName: dto.columnName, strategy: dto.strategy },
      update: { strategy: dto.strategy, isActive: true },
    });
  }

  async getColumnRules(datasetId: string) {
    return this.prisma.columnProtectionRule.findMany({
      where: { datasetId, isActive: true },
    });
  }

  async deleteColumnRule(datasetId: string, ruleId: string, ownerId: string) {
    await this.assertOwner(datasetId, ownerId);
    return this.prisma.columnProtectionRule.update({
      where: { id: ruleId },
      data: { isActive: false },
    });
  }

  // ── Row rule CRUD ────────────────────────────────────────────

  async addRowRule(datasetId: string, ownerId: string, dto: CreateRowRuleDto) {
    await this.assertOwner(datasetId, ownerId);
    return this.prisma.rowProtectionRule.create({
      data: { datasetId, field: dto.field, operator: dto.operator, value: dto.value },
    });
  }

  async getRowRules(datasetId: string) {
    return this.prisma.rowProtectionRule.findMany({
      where: { datasetId, isActive: true },
    });
  }

  async deleteRowRule(datasetId: string, ruleId: string, ownerId: string) {
    await this.assertOwner(datasetId, ownerId);
    return this.prisma.rowProtectionRule.update({
      where: { id: ruleId },
      data: { isActive: false },
    });
  }

  // ── Transformation engine ────────────────────────────────────

  applyColumnRules(
    row: Record<string, any>,
    rules: ColumnProtectionRule[],
    columnStats?: Record<string, any>,
  ): Record<string, any> {
    const result = { ...row };
    for (const rule of rules) {
      if (!rule.isActive) continue;
      const val = result[rule.columnName];
      const stats = columnStats?.[rule.columnName];
      switch (rule.strategy) {
        case 'MASK':
          result[rule.columnName] = applyMask(val);
          break;
        case 'ANONYMIZE':
          result[rule.columnName] = applyAnonymize(val);
          break;
        case 'SYNTHETIC':
          result[rule.columnName] = applySynthetic(val, stats);
          break;
      }
    }
    return result;
  }

  evaluateRowRule(row: Record<string, any>, rule: RowProtectionRule): boolean {
    const fieldVal = row[rule.field];
    const ruleVal = rule.value;

    if (fieldVal === undefined || fieldVal === null) return false;

    const numFieldVal = Number(fieldVal);
    const numRuleVal = Number(ruleVal);

    switch (rule.operator) {
      case 'eq':
        return String(fieldVal) === ruleVal;
      case 'ne':
        return String(fieldVal) !== ruleVal;
      case 'lt':
        return !isNaN(numFieldVal) && numFieldVal < numRuleVal;
      case 'lte':
        return !isNaN(numFieldVal) && numFieldVal <= numRuleVal;
      case 'gt':
        return !isNaN(numFieldVal) && numFieldVal > numRuleVal;
      case 'gte':
        return !isNaN(numFieldVal) && numFieldVal >= numRuleVal;
      case 'contains':
        return String(fieldVal).toLowerCase().includes(ruleVal.toLowerCase());
      default:
        return false;
    }
  }

  isRowRestricted(row: Record<string, any>, rules: RowProtectionRule[]): boolean {
    return rules.some((r) => r.isActive && this.evaluateRowRule(row, r));
  }

  // ── Helper ───────────────────────────────────────────────────

  private async assertOwner(datasetId: string, userId: string) {
    const dataset = await this.prisma.dataset.findUnique({ where: { id: datasetId } });
    if (!dataset) throw new NotFoundException('Dataset not found');
    if (dataset.ownerId !== userId) throw new ForbiddenException('Not the owner');
  }
}
