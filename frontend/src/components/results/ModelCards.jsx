import React from "react";
import { Award, Download, Activity } from "lucide-react";

export default function ModelCards({
  regressionResults,
  selectedModel,
  setSelectedModel,
  activeModel,
  onExportChart,
  onExportData,
}) {
  if (!regressionResults || !Array.isArray(regressionResults.allModels)) {
    return null;
  }

  const models = regressionResults.allModels;

  function fmtR2(r2) {
    if (r2 === null || r2 === undefined || Number.isNaN(r2)) return "N/A";
    return Number(r2).toFixed(6);
  }

  function fmtAIC(aic) {
    if (
      aic === null ||
      aic === undefined ||
      aic === Infinity ||
      aic === -Infinity ||
      Number.isNaN(aic)
    )
      return "N/A";
    return Number(aic).toFixed(4);
  }

  return (
    <div className="space-y-6">
      {/* Best / Selected Model Card */}
      <div className="mb-6 relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl opacity-20 blur transition duration-300"></div>
        <div className="relative bg-slate-900/90 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="flex items-center gap-2 text-xl font-semibold text-green-400">
              <Award className="w-5 h-5" />
              {selectedModel === "AUTO" ? "Best Fit Model" : "Selected Model"}
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={exportChart}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-sm transition-all border border-slate-600"
              >
                <Download className="w-4 h-4" />
                Export JPG
              </button>
              <button
                onClick={() => exportData("csv")}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-sm transition-all border border-slate-600"
              >
                <Download className="w-4 h-4" />
                CSV
              </button>
              <button
                onClick={() => exportData("json")}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-sm transition-all border border-slate-600"
              >
                <Download className="w-4 h-4" />
                JSON
              </button>
            </div>
          </div>
          <div className="bg-slate-950/50 p-6 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-slate-400 mb-1">Model Type</p>
                <p className="text-2xl font-bold text-cyan-400">
                  {activeModel?.model}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Equation</p>
                <p className="text-lg font-mono text-purple-400 break-all">
                  {activeModel?.equation}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">R² Score</p>
                <p className="text-2xl font-bold text-green-400">
                  {activeModel?.r2 === null || isNaN(activeModel?.r2)
                    ? "N/A"
                    : activeModel?.r2.toFixed(6)}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {activeModel?.r2 === 1
                    ? "Perfect fit"
                    : activeModel?.r2 > 0.95
                      ? "Excellent fit"
                      : activeModel?.r2 > 0.85
                        ? "Good fit"
                        : activeModel?.r2 > 0.7
                          ? "Moderate fit"
                          : "Poor fit"}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">AIC Value</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {activeModel?.aic === null ||
                  activeModel?.aic === Infinity ||
                  activeModel?.aic === -Infinity ||
                  isNaN(activeModel?.aic)
                    ? "N/A"
                    : activeModel?.aic.toFixed(4)}
                </p>
                <p className="text-xs text-slate-500 mt-1">Lower is better</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* All Models Comparison Table */}
      <div className="mb-6 relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl opacity-20 blur transition duration-300"></div>
        <div className="relative bg-slate-900/90 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50">
          <h3 className="flex items-center gap-2 text-xl font-semibold mb-4 text-blue-400">
            <Activity className="w-5 h-5" />
            All Models Comparison
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-800">
                <tr>
                  <th className="px-4 py-3 text-slate-300 font-semibold">
                    Model
                  </th>
                  <th className="px-4 py-3 text-slate-300 font-semibold">
                    Equation
                  </th>
                  <th className="px-4 py-3 text-slate-300 font-semibold">R²</th>
                  <th className="px-4 py-3 text-slate-300 font-semibold">
                    AIC
                  </th>
                </tr>
              </thead>
              <tbody>
                {regressionResults.allModels.map((model, index) => (
                  <tr
                    key={index}
                    className={`border-b border-slate-800 hover:bg-slate-800/30 transition-colors ${
                      model.model === activeModel?.model
                        ? "bg-green-500/10"
                        : model.r2 === null || isNaN(model.r2)
                          ? "opacity-50"
                          : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <span className="text-cyan-400 font-semibold flex items-center gap-2">
                        {model.model}
                        {model.model === activeModel?.model && (
                          <Award className="w-4 h-4 text-yellow-400" />
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-300 font-mono text-xs">
                        {model.equation}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-green-400 font-mono">
                        {model.r2 === null || isNaN(model.r2)
                          ? "N/A"
                          : model.r2.toFixed(6)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-yellow-400 font-mono">
                        {model.aic === null ||
                        model.aic === Infinity ||
                        model.aic === -Infinity ||
                        isNaN(model.aic)
                          ? "N/A"
                          : model.aic.toFixed(4)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
