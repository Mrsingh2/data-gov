'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { datasetsApi, accessApi, downloadsApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Dataset, AccessRequest, Download } from '@/types/api';
import { LoadingScreen } from '@/components/ui/Spinner';
import { AccessBadge } from '@/components/ui/Badge';

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth();

  const { data: myDatasets } = useSWR<Dataset[]>(
    isAuthenticated ? 'my-datasets' : null,
    () => datasetsApi.mine().then((r) => r.data),
  );

  const { data: myRequests } = useSWR<AccessRequest[]>(
    isAuthenticated ? 'my-access-requests' : null,
    () => accessApi.mine().then((r) => r.data),
  );

  const { data: myDownloads } = useSWR<Download[]>(
    isAuthenticated ? 'my-downloads' : null,
    () => downloadsApi.myDownloads().then((r) => r.data),
  );

  const { data: pendingRequests } = useSWR<AccessRequest[]>(
    isAuthenticated && (user?.role === 'OWNER' || user?.role === 'ADMIN')
      ? 'pending-requests'
      : null,
    () => accessApi.pending().then((r) => r.data),
  );

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold">Please sign in to view your dashboard.</h2>
        <Link href="/auth/login" className="btn-primary mt-4 inline-flex">Sign in</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {user?.name}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Role: <span className="font-medium capitalize">{user?.role?.toLowerCase()}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'My Datasets', value: myDatasets?.length ?? 0, href: '/dashboard/datasets' },
          { label: 'Downloads', value: myDownloads?.length ?? 0, href: '/dashboard/downloads' },
          { label: 'Access Requests', value: myRequests?.length ?? 0, href: null },
          {
            label: 'Pending Reviews',
            value: pendingRequests?.length ?? 0,
            href: null,
            highlight: (pendingRequests?.length ?? 0) > 0,
          },
        ].map((stat) => (
          <div key={stat.label} className={`card p-5 ${stat.highlight ? 'border-orange-300 bg-orange-50' : ''}`}>
            <div className={`text-2xl font-bold ${stat.highlight ? 'text-orange-600' : 'text-blue-600'}`}>
              {stat.value}
            </div>
            <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
            {stat.href && (
              <Link href={stat.href} className="text-xs text-blue-600 hover:underline mt-2 block">
                View all →
              </Link>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Datasets */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">My Datasets</h2>
            <div className="flex gap-2">
              <Link href="/dashboard/datasets/new" className="btn-primary text-xs">
                + New
              </Link>
              <Link href="/dashboard/datasets" className="btn-secondary text-xs">
                View all
              </Link>
            </div>
          </div>
          {!myDatasets ? (
            <LoadingScreen />
          ) : myDatasets.length === 0 ? (
            <p className="text-gray-400 text-sm">No datasets yet.</p>
          ) : (
            <div className="space-y-2">
              {myDatasets.slice(0, 5).map((ds) => (
                <div key={ds.id} className="flex items-center justify-between text-sm border-b border-gray-50 pb-2">
                  <Link href={`/datasets/${ds.id}`} className="font-medium text-gray-800 hover:text-blue-600 truncate max-w-48">
                    {ds.title}
                  </Link>
                  <div className="flex items-center gap-2">
                    <AccessBadge level={ds.accessClassification} />
                    <Link href={`/dashboard/datasets/${ds.id}`} className="text-blue-600 text-xs hover:underline">
                      Manage
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Access Requests to Review */}
        {(user?.role === 'OWNER' || user?.role === 'ADMIN') && (
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Pending Access Requests</h2>
            {!pendingRequests ? (
              <LoadingScreen />
            ) : pendingRequests.length === 0 ? (
              <p className="text-gray-400 text-sm">No pending requests.</p>
            ) : (
              <div className="space-y-3">
                {pendingRequests.slice(0, 5).map((req) => (
                  <div key={req.id} className="border border-amber-200 bg-amber-50 rounded-lg p-3 text-sm">
                    <div className="font-medium text-gray-900">{req.user?.name} ({req.user?.email})</div>
                    <div className="text-gray-500 text-xs">wants access to: {req.dataset?.title}</div>
                    <Link
                      href={`/dashboard/datasets/${req.dataset?.id}/access`}
                      className="text-blue-600 text-xs hover:underline mt-1 block"
                    >
                      Review →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recent Downloads */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recent Downloads</h2>
            <Link href="/dashboard/downloads" className="btn-secondary text-xs">View all</Link>
          </div>
          {!myDownloads ? (
            <LoadingScreen />
          ) : myDownloads.length === 0 ? (
            <p className="text-gray-400 text-sm">No downloads yet.</p>
          ) : (
            <div className="space-y-2">
              {myDownloads.slice(0, 5).map((dl) => (
                <div key={dl.id} className="flex items-center justify-between text-sm border-b border-gray-50 pb-2">
                  <Link href={`/datasets/${dl.dataset?.id}`} className="text-gray-700 hover:text-blue-600 truncate max-w-48">
                    {dl.dataset?.title}
                  </Link>
                  <span className="text-gray-400 text-xs">
                    {new Date(dl.downloadedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Access Requests */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">My Access Requests</h2>
          {!myRequests ? (
            <LoadingScreen />
          ) : myRequests.length === 0 ? (
            <p className="text-gray-400 text-sm">No access requests submitted.</p>
          ) : (
            <div className="space-y-2">
              {myRequests.slice(0, 5).map((req) => (
                <div key={req.id} className="flex items-center justify-between text-sm border-b border-gray-50 pb-2">
                  <Link href={`/datasets/${req.dataset?.id}`} className="text-gray-700 hover:text-blue-600 truncate max-w-40">
                    {req.dataset?.title}
                  </Link>
                  <span className={`text-xs font-medium rounded px-2 py-0.5 ${
                    req.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                    req.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {req.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
