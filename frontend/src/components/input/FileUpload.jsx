import { Upload, Database, AlertCircle, CheckCircle } from "lucide-react";
import { useRegressionData } from "../../hooks/useRegressionData";

export function FileUpload() {
  const { filename, previewRows, handleFileChange } = useRegressionData();

  return (
    <div className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl opacity-20 group-hover:opacity-30 blur transition duration-300"></div>
      <div className="relative bg-slate-900/90 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50">
        <label className="flex items-center gap-2 text-lg font-semibold mb-4 text-purple-400">
          <Upload className="w-5 h-5" />
          File Upload
        </label>

        <div className="relative">
          <input
            aria-label="csv-upload"
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-600 rounded-xl hover:border-purple-500 transition-all cursor-pointer bg-slate-950/30 hover:bg-slate-950/50"
          >
            <Upload className="w-10 h-10 text-slate-500 mb-2" />
            <span className="text-sm text-slate-400">Click to upload CSV</span>
            <span className="text-xs text-slate-600 mt-1">
              or drag and drop
            </span>
          </label>
        </div>

        {filename && (
          <div className="mt-4 p-3 bg-slate-950/50 rounded-lg border border-slate-700">
            <p className="text-sm text-slate-300 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              {filename}
            </p>
          </div>
        )}

        {/* Preview Section */}
        <div className="mt-6">
          <h4 className="font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <Database className="w-4 h-4" />
            Data Preview
          </h4>
          {previewRows.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              No data to preview yet
            </div>
          ) : (
            <div className="overflow-auto max-h-64 rounded-lg border border-slate-700">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-800 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-slate-400 font-semibold">
                      #
                    </th>
                    <th className="px-4 py-2 text-slate-400 font-semibold">
                      X Value
                    </th>
                    <th className="px-4 py-2 text-slate-400 font-semibold">
                      Y Value
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, i) => (
                    <tr
                      key={i}
                      className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-4 py-2 text-slate-500">{i + 1}</td>
                      <td className="px-4 py-2 text-cyan-400 font-mono">
                        {row[0]}
                      </td>
                      <td className="px-4 py-2 text-purple-400 font-mono">
                        {row[1]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
