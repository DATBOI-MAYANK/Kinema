import React from "react";
import { Settings, ChevronDown } from "lucide-react";
import { useRegressionData } from "../../hooks/useRegressionData";

/**
 * AdvancedSettings
 *
 * Props:
 * - showAdvanced (bool)
 * - setShowAdvanced (fn)
 * - regressionResults (object) : required to list available models
 * - selectedModel (string)
 * - setSelectedModel (fn)
 * - showConfidenceInterval (bool)
 * - setShowConfidenceInterval (fn)
 * - showResiduals (bool)
 * - setShowResiduals (fn)
 * - polynomialDegree (number)
 * - setPolynomialDegree (fn)
 * - updateChart (fn) optional: a function to request a chart redraw after changes
 */
export default function AdvancedSettings() {
  const {
    showAdvanced,
    setShowAdvanced,
    regressionResults,
    selectedModel,
    setSelectedModel,
    showConfidenceInterval,
    setShowConfidenceInterval,
    showResiduals,
    setShowResiduals,
    polynomialDegree,
    setPolynomialDegree,
  } = useRegressionData();

  if (!regressionResults) return null;

  const handleModelChange = (e) => {
    setSelectedModel(e.target.value);
  };

  const handleConfidenceChange = (e) => {
    setShowConfidenceInterval(e.target.checked);
  };

  const handleResidualsChange = (e) => {
    setShowResiduals(e.target.checked);
  };

  const handleDegreeChange = (e) => {
    const v = parseInt(e.target.value, 10);
    if (!Number.isNaN(v)) setPolynomialDegree(v);
  };

  return (
    <div className="mb-6 relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl opacity-20 blur transition duration-300"></div>
      <div className="relative bg-slate-900/90 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between gap-2 text-lg font-semibold mb-4 text-orange-400 hover:text-orange-300 transition-colors"
          type="button"
        >
          <span className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Advanced Options
          </span>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform ${
              showAdvanced ? "rotate-180" : "rotate-0"
            }`}
          />
        </button>

        {showAdvanced && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-lg border border-slate-700/70 bg-slate-950/60 p-3">
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Model Mode
                </p>
                <p className="text-sm mt-1 text-cyan-300 font-semibold">
                  {selectedModel === "AUTO" ? "Auto Best Fit" : "Forced"}
                </p>
              </div>

              <div className="rounded-lg border border-slate-700/70 bg-slate-950/60 p-3">
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Confidence Band
                </p>
                <p className="text-sm mt-1 text-purple-300 font-semibold">
                  {showConfidenceInterval ? "Enabled" : "Disabled"}
                </p>
              </div>

              <div className="rounded-lg border border-slate-700/70 bg-slate-950/60 p-3">
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Residual Plot
                </p>
                <p className="text-sm mt-1 text-rose-300 font-semibold">
                  {showResiduals ? "Enabled" : "Disabled"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-700/60">
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Plot Model
                </label>
                <select
                  value={selectedModel}
                  onChange={handleModelChange}
                  className="w-full bg-slate-800 text-slate-200 border border-slate-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="AUTO">Auto Best Fit</option>
                  {Array.isArray(regressionResults.allModels) &&
                    regressionResults.allModels.map((model, index) => (
                      <option key={`${model.model}-${index}`} value={model.model}>
                        {model.model}
                      </option>
                    ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  Choose Auto or force any fitted model
                </p>
              </div>

              <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-700/60">
                <label className="flex items-center justify-between gap-3 text-sm text-slate-300 mb-2">
                  <span>Confidence Interval</span>
                  <input
                    type="checkbox"
                    checked={showConfidenceInterval}
                    onChange={handleConfidenceChange}
                    className="w-4 h-4 rounded border-slate-600 text-cyan-500 focus:ring-cyan-500"
                  />
                </label>
                <p className="text-xs text-slate-500">Display 95% confidence band</p>
              </div>

              <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-700/60">
                <label className="flex items-center justify-between gap-3 text-sm text-slate-300 mb-2">
                  <span>Residuals</span>
                  <input
                    type="checkbox"
                    checked={showResiduals}
                    onChange={handleResidualsChange}
                    className="w-4 h-4 rounded border-slate-600 text-cyan-500 focus:ring-cyan-500"
                  />
                </label>
                <p className="text-xs text-slate-500">Display prediction errors</p>
              </div>

              <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-700/60">
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Polynomial Degree
                </label>
                <input
                  type="number"
                  min="2"
                  max="6"
                  value={polynomialDegree}
                  onChange={handleDegreeChange}
                  className="w-full bg-slate-800 text-slate-200 border border-slate-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <p className="text-xs text-slate-500 mt-1">For polynomial regression (2-6)</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
