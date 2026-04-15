'use client';

import Link from 'next/link';
import useSWR from 'swr';
import { kpiApi } from '@/lib/api';
import { Kpi } from '@/types/api';
import KpiBanner from '@/components/kpi/KpiBanner';
import DatasetCard from '@/components/datasets/DatasetCard';
import { LoadingScreen } from '@/components/ui/Spinner';

export default function HomePage() {
  const { data, isLoading } = useSWR<Kpi>('kpi', () => kpiApi.get().then((r) => r.data));

  return (
    <div>
      <KpiBanner />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Recent Datasets</h2>
          <Link href="/datasets" className="text-blue-600 text-sm font-medium hover:underline">
            View all →
          </Link>
        </div>

        {isLoading ? (
          <LoadingScreen />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.recentDatasets?.map((ds: any) => (
              <DatasetCard key={ds.id} dataset={ds} />
            ))}
            {(!data?.recentDatasets || data.recentDatasets.length === 0) && (
              <div className="col-span-3 text-center py-16 text-gray-400">
                <div className="text-5xl mb-3">📊</div>
                <p className="font-medium">No datasets yet</p>
                <p className="text-sm mt-1">Be the first to publish a dataset.</p>
                <Link href="/datasets/new" className="btn-primary mt-4 inline-flex">
                  Publish Dataset
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Feature highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          {[
            {
              icon: '🔒',
              title: 'Fine-grained Access Control',
              desc: 'Control who can see your data at the dataset, row, and column level.',
            },
            {
              icon: '🔍',
              title: 'Secure Preview Without Exposure',
              desc: 'Share statistical summaries of restricted data without leaking raw values.',
            },
            {
              icon: '📋',
              title: 'Full Audit Trail',
              desc: 'Every access, download, and change is logged with user, IP, and timestamp.',
            },
          ].map((f) => (
            <div key={f.title} className="card p-6 text-center">
              <div className="text-4xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
