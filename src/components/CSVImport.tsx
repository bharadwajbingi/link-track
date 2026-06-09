import { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { CSVRow, parseCSV } from '../store';

interface CSVImportProps {
  onImport: (rows: CSVRow[]) => void;
  onClose: () => void;
}

export function CSVImport({ onImport, onClose }: CSVImportProps) {
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
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h4 className="text-xs font-semibold text-blue-800 mb-1">CSV Format</h4>
        <p className="text-xs text-blue-600">
          Your CSV should have columns: <code className="bg-blue-100 px-1 rounded">company</code>, <code className="bg-blue-100 px-1 rounded">name</code> (required), and optionally <code className="bg-blue-100 px-1 rounded">title</code>, <code className="bg-blue-100 px-1 rounded">linkedin</code>, <code className="bg-blue-100 px-1 rounded">tags</code>, <code className="bg-blue-100 px-1 rounded">stage</code>
        </p>
      </div>

      {!rows.length && (
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-all"
        >
          <Upload size={32} className="mx-auto text-slate-400 mb-2" />
          <p className="text-sm font-medium text-slate-600">Click to upload CSV file</p>
          <p className="text-xs text-slate-400 mt-1">or drag and drop</p>
          {fileName && (
            <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-slate-500">
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
        <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl">
          <AlertCircle size={14} className="text-rose-500 shrink-0" />
          <p className="text-xs text-rose-700">{error}</p>
        </div>
      )}

      {rows.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-emerald-700">
            <CheckCircle2 size={16} />
            <span className="text-sm font-medium">{rows.length} contacts found</span>
          </div>

          <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold text-slate-600">Company</th>
                  <th className="text-left px-3 py-2 font-semibold text-slate-600">Name</th>
                  <th className="text-left px-3 py-2 font-semibold text-slate-600">Title</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.slice(0, 20).map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-3 py-2 text-slate-700">{row.company}</td>
                    <td className="px-3 py-2 text-slate-700">{row.name}</td>
                    <td className="px-3 py-2 text-slate-500">{row.title || '-'}</td>
                  </tr>
                ))}
                {rows.length > 20 && (
                  <tr>
                    <td colSpan={3} className="px-3 py-2 text-center text-slate-400">
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
          className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
        >
          Cancel
        </button>
        {rows.length > 0 && (
          <button
            onClick={handleImport}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-2"
          >
            <Upload size={14} />
            Import {rows.length} Contacts
          </button>
        )}
      </div>
    </div>
  );
}
