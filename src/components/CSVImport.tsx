import { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { CSVRow, parseCSV } from '../store';

interface CSVImportProps {
  onImport: (rows: CSVRow[]) => void;
  onClose: () => void;
  theme?: string;
}

export function CSVImport({ onImport, onClose, theme = 'dark' }: CSVImportProps) {
  const [rows, setRows] = useState<CSVRow[]>([]);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setFileName(file.name);

    if (!file.name.endsWith('.csv') && !file.type.includes('csv')) {
      setError('Please upload a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.length === 0) {
        setError('No valid data found. Make sure your CSV has "company" and "name" columns.');
      } else {
        setRows(parsed);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (rows.length > 0) {
      onImport(rows);
    }
  };

  return (
    <div className="space-y-4">
      <div className={`rounded-xl p-4 border ${
        theme === 'dark' ? 'bg-brand-500/5 border-brand-500/20' : 'bg-blue-50 border-blue-200'
      }`}>
        <h4 className={`text-xs font-semibold mb-1 ${theme === 'dark' ? 'text-brand-300' : 'text-blue-800'}`}>CSV Format</h4>
        <p className={`text-xs ${theme === 'dark' ? 'text-brand-400/80' : 'text-blue-600'}`}>
          Your CSV should have columns: <code className={`px-1 rounded ${theme === 'dark' ? 'bg-brand-500/10' : 'bg-blue-100'}`}>company</code>, <code className={`px-1 rounded ${theme === 'dark' ? 'bg-brand-500/10' : 'bg-blue-100'}`}>name</code> (required), and optionally <code className={`px-1 rounded ${theme === 'dark' ? 'bg-brand-500/10' : 'bg-blue-100'}`}>title</code>, <code className={`px-1 rounded ${theme === 'dark' ? 'bg-brand-500/10' : 'bg-blue-100'}`}>linkedin</code>, <code className={`px-1 rounded ${theme === 'dark' ? 'bg-brand-500/10' : 'bg-blue-100'}`}>tags</code>, <code className={`px-1 rounded ${theme === 'dark' ? 'bg-brand-500/10' : 'bg-blue-100'}`}>stage</code>
        </p>
      </div>

      {!rows.length && (
        <div
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            theme === 'dark'
              ? 'border-white/[0.1] hover:border-brand-500/40 hover:bg-brand-500/5'
              : 'border-surface-300 hover:border-brand-400 hover:bg-brand-50/30'
          }`}
        >
          <Upload size={32} className={`mx-auto mb-2 ${theme === 'dark' ? 'text-surface-500' : 'text-surface-400'}`} />
          <p className={`text-sm font-medium ${theme === 'dark' ? 'text-surface-300' : 'text-surface-600'}`}>Click to upload CSV file</p>
          <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-surface-500' : 'text-surface-400'}`}>or drag and drop</p>
          {fileName && (
            <div className={`flex items-center justify-center gap-1.5 mt-3 text-xs ${theme === 'dark' ? 'text-surface-400' : 'text-surface-500'}`}>
              <FileText size={12} />
              {fileName}
            </div>
          )}
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleFile}
      />

      {error && (
        <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
          <AlertCircle size={14} className="text-rose-400 shrink-0" />
          <p className="text-xs text-rose-400">{error}</p>
        </div>
      )}

      {rows.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 size={16} />
            <span className="text-sm font-medium">{rows.length} contacts found</span>
          </div>

          <div className={`max-h-60 overflow-y-auto border rounded-xl ${
            theme === 'dark' ? 'border-white/[0.06]' : 'border-surface-200'
          }`}>
            <table className="w-full text-xs">
              <thead className={`sticky top-0 ${theme === 'dark' ? 'bg-surface-800' : 'bg-surface-50'}`}>
                <tr>
                  <th className={`text-left px-3 py-2 font-semibold ${theme === 'dark' ? 'text-surface-400' : 'text-surface-600'}`}>Company</th>
                  <th className={`text-left px-3 py-2 font-semibold ${theme === 'dark' ? 'text-surface-400' : 'text-surface-600'}`}>Name</th>
                  <th className={`text-left px-3 py-2 font-semibold ${theme === 'dark' ? 'text-surface-400' : 'text-surface-600'}`}>Title</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${theme === 'dark' ? 'divide-white/[0.04]' : 'divide-surface-100'}`}>
                {rows.slice(0, 20).map((row, i) => (
                  <tr key={i} className={theme === 'dark' ? 'hover:bg-white/[0.02]' : 'hover:bg-surface-50'}>
                    <td className={`px-3 py-2 ${theme === 'dark' ? 'text-surface-300' : 'text-surface-700'}`}>{row.company}</td>
                    <td className={`px-3 py-2 ${theme === 'dark' ? 'text-surface-300' : 'text-surface-700'}`}>{row.name}</td>
                    <td className={`px-3 py-2 ${theme === 'dark' ? 'text-surface-500' : 'text-surface-500'}`}>{row.title || '-'}</td>
                  </tr>
                ))}
                {rows.length > 20 && (
                  <tr>
                    <td colSpan={3} className={`px-3 py-2 text-center ${theme === 'dark' ? 'text-surface-500' : 'text-surface-400'}`}>
                      ...and {rows.length - 20} more rows
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <button
          onClick={onClose}
          className={theme === 'dark' ? 'btn-secondary' : 'btn-secondary-light'}
        >
          Cancel
        </button>
        {rows.length > 0 && (
          <button
            onClick={handleImport}
            className="btn-primary flex items-center gap-2"
          >
            <Upload size={14} />
            Import {rows.length} Contacts
          </button>
        )}
      </div>
    </div>
  );
}
