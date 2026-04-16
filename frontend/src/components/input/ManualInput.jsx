import React from "react";
import { Zap, Trash2, TrendingUp } from "lucide-react";

export default function ManualInput({
  text,
  setText,
  equation,
  setEquation,
  inputMode,
  setInputMode,
  isAnalyzing,
  onAnalyze,
  onLoadSample,
  onClear,
}) {
  const textareaPlaceholder =
    inputMode === "pairs"
      ? "0,0\n1,2\n2,4\n3,6\n4,8"
      : inputMode === "x-only"
        ? "0\n1\n2\n3\n4"
        : "";

  const samples = [
    { key: "linear", label: "Linear" },
    { key: "quadratic", label: "Quadratic" },
    { key: "exponential", label: "Exponential" },
    { key: "cubic", label: "Cubic" },
    { key: "logarithmic", label: "Logarithmic" },
    { key: "power", label: "Power" },
    { key: "sine", label: "Sine" },
  ];

  return (
    <div className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl opacity-20 group-hover:opacity-30 blur transition duration-300"></div>
      <div className="relative bg-slate-900/90 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50">
        <div className="flex items-start justify-between mb-4">
          <label className="flex items-center gap-2 text-lg font-semibold text-cyan-400">
            <Zap className="w-5 h-5" />
            Manual Input
          </label>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400">Mode</label>
            <select
              value={inputMode}
              onChange={(e) => setInputMode(e.target.value)}
              className="bg-slate-800 text-slate-200 border border-slate-600 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="pairs">Pairs</option>
              <option value="x-only">X-only</option>
              <option value="equation">Equation</option>
            </select>
          </div>
        </div>

        {inputMode === "equation" ? (
          <input
            aria-label="equation-input"
            value={equation}
            onChange={(e) => setEquation(e.target.value)}
            placeholder="Enter equation in x, e.g. 2*x + 3 or sin(x)"
            className="w-full bg-slate-950/50 text-slate-200 border border-slate-700 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-mono text-sm transition-all"
          />
        ) : (
          <textarea
            aria-label="data-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={textareaPlaceholder}
            rows={12}
            className="w-full bg-slate-950/50 text-slate-200 border border-slate-700 rounded-xl p-4 resize-y focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-mono text-sm transition-all"
          />
        )}

        <div className="grid grid-cols-2 gap-2 mt-4">
          <button
            type="button"
            onClick={onAnalyze}
            disabled={isAnalyzing}
            className="col-span-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-cyan-600 hover:to-blue-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Analyzing...
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4" />
                Analyze Data
              </>
            )}
          </button>

          {samples.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => onLoadSample(s.key)}
              className="bg-slate-800 text-slate-300 px-2 py-2 rounded-lg text-xs hover:bg-slate-700 transition-all border border-slate-700"
            >
              {s.label}
            </button>
          ))}

          <button
            type="button"
            onClick={onClear}
            className="col-span-2 bg-red-500/10 text-red-400 px-3 py-2 rounded-lg text-sm hover:bg-red-500/20 transition-all border border-red-500/30 flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </button>
        </div>

        <p className="text-xs text-slate-500 mt-3">
          Accepts CSV format with comma, tab, or space separators
        </p>
      </div>
    </div>
  );
}
