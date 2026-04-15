'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function DatasetSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get('q') || '');
  const [access, setAccess] = useState(searchParams.get('accessClassification') || '');
  const [visibility, setVisibility] = useState(searchParams.get('visibility') || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (access) params.set('accessClassification', access);
    if (visibility) params.set('visibility', visibility);
    router.push(`/datasets?${params.toString()}`);
  };

  const clearFilters = () => {
    setQ('');
    setAccess('');
    setVisibility('');
    router.push('/datasets');
  };

  return (
    <form onSubmit={handleSubmit} className="card p-4 mb-6">
      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          className="input flex-1 min-w-48"
          placeholder="Search by title, description, or tag..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="input w-40"
          value={access}
          onChange={(e) => setAccess(e.target.value)}
        >
          <option value="">All access types</option>
          <option value="OPEN">Open</option>
          <option value="REGISTERED">Registered</option>
          <option value="RESTRICTED">Restricted</option>
        </select>
        <select
          className="input w-36"
          value={visibility}
          onChange={(e) => setVisibility(e.target.value)}
        >
          <option value="">All visibility</option>
          <option value="PUBLIC">Public</option>
          <option value="PRIVATE">Private</option>
        </select>
        <button type="submit" className="btn-primary">
          Search
        </button>
        <button type="button" onClick={clearFilters} className="btn-secondary">
          Clear
        </button>
      </div>
    </form>
  );
}
