'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { downloadsApi } from '@/lib/api';
import { Download } from '@/types/api';
import { LoadingScreen } from '@/components/ui/Spinner';

export default function DownloadsPage() {
  const { data: downloads, isLoading } = useSWR<Download[]>(
    'my-downloads',
    () => downloadsApi.myDownloads().then((r) => r.data),
  );

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Download History</h1>

      {!downloads || downloads.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">📥</div>
          <p>No downloads yet.</p>
          <Link href="/datasets" className="btn-primary mt-4 inline-flex">Browse Datasets</Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs text-gray-500 font-medium uppercase tracking-wide">
                <th className="px-4 py-3">Dataset</th>
                <th className="px-4 py-3">Version</th>
                <th className="px-4 py-3">Downloaded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {downloads.map((dl) => (
                <tr key={dl.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/datasets/${dl.dataset?.id}`}
                      className="font-medium text-gray-900 hover:text-blue-600"
                    >
                      {dl.dataset?.title}
                    </Link>
                    <div className="text-xs text-gray-400">{dl.dataset?.visibility}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {dl.dataVersion
                      ? `v${dl.dataVersion.versionNumber} (${dl.dataVersion.fileName})`
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(dl.downloadedAt).toLocaleString()}
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
