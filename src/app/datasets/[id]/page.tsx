'use client';

import { use, useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { datasetsApi, downloadsApi } from '@/lib/api';
import { Dataset } from '@/types/api';
import { useAuth } from '@/context/AuthContext';
import { LoadingScreen } from '@/components/ui/Spinner';
import { AccessBadge, VisibilityBadge } from '@/components/ui/Badge';
import DatasetPreview from '@/components/datasets/DatasetPreview';
import AccessRequestForm from '@/components/access/AccessRequestForm';

export default function DatasetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { isAuthenticated, user } = useAuth();
  const [downloading, setDownloading] = useState(false);
  const [requestRefresh, setRequestRefresh] = useState(0);

  const { data: dataset, mutate, isLoading, error } = useSWR<Dataset>(
    `dataset-${id}`,
    () => datasetsApi.findOne(id).then((r) => r.data),
  );

  if (isLoading) return <LoadingScreen />;
  if (error) {
    const status = error.response?.status;
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">{status === 403 ? '🔒' : '❌'}</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {status === 403 ? 'Access Denied' : 'Dataset Not Found'}
        </h2>
        <p className="text-gray-500 text-sm">
          {status === 403
            ? 'You do not have permission to view this dataset.'
            : 'This dataset does not exist.'}
        </p>
        <Link href="/datasets" className="btn-primary mt-6 inline-flex">Back to Datasets</Link>
      </div>
    );
  }
  if (!dataset) return null;

  const { userAccess } = dataset;
  const isOwner = userAccess?.isOwner || dataset.ownerId === user?.id;
  const hasGrant = userAccess?.hasGrant;
  const requestStatus = userAccess?.requestStatus;
  const canDownload = isOwner || hasGrant ||
    dataset.accessClassification === 'OPEN' ||
    dataset.accessClassification === 'REGISTERED';

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await downloadsApi.download(id);
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${dataset.title.replace(/[^a-z0-9]/gi, '_')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      mutate();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link href="/datasets" className="text-blue-600 text-sm hover:underline">
          ← Back to datasets
        </Link>
      </div>

      <div className="card p-6 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <VisibilityBadge visibility={dataset.visibility} />
              <AccessBadge level={dataset.accessClassification} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{dataset.title}</h1>
            <p className="text-gray-600">{dataset.description}</p>
            {dataset.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {dataset.tags.map((t) => (
                  <span key={t} className="text-xs bg-gray-100 text-gray-600 rounded px-2 py-0.5">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 min-w-36">
            {isAuthenticated && canDownload && (
              <button
                className="btn-primary"
                onClick={handleDownload}
                disabled={downloading}
              >
                {downloading ? 'Downloading...' : 'Download CSV'}
              </button>
            )}
            {isOwner && (
              <Link
                href={`/dashboard/datasets/${id}`}
                className="btn-secondary text-center text-sm"
              >
                Manage Dataset
              </Link>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-6 mt-4 pt-4 border-t border-gray-100 text-sm text-gray-500">
          <span>By <strong className="text-gray-700">{dataset.owner?.name}</strong></span>
          <span>{dataset.viewCount} views</span>
          <span>{dataset.downloadCount} downloads</span>
          <span>Updated {new Date(dataset.updatedAt).toLocaleDateString()}</span>
          {dataset.dataVersions?.[0] && (
            <span>{dataset.dataVersions[0].rowCount?.toLocaleString()} rows</span>
          )}
        </div>
      </div>

      {/* Access Request */}
      {isAuthenticated && !isOwner && dataset.accessClassification === 'RESTRICTED' && !hasGrant && (
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Request Access</h2>
          {requestStatus === 'PENDING' ? (
            <p className="text-amber-700 bg-amber-50 rounded p-3 text-sm">
              Your access request is pending review by the dataset owner.
            </p>
          ) : requestStatus === 'REJECTED' ? (
            <div>
              <p className="text-red-700 bg-red-50 rounded p-3 text-sm mb-3">
                Your previous request was rejected. You may submit a new request.
              </p>
              <AccessRequestForm
                datasetId={id}
                onSuccess={() => { mutate(); setRequestRefresh((r) => r + 1); }}
              />
            </div>
          ) : (
            <AccessRequestForm
              datasetId={id}
              onSuccess={() => { mutate(); setRequestRefresh((r) => r + 1); }}
            />
          )}
        </div>
      )}

      {/* Restricted dataset, no access */}
      {!isAuthenticated && dataset.accessClassification !== 'OPEN' && (
        <div className="card p-6 mb-6 bg-amber-50 border-amber-200">
          <p className="text-amber-800 text-sm">
            <Link href="/auth/login" className="font-medium underline">Sign in</Link>{' '}
            to {dataset.accessClassification === 'REGISTERED' ? 'download this dataset' : 'request access'}.
          </p>
        </div>
      )}

      {/* Preview / Statistics */}
      <div className="card p-6 mb-6">
        <DatasetPreview datasetId={id} />
      </div>

      {/* Version History */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Version History</h2>
          {isOwner && (
            <Link href={`/dashboard/datasets/${id}`} className="text-blue-600 text-sm hover:underline">
              Manage versions →
            </Link>
          )}
        </div>
        {dataset.dataVersions?.length === 0 || !dataset.dataVersions ? (
          <p className="text-gray-500 text-sm">No data uploaded yet.</p>
        ) : (
          <div className="space-y-2">
            {dataset.dataVersions.map((v) => (
              <div key={v.id} className="flex items-center justify-between border border-gray-100 rounded-lg px-4 py-3 text-sm">
                <div>
                  <span className="font-medium">v{v.versionNumber}</span>
                  <span className="text-gray-400 ml-2">{v.fileName}</span>
                  {v.isLatest && (
                    <span className="ml-2 text-xs bg-green-100 text-green-700 rounded px-1.5 py-0.5">
                      Latest
                    </span>
                  )}
                </div>
                <div className="text-gray-400">{v.rowCount?.toLocaleString()} rows</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
