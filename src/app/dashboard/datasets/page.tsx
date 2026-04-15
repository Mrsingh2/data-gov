'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { datasetsApi } from '@/lib/api';
import { Dataset } from '@/types/api';
import { AccessBadge, VisibilityBadge } from '@/components/ui/Badge';
import { LoadingScreen } from '@/components/ui/Spinner';

export default function MyDatasetsPage() {
  const { data: datasets, mutate, isLoading } = useSWR<Dataset[]>(
    'my-datasets',
    () => datasetsApi.mine().then((r) => r.data),
  );

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Datasets</h1>
        <Link href="/dashboard/datasets/new" className="btn-primary">
          + Publish Dataset
        </Link>
      </div>

      {!datasets || datasets.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">📊</div>
          <p className="font-medium">No datasets published yet</p>
          <Link href="/dashboard/datasets/new" className="btn-primary mt-4 inline-flex">
            Publish your first dataset
          </Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs text-gray-500 font-medium uppercase tracking-wide">
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Visibility</th>
                <th className="px-4 py-3">Access</th>
                <th className="px-4 py-3">Versions</th>
                <th className="px-4 py-3">Views</th>
                <th className="px-4 py-3">Downloads</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {datasets.map((ds) => (
                <tr key={ds.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/datasets/${ds.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                      {ds.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <VisibilityBadge visibility={ds.visibility} />
                  </td>
                  <td className="px-4 py-3">
                    <AccessBadge level={ds.accessClassification} />
                  </td>
                  <td className="px-4 py-3 text-gray-500">{ds._count?.dataVersions ?? 0}</td>
                  <td className="px-4 py-3 text-gray-500">{ds.viewCount}</td>
                  <td className="px-4 py-3 text-gray-500">{ds.downloadCount}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link href={`/dashboard/datasets/${ds.id}`} className="text-blue-600 hover:underline text-xs">
                        Manage
                      </Link>
                      <Link href={`/dashboard/datasets/${ds.id}/access`} className="text-amber-600 hover:underline text-xs">
                        Requests {ds._count?.accessRequests ? `(${ds._count.accessRequests})` : ''}
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
