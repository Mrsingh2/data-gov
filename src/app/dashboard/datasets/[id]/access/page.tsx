'use client';

import { use, useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { accessApi } from '@/lib/api';
import { AccessRequest } from '@/types/api';
import { LoadingScreen } from '@/components/ui/Spinner';
import Spinner from '@/components/ui/Spinner';

export default function AccessRequestsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [processing, setProcessing] = useState(false);

  const { data: allRequests, mutate, isLoading } = useSWR<AccessRequest[]>(
    `pending-requests-${id}`,
    () => accessApi.pending().then((r) => r.data.filter((req: AccessRequest) => req.dataset?.id === id)),
  );

  const handleReview = async (requestId: string, status: 'APPROVED' | 'REJECTED') => {
    setProcessing(true);
    try {
      await accessApi.review(requestId, { status, reviewNote });
      setReviewingId(null);
      setReviewNote('');
      mutate();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Review failed');
    } finally {
      setProcessing(false);
    }
  };

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-4">
        <Link href={`/dashboard/datasets/${id}`} className="text-blue-600 text-sm hover:underline">
          ← Back to Dataset Management
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Access Requests</h1>

      {!allRequests || allRequests.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">✅</div>
          <p>No pending access requests for this dataset.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {allRequests.map((req) => (
            <div key={req.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{req.user?.name}</div>
                  <div className="text-sm text-gray-500">{req.user?.email}</div>
                  {req.message && (
                    <p className="text-sm text-gray-600 mt-2 bg-gray-50 rounded p-2">
                      "{req.message}"
                    </p>
                  )}
                  <div className="text-xs text-gray-400 mt-1">
                    Requested {new Date(req.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  {reviewingId === req.id ? (
                    <div className="space-y-2 min-w-48">
                      <textarea
                        className="input text-xs h-16 resize-none"
                        placeholder="Review note (optional)"
                        value={reviewNote}
                        onChange={(e) => setReviewNote(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <button
                          className="btn-primary text-xs flex-1"
                          onClick={() => handleReview(req.id, 'APPROVED')}
                          disabled={processing}
                        >
                          {processing ? <Spinner size="sm" /> : 'Approve'}
                        </button>
                        <button
                          className="btn-danger text-xs flex-1"
                          onClick={() => handleReview(req.id, 'REJECTED')}
                          disabled={processing}
                        >
                          Reject
                        </button>
                      </div>
                      <button
                        className="btn-secondary text-xs w-full"
                        onClick={() => setReviewingId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      className="btn-primary text-sm"
                      onClick={() => setReviewingId(req.id)}
                    >
                      Review
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
