'use client';

import useSWR from 'swr';
import { auditApi } from '@/lib/api';
import { LoadingScreen } from '@/components/ui/Spinner';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function AuditPage() {
  const { user, isAuthenticated } = useAuth();
  const { data, isLoading } = useSWR(
    isAuthenticated && user?.role === 'ADMIN' ? 'audit-logs' : null,
    () => auditApi.get({ limit: 100 }).then((r) => r.data),
  );

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-xl font-bold text-gray-900">Admin Access Only</h2>
        <Link href="/" className="btn-primary mt-4 inline-flex">Go Home</Link>
      </div>
    );
  }

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Audit Log</h1>
      <div className="card overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-500 font-medium uppercase tracking-wide">
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Dataset</th>
              <th className="px-4 py-3">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data?.logs?.map((log: any) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-gray-400">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="px-4 py-2">
                  <div className="font-medium text-gray-700">{log.user?.name || '—'}</div>
                  <div className="text-gray-400">{log.user?.email}</div>
                </td>
                <td className="px-4 py-2">
                  <span className="font-mono bg-gray-100 text-gray-700 rounded px-1.5 py-0.5">
                    {log.action}
                  </span>
                </td>
                <td className="px-4 py-2 text-gray-500">
                  {log.datasetId ? (
                    <Link href={`/datasets/${log.datasetId}`} className="text-blue-600 hover:underline">
                      {log.datasetId.substring(0, 8)}...
                    </Link>
                  ) : '—'}
                </td>
                <td className="px-4 py-2 text-gray-400">{log.ipAddress || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
