'use client';

import { useState, useRef } from 'react';
import { uploadApi } from '@/lib/api';
import Spinner from '@/components/ui/Spinner';

interface Props {
  datasetId: string;
  onSuccess?: (result: any) => void;
}

export default function CsvUploader({ datasetId, onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [changeNote, setChangeNote] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f?.name.endsWith('.csv')) setFile(f);
    else setError('Please drop a CSV file');
  };

  const handleUpload = async () => {
    if (!file) return;
    setError('');
    setSuccess('');
    setUploading(true);
    try {
      const res = await uploadApi.uploadCsv(datasetId, file, changeNote);
      setSuccess(`Uploaded version ${res.data.versionNumber} with ${res.data.rowCount} rows.`);
      setFile(null);
      setChangeNote('');
      onSuccess?.(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition-colors"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) setFile(f);
          }}
        />
        {file ? (
          <div className="space-y-1">
            <div className="text-green-600 font-medium">{file.name}</div>
            <div className="text-gray-500 text-sm">
              {(file.size / 1024).toFixed(1)} KB — click to change
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-gray-400 text-4xl">📁</div>
            <div className="text-gray-600 font-medium">Drop CSV here or click to browse</div>
            <div className="text-gray-400 text-sm">Maximum 50 MB</div>
          </div>
        )}
      </div>

      <div>
        <label className="label">Change note (optional)</label>
        <input
          type="text"
          className="input"
          placeholder="What changed in this version?"
          value={changeNote}
          onChange={(e) => setChangeNote(e.target.value)}
        />
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {success && <p className="text-green-600 text-sm">{success}</p>}

      <button
        className="btn-primary w-full"
        disabled={!file || uploading}
        onClick={handleUpload}
      >
        {uploading ? (
          <span className="flex items-center gap-2">
            <Spinner size="sm" />
            Uploading...
          </span>
        ) : (
          'Upload CSV'
        )}
      </button>
    </div>
  );
}
