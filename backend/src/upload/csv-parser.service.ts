import { Injectable } from '@nestjs/common';
import * as Papa from 'papaparse';

export interface ParsedCsv {
  headers: string[];
  rows: Record<string, any>[];
  schema: { name: string; type: string }[];
  columnStats: Record<string, any>;
}

@Injectable()
export class CsvParserService {
  parse(buffer: Buffer): ParsedCsv {
    const csv = buffer.toString('utf-8');
    const result = Papa.parse(csv, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
    });

    const rows = result.data as Record<string, any>[];
    const headers = result.meta.fields || [];

    const schema = headers.map((h) => ({
      name: h,
      type: this.inferType(rows, h),
    }));

    const columnStats = this.computeStats(rows, headers);

    return { headers, rows, schema, columnStats };
  }

  private inferType(rows: Record<string, any>[], column: string): string {
    const sample = rows.slice(0, 100).map((r) => r[column]).filter((v) => v !== '' && v !== null);
    if (sample.length === 0) return 'string';
    if (sample.every((v) => !isNaN(Number(v)) && v !== '')) {
      return sample.every((v) => Number.isInteger(Number(v))) ? 'integer' : 'float';
    }
    if (sample.every((v) => /^\d{4}-\d{2}-\d{2}/.test(String(v)))) return 'date';
    if (sample.every((v) => v === 'true' || v === 'false')) return 'boolean';
    return 'string';
  }

  private computeStats(rows: Record<string, any>[], headers: string[]): Record<string, any> {
    const stats: Record<string, any> = {};
    for (const col of headers) {
      const values = rows.map((r) => r[col]);
      const nonNull = values.filter((v) => v !== null && v !== '' && v !== undefined);
      const nullCount = values.length - nonNull.length;

      const numericVals = nonNull
        .map(Number)
        .filter((n) => !isNaN(n));

      if (numericVals.length > 0.8 * nonNull.length && numericVals.length > 0) {
        const mean = numericVals.reduce((a, b) => a + b, 0) / numericVals.length;
        const variance = numericVals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / numericVals.length;
        stats[col] = {
          type: 'numeric',
          nullCount,
          uniqueCount: new Set(nonNull).size,
          min: Math.min(...numericVals),
          max: Math.max(...numericVals),
          mean: Math.round(mean * 100) / 100,
          stdDev: Math.round(Math.sqrt(variance) * 100) / 100,
        };
      } else {
        const freq: Record<string, number> = {};
        for (const v of nonNull) {
          const key = String(v);
          freq[key] = (freq[key] || 0) + 1;
        }
        const topValues = Object.entries(freq)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([value, count]) => ({ value, count }));

        stats[col] = {
          type: 'categorical',
          nullCount,
          uniqueCount: Object.keys(freq).length,
          topValues,
          frequencyMap: freq,
        };
      }
    }
    return stats;
  }
}
