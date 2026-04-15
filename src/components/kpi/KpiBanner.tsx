'use client';

import useSWR from 'swr';
import { kpiApi } from '@/lib/api';
import { Kpi } from '@/types/api';
import { LoadingScreen } from '@/components/ui/Spinner';

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 text-center shadow-sm">
      <div className="text-3xl font-bold text-blue-600">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
    </div>
  );
}

export default function KpiBanner() {
  const { data, error } = useSWR<Kpi>('kpi', () => kpiApi.get().then((r) => r.data));

  if (error) return null;
  if (!data) return <LoadingScreen />;

  return (
    <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-3">Controlled Data Exchange</h1>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto">
            Publish, govern, and share datasets with fine-grained access control, secure
            previews, and full audit trails.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Public Datasets" value={data.totalPublicDatasets} />
          <StatCard label="Total Views" value={data.totalViews} />
          <StatCard label="Total Downloads" value={data.totalDownloads} />
          <StatCard label="Registered Users" value={data.totalUsers} />
        </div>
      </div>
    </section>
  );
}
