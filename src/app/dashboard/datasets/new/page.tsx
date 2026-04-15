'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { datasetsApi } from '@/lib/api';
import Spinner from '@/components/ui/Spinner';

const VISIBILITY_OPTIONS = [
  { value: 'PUBLIC', label: 'Public', desc: 'Visible to everyone and included in KPIs' },
  { value: 'PRIVATE', label: 'Private', desc: 'Only visible to you and granted users' },
];

const ACCESS_OPTIONS = [
  { value: 'OPEN', label: 'Open', desc: 'Anyone can download' },
  { value: 'REGISTERED', label: 'Registered', desc: 'Requires a free account' },
  { value: 'RESTRICTED', label: 'Restricted', desc: 'Requires explicit owner approval' },
];

export default function NewDatasetPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [visibility, setVisibility] = useState('PUBLIC');
  const [access, setAccess] = useState('OPEN');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await datasetsApi.create({
        title,
        description,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        visibility,
        accessClassification: access,
      });
      router.push(`/dashboard/datasets/${res.data.id}`);
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg || 'Failed to create dataset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Publish New Dataset</h1>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div>
          <label className="label">Title *</label>
          <input
            type="text"
            className="input"
            required
            minLength={3}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Indian Air Quality Index 2023"
          />
        </div>

        <div>
          <label className="label">Description *</label>
          <textarea
            className="input h-28 resize-none"
            required
            minLength={10}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what this dataset contains, its source, and intended use..."
          />
        </div>

        <div>
          <label className="label">Tags (comma-separated)</label>
          <input
            type="text"
            className="input"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g. environment, air-quality, india"
          />
        </div>

        <div>
          <label className="label">Visibility</label>
          <div className="space-y-2">
            {VISIBILITY_OPTIONS.map((opt) => (
              <label key={opt.value} className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  value={opt.value}
                  checked={visibility === opt.value}
                  onChange={() => setVisibility(opt.value)}
                  className="mt-0.5"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">{opt.label}</div>
                  <div className="text-xs text-gray-500">{opt.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Access Classification</label>
          <div className="space-y-2">
            {ACCESS_OPTIONS.map((opt) => (
              <label key={opt.value} className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="access"
                  value={opt.value}
                  checked={access === opt.value}
                  onChange={() => setAccess(opt.value)}
                  className="mt-0.5"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">{opt.label}</div>
                  <div className="text-xs text-gray-500">{opt.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {error && <p className="text-red-600 text-sm bg-red-50 rounded p-2">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn-primary flex-1" disabled={loading}>
            {loading ? <Spinner size="sm" /> : 'Create Dataset'}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => router.back()}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
