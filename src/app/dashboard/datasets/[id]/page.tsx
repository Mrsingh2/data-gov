'use client';

import { use, useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { datasetsApi, versionsApi, protectionApi } from '@/lib/api';
import { Dataset, DataVersion, MetadataVersion, ColumnProtectionRule, RowProtectionRule } from '@/types/api';
import { LoadingScreen } from '@/components/ui/Spinner';
import CsvUploader from '@/components/datasets/CsvUploader';
import ProtectionRuleForm from '@/components/datasets/ProtectionRuleForm';
import Spinner from '@/components/ui/Spinner';

type Tab = 'overview' | 'upload' | 'protection' | 'versions';

export default function ManageDatasetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [tab, setTab] = useState<Tab>('overview');
  const [editMode, setEditMode] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [visibility, setVisibility] = useState('');
  const [access, setAccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const { data: dataset, mutate } = useSWR<Dataset>(
    `dataset-${id}`,
    () => datasetsApi.findOne(id).then((r) => r.data),
    {
      onSuccess: (d) => {
        if (!editMode) {
          setTitle(d.title);
          setDescription(d.description);
          setTags(d.tags?.join(', ') || '');
          setVisibility(d.visibility);
          setAccess(d.accessClassification);
        }
      },
    },
  );

  const { data: dataVersions, mutate: mutateVersions } = useSWR<DataVersion[]>(
    `data-versions-${id}`,
    () => versionsApi.data(id).then((r) => r.data),
  );

  const { data: metaVersions } = useSWR<MetadataVersion[]>(
    tab === 'versions' ? `meta-versions-${id}` : null,
    () => versionsApi.metadata(id).then((r) => r.data),
  );

  const { data: colRules, mutate: mutateColRules } = useSWR<ColumnProtectionRule[]>(
    tab === 'protection' ? `col-rules-${id}` : null,
    () => protectionApi.getColumnRules(id).then((r) => r.data),
  );

  const { data: rowRules, mutate: mutateRowRules } = useSWR<RowProtectionRule[]>(
    tab === 'protection' ? `row-rules-${id}` : null,
    () => protectionApi.getRowRules(id).then((r) => r.data),
  );

  if (!dataset) return <LoadingScreen />;

  const latestVersion = dataVersions?.find((v) => v.isLatest);

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      await datasetsApi.update(id, {
        title, description,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        visibility,
        accessClassification: access,
      });
      setEditMode(false);
      mutate();
    } catch (err: any) {
      setSaveError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'upload', label: 'Upload CSV' },
    { key: 'protection', label: 'Protection Rules' },
    { key: 'versions', label: 'Version History' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-4">
        <Link href="/dashboard/datasets" className="text-blue-600 text-sm hover:underline">
          ← My Datasets
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">{dataset.title}</h1>
        <div className="flex gap-2">
          <Link href={`/datasets/${id}`} className="btn-secondary text-sm">
            View Public Page
          </Link>
          <Link href={`/dashboard/datasets/${id}/access`} className="btn-secondary text-sm">
            Access Requests
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="card p-6 space-y-4">
          {editMode ? (
            <>
              <div>
                <label className="label">Title</label>
                <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input h-24 resize-none" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div>
                <label className="label">Tags (comma-separated)</label>
                <input className="input" value={tags} onChange={(e) => setTags(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Visibility</label>
                  <select className="input" value={visibility} onChange={(e) => setVisibility(e.target.value)}>
                    <option value="PUBLIC">Public</option>
                    <option value="PRIVATE">Private</option>
                  </select>
                </div>
                <div>
                  <label className="label">Access Classification</label>
                  <select className="input" value={access} onChange={(e) => setAccess(e.target.value)}>
                    <option value="OPEN">Open</option>
                    <option value="REGISTERED">Registered</option>
                    <option value="RESTRICTED">Restricted</option>
                  </select>
                </div>
              </div>
              {saveError && <p className="text-red-600 text-sm">{saveError}</p>}
              <div className="flex gap-2">
                <button className="btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? <Spinner size="sm" /> : 'Save Changes'}
                </button>
                <button className="btn-secondary" onClick={() => setEditMode(false)}>Cancel</button>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-end">
                <button className="btn-secondary text-sm" onClick={() => setEditMode(true)}>
                  Edit Metadata
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">Visibility:</span> <strong>{dataset.visibility}</strong></div>
                <div><span className="text-gray-500">Access:</span> <strong>{dataset.accessClassification}</strong></div>
                <div><span className="text-gray-500">Views:</span> <strong>{dataset.viewCount}</strong></div>
                <div><span className="text-gray-500">Downloads:</span> <strong>{dataset.downloadCount}</strong></div>
                {latestVersion && (
                  <>
                    <div><span className="text-gray-500">Latest version:</span> <strong>v{latestVersion.versionNumber}</strong></div>
                    <div><span className="text-gray-500">Rows:</span> <strong>{latestVersion.rowCount?.toLocaleString()}</strong></div>
                    <div><span className="text-gray-500">Columns:</span> <strong>{latestVersion.columnNames?.length}</strong></div>
                  </>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600">{dataset.description}</p>
              </div>
              {dataset.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {dataset.tags.map((t) => (
                    <span key={t} className="text-xs bg-gray-100 text-gray-600 rounded px-2 py-0.5">{t}</span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Upload Tab */}
      {tab === 'upload' && (
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Upload New CSV Version</h2>
          <CsvUploader datasetId={id} onSuccess={() => mutateVersions()} />
        </div>
      )}

      {/* Protection Tab */}
      {tab === 'protection' && (
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-2">Protection Rules</h2>
          <p className="text-sm text-gray-500 mb-4">
            Define how sensitive columns and rows are protected. Rules are applied when data is served.
          </p>
          <ProtectionRuleForm
            datasetId={id}
            columnNames={latestVersion?.columnNames || []}
            columnRules={colRules || []}
            rowRules={rowRules || []}
            onRefresh={() => { mutateColRules(); mutateRowRules(); }}
          />
        </div>
      )}

      {/* Versions Tab */}
      {tab === 'versions' && (
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Data Versions</h2>
            {!dataVersions ? <LoadingScreen /> : dataVersions.length === 0 ? (
              <p className="text-gray-400 text-sm">No CSV uploaded yet.</p>
            ) : (
              <div className="space-y-2">
                {dataVersions.map((v) => (
                  <div key={v.id} className="flex items-center justify-between border border-gray-100 rounded-lg px-4 py-3 text-sm">
                    <div>
                      <span className="font-medium">v{v.versionNumber}</span>
                      <span className="text-gray-400 ml-2">{v.fileName}</span>
                      {v.isLatest && <span className="ml-2 text-xs bg-green-100 text-green-700 rounded px-1.5 py-0.5">Latest</span>}
                      {v.changeNote && <span className="text-gray-400 ml-2 italic">{v.changeNote}</span>}
                    </div>
                    <div className="text-gray-400 text-xs">{v.rowCount?.toLocaleString()} rows · {new Date(v.createdAt).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Metadata Versions</h2>
            {!metaVersions ? <LoadingScreen /> : metaVersions.length === 0 ? (
              <p className="text-gray-400 text-sm">No versions recorded.</p>
            ) : (
              <div className="space-y-2">
                {metaVersions.map((v) => (
                  <div key={v.id} className="border border-gray-100 rounded-lg px-4 py-3 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">v{v.versionNumber}</span>
                      <span className="text-gray-400 text-xs">{new Date(v.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="text-gray-600 mt-1">{v.title}</div>
                    {v.changeNote && <div className="text-gray-400 text-xs italic mt-0.5">{v.changeNote}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
