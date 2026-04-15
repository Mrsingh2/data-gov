'use client';

import useSWR from 'swr';
import { previewApi } from '@/lib/api';
import { PreviewData, ColumnStat } from '@/types/api';
import { LoadingScreen } from '@/components/ui/Spinner';
import Badge from '@/components/ui/Badge';

function ColumnCard({ col }: { col: ColumnStat }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="font-medium text-sm text-gray-900">{col.name}</span>
        <span className="text-xs text-gray-400 bg-gray-100 rounded px-1.5 py-0.5">
          {col.type}
        </span>
        {col.isProtected && (
          <Badge variant="danger">Protected</Badge>
        )}
      </div>

      {col.message ? (
        <p className="text-xs text-amber-700 bg-amber-50 rounded p-2">{col.message}</p>
      ) : (
        <div className="space-y-1 text-xs text-gray-600">
          <div className="flex justify-between">
            <span>Null values</span>
            <span className="font-medium">{col.nullCount}</span>
          </div>
          {col.uniqueCount !== null && (
            <div className="flex justify-between">
              <span>Unique values</span>
              <span className="font-medium">{col.uniqueCount}</span>
            </div>
          )}
          {col.mean !== null && (
            <>
              <div className="flex justify-between">
                <span>Min / Max</span>
                <span className="font-medium">{col.min} / {col.max}</span>
              </div>
              <div className="flex justify-between">
                <span>Mean</span>
                <span className="font-medium">{col.mean}</span>
              </div>
              <div className="flex justify-between">
                <span>Std Dev</span>
                <span className="font-medium">{col.stdDev}</span>
              </div>
            </>
          )}
          {col.topValues?.length > 0 && (
            <div className="mt-2">
              <div className="text-gray-500 mb-1">Top values</div>
              {col.topValues.slice(0, 5).map((tv) => (
                <div key={tv.value} className="flex justify-between items-center">
                  <span className="truncate max-w-28">{tv.value}</span>
                  <div className="flex items-center gap-1">
                    <div
                      className="h-1.5 bg-blue-300 rounded"
                      style={{
                        width: `${Math.min(60, (tv.count / (col.topValues[0]?.count || 1)) * 60)}px`,
                      }}
                    />
                    <span>{tv.count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function DatasetPreview({ datasetId }: { datasetId: string }) {
  const { data, error, isLoading } = useSWR<PreviewData>(
    `preview-${datasetId}`,
    () => previewApi.get(datasetId).then((r) => r.data),
  );

  if (isLoading) return <LoadingScreen />;
  if (error) return <p className="text-red-500 text-sm">Could not load preview.</p>;
  if (!data) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Dataset Statistics</h3>
        <span className="text-sm text-gray-500">{data.rowCount.toLocaleString()} rows</span>
      </div>
      {data.rowCount === 0 ? (
        <p className="text-gray-500 text-sm">No data uploaded yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.columns.map((col) => (
            <ColumnCard key={col.name} col={col} />
          ))}
        </div>
      )}
    </div>
  );
}
