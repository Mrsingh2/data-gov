'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { datasetsApi } from '@/lib/api';
import DatasetCard from '@/components/datasets/DatasetCard';
import DatasetSearch from '@/components/datasets/DatasetSearch';
import { LoadingScreen } from '@/components/ui/Spinner';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Dataset } from '@/types/api';

function DatasetList() {
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();
  const params: Record<string, string> = {};
  searchParams.forEach((v, k) => { params[k] = v; });

  const { data, isLoading, error } = useSWR(
    ['datasets', params],
    () => datasetsApi.search(params).then((r) => r.data),
  );

  if (isLoading) return <LoadingScreen />;
  if (error) return <p className="text-red-500">Failed to load datasets.</p>;

  const datasets: Dataset[] = data?.datasets || [];

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {data?.total ?? 0} dataset{data?.total !== 1 ? 's' : ''} found
        </p>
        {isAuthenticated && (
          <Link href="/dashboard/datasets/new" className="btn-primary text-sm">
            + Publish Dataset
          </Link>
        )}
      </div>
      {datasets.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">🔍</div>
          <p className="font-medium">No datasets match your search</p>
          <p className="text-sm mt-1">Try different keywords or clear filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {datasets.map((ds) => (
            <DatasetCard key={ds.id} dataset={ds} />
          ))}
        </div>
      )}
    </>
  );
}

export default function DatasetsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dataset Discovery</h1>
      <Suspense>
        <DatasetSearch />
        <DatasetList />
      </Suspense>
    </div>
  );
}
