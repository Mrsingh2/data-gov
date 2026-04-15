'use client';

import { useState } from 'react';
import { accessApi } from '@/lib/api';
import Spinner from '@/components/ui/Spinner';

interface Props {
  datasetId: string;
  onSuccess?: () => void;
}

export default function AccessRequestForm({ datasetId, onSuccess }: Props) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await accessApi.request(datasetId, message);
      setSuccess(true);
      onSuccess?.();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send request');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700 text-sm">
        Access request submitted. The dataset owner will review your request.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="label">Message to owner (optional)</label>
        <textarea
          className="input resize-none h-24"
          placeholder="Explain why you need access..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? <Spinner size="sm" /> : 'Request Access'}
      </button>
    </form>
  );
}
