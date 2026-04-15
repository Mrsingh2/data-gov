'use client';

import { useState } from 'react';
import { protectionApi } from '@/lib/api';
import { ColumnProtectionRule, RowProtectionRule } from '@/types/api';

interface Props {
  datasetId: string;
  columnNames: string[];
  columnRules: ColumnProtectionRule[];
  rowRules: RowProtectionRule[];
  onRefresh: () => void;
}

export default function ProtectionRuleForm({
  datasetId,
  columnNames,
  columnRules,
  rowRules,
  onRefresh,
}: Props) {
  const [colName, setColName] = useState('');
  const [strategy, setStrategy] = useState('MASK');
  const [rowField, setRowField] = useState('');
  const [rowOp, setRowOp] = useState('eq');
  const [rowVal, setRowVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addColumnRule = async () => {
    if (!colName) return;
    setLoading(true);
    setError('');
    try {
      await protectionApi.addColumnRule(datasetId, { columnName: colName, strategy });
      setColName('');
      onRefresh();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add rule');
    } finally {
      setLoading(false);
    }
  };

  const addRowRule = async () => {
    if (!rowField || !rowVal) return;
    setLoading(true);
    setError('');
    try {
      await protectionApi.addRowRule(datasetId, { field: rowField, operator: rowOp, value: rowVal });
      setRowField('');
      setRowVal('');
      onRefresh();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add rule');
    } finally {
      setLoading(false);
    }
  };

  const removeColumnRule = async (ruleId: string) => {
    await protectionApi.deleteColumnRule(datasetId, ruleId);
    onRefresh();
  };

  const removeRowRule = async (ruleId: string) => {
    await protectionApi.deleteRowRule(datasetId, ruleId);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {error && <p className="text-red-600 text-sm">{error}</p>}

      {/* Column Rules */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Column Protection Rules</h4>
        <div className="flex gap-2 mb-3">
          <select
            className="input flex-1"
            value={colName}
            onChange={(e) => setColName(e.target.value)}
          >
            <option value="">Select column</option>
            {columnNames.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            className="input w-36"
            value={strategy}
            onChange={(e) => setStrategy(e.target.value)}
          >
            <option value="MASK">Mask</option>
            <option value="ANONYMIZE">Anonymize</option>
            <option value="SYNTHETIC">Synthetic</option>
          </select>
          <button className="btn-primary" onClick={addColumnRule} disabled={loading || !colName}>
            Add
          </button>
        </div>
        {columnRules.length > 0 && (
          <div className="space-y-1">
            {columnRules.map((r) => (
              <div key={r.id} className="flex items-center justify-between bg-gray-50 rounded px-3 py-2 text-sm">
                <span><strong>{r.columnName}</strong> → {r.strategy}</span>
                <button className="text-red-500 hover:text-red-700 text-xs" onClick={() => removeColumnRule(r.id)}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Row Rules */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Row Restriction Rules</h4>
        <p className="text-xs text-gray-500 mb-2">Rows matching these rules are marked restricted and hidden from unauthorized users.</p>
        <div className="flex gap-2 mb-3 flex-wrap">
          <select className="input w-36" value={rowField} onChange={(e) => setRowField(e.target.value)}>
            <option value="">Field</option>
            {columnNames.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="input w-32" value={rowOp} onChange={(e) => setRowOp(e.target.value)}>
            <option value="eq">equals</option>
            <option value="ne">not equals</option>
            <option value="lt">less than</option>
            <option value="lte">≤</option>
            <option value="gt">greater than</option>
            <option value="gte">≥</option>
            <option value="contains">contains</option>
          </select>
          <input className="input w-32" placeholder="Value" value={rowVal} onChange={(e) => setRowVal(e.target.value)} />
          <button className="btn-primary" onClick={addRowRule} disabled={loading || !rowField || !rowVal}>
            Add
          </button>
        </div>
        {rowRules.length > 0 && (
          <div className="space-y-1">
            {rowRules.map((r) => (
              <div key={r.id} className="flex items-center justify-between bg-red-50 rounded px-3 py-2 text-sm">
                <span>Restrict when <strong>{r.field}</strong> {r.operator} <strong>{r.value}</strong></span>
                <button className="text-red-500 hover:text-red-700 text-xs" onClick={() => removeRowRule(r.id)}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
