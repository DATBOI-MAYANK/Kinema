import React, { useState } from "react";
import Papa from "papaparse";
import {
  Upload,
  Zap,
  Trash2,
  Database,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Activity,
  Award,
  Download,
  Settings,
} from "lucide-react";
import Chart from "chart.js/auto";

export default function DataAnalysisApp() {
  const [text, setText] = useState("");
  const [error, setError] = useState(null);
  const [previewRows, setPreviewRows] = useState([]);
  const [filename, setFilename] = useState("");
  const [analyzedData, setAnalyzedData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [regressionResults, setRegressionResults] = useState(null);
  const [chartInstance, setChartInstance] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [polynomialDegree, setPolynomialDegree] = useState(3);
  const [showConfidenceInterval, setShowConfidenceInterval] = useState(false);
  const [showResiduals, setShowResiduals] = useState(false);

  // Backend API URL
  const API_URL = "http://localhost:3000/api/analyze";

  function parseTextInputWithValidation(text) {
    const result = Papa.parse(text, {
      skipEmptyLines: true,
      dynamicTyping: true,
    });

    const validPairs = [];
    const badLines = [];

    result.data.forEach((row, index) => {
      if (index === 0 && typeof row[0] === "string") return;

      const x = row[0];
      const y = row[1];

      if (Number.isFinite(x) && Number.isFinite(y)) {
        validPairs.push([x, y]);
      } else {
        badLines.push({
          rowNumber: index + 1,
          rowData: row,
          reason: "Non-numeric or missing value",
        });
      }
    });

    return {
      totalRows: result.data.length,
      validRows: validPairs.length,
      rejectedRows: badLines.length,
      validPairs,
      badLines,
      parseErrors: result.errors,
    };
  }

  async function sendToBackend(dataPoints) {
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: dataPoints,
          polynomialDegree: polynomialDegree,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to analyze data");
      }

      const result = await response.json();
      return result;
    } catch (err) {
      throw new Error(
        err.message || "Network error. Please check if the backend is running.",
      );
    }
  }

  function evaluatePolynomial(coefficients, x) {
    return coefficients.reduce((sum, coef, index) => {
      return sum + coef * Math.pow(x, coefficients.length - 1 - index);
    }, 0);
  }

  function evaluateExponential(coefficients, x) {
    if (!coefficients || coefficients.length < 2) return 0;
    const a = coefficients[0];
    const b = coefficients[1];
    if (isNaN(a) || isNaN(b)) return 0;
    return a * Math.exp(b * x);
  }

  function evaluateLogarithmic(coefficients, x) {
    if (!coefficients || coefficients.length < 2) return null;
    if (x <= 0) return null;
    const b = coefficients[0];
    const a = coefficients[1];
    if (isNaN(a) || isNaN(b)) return null;
    return a + b * Math.log(x);
  }

  function evaluatePower(coefficients, x) {
    // Power: y = a * x^b
    if (!coefficients || coefficients.length < 2) return null;
    if (x <= 0) return null;
    const a = coefficients[0];
    const b = coefficients[1];
    if (isNaN(a) || isNaN(b)) return null;
    return a * Math.pow(x, b);
  }

  function calculateResiduals(data, bestModel) {
    return data.map(([x, y]) => {
      let predicted;
      switch (bestModel.model) {
        case "Linear":
        case "Quadratic":
        case "Cubic":
        case "Quartic":
          predicted = evaluatePolynomial(bestModel.coefficients, x);
          break;
        case "Exponential":
          predicted = evaluateExponential(bestModel.coefficients, x);
          break;
        case "Logarithmic":
          predicted = evaluateLogarithmic(bestModel.coefficients, x);
          break;
        case "Power":
          predicted = evaluatePower(bestModel.coefficients, x);
          break;
        default:
          predicted = 0;
      }
      return { x, residual: y - predicted };
    });
  }

  function exportChart(format = "png") {
    if (!chartInstance) return;

    const canvas = document.getElementById("regressionChart");
    if (!canvas) return;

    if (format === "png" || format === "jpg") {
      const url = canvas.toDataURL(`image/${format}`, 1.0);
      const link = document.createElement("a");
      link.download = `regression-analysis.${format}`;
      link.href = url;
      link.click();
    } else if (format === "svg") {
      // For SVG, we'll export the data as CSV instead since Chart.js uses canvas
      exportData("csv");
    }
  }

  function exportData(format = "csv") {
    if (!analyzedData || !regressionResults) return;

    const data = analyzedData.data;
    const bestModel = regressionResults.bestModel;

    if (format === "csv") {
      let csv = "X,Y,Predicted,Residual\n";
      data.forEach(([x, y]) => {
        let predicted;
        switch (bestModel.model) {
          case "Linear":
          case "Quadratic":
          case "Cubic":
          case "Quartic":
            predicted = evaluatePolynomial(bestModel.coefficients, x);
            break;
          case "Exponential":
            predicted = evaluateExponential(bestModel.coefficients, x);
            break;
          case "Logarithmic":
            predicted = evaluateLogarithmic(bestModel.coefficients, x);
            break;
          case "Power":
            predicted = evaluatePower(bestModel.coefficients, x);
            break;
          default:
            predicted = 0;
        }
        const residual = y - predicted;
        csv += `${x},${y},${predicted},${residual}\n`;
      });

      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = "regression-data.csv";
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } else if (format === "json") {
      const exportObj = {
        originalData: data,
        bestModel: bestModel,
        allModels: regressionResults.allModels,
        statistics: analyzedData.stats,
      };

      const blob = new Blob([JSON.stringify(exportObj, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = "regression-analysis.json";
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    }
  }

  function createChart(data, results) {
    const canvas = document.getElementById("regressionChart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (chartInstance) {
      chartInstance.destroy();
    }

    const dataPoints = data.map(([x, y]) => ({ x, y }));
    const bestModel = results.bestModel;
    const xValues = data.map(([x]) => x);
    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const step = (maxX - minX) / 200;

    const regressionLinePoints = [];

    for (let x = minX; x <= maxX; x += step) {
      let y;

      switch (bestModel.model) {
        case "Linear":
        case "Quadratic":
        case "Cubic":
        case "Quartic":
          y = evaluatePolynomial(bestModel.coefficients, x);
          break;
        case "Exponential":
          y = evaluateExponential(bestModel.coefficients, x);
          break;
        case "Logarithmic":
          y = evaluateLogarithmic(bestModel.coefficients, x);
          if (y === null) continue;
          break;
        case "Power":
          y = evaluatePower(bestModel.coefficients, x);
          if (y === null) continue;
          break;
        default:
          y = 0;
      }

      regressionLinePoints.push({ x, y });
    }

    const datasets = [
      {
        label: "Original Data",
        data: dataPoints,
        backgroundColor: "rgba(34, 211, 238, 0.8)",
        borderColor: "rgba(34, 211, 238, 1)",
        pointRadius: 6,
        pointHoverRadius: 8,
      },
      {
        label: `${bestModel.model} Regression (Best Fit)`,
        data: regressionLinePoints,
        type: "line",
        borderColor: "rgba(168, 85, 247, 1)",
        backgroundColor: "rgba(168, 85, 247, 0.1)",
        borderWidth: 3,
        pointRadius: 0,
        fill: false,
        tension: 0.4,
      },
    ];

    // Add confidence interval if enabled
    if (showConfidenceInterval && bestModel.r2 > 0.5) {
      const stdError = Math.sqrt((1 - bestModel.r2) / data.length) * 2;
      const upperBound = regressionLinePoints.map((p) => ({
        x: p.x,
        y: p.y + stdError,
      }));
      const lowerBound = regressionLinePoints.map((p) => ({
        x: p.x,
        y: p.y - stdError,
      }));

      datasets.push({
        label: "95% Confidence Interval",
        data: [...upperBound, ...lowerBound.reverse()],
        type: "line",
        borderColor: "rgba(168, 85, 247, 0.3)",
        backgroundColor: "rgba(168, 85, 247, 0.1)",
        borderWidth: 1,
        pointRadius: 0,
        fill: true,
        tension: 0.4,
      });
    }

    // Add residuals if enabled
    if (showResiduals) {
      const residuals = calculateResiduals(data, bestModel);
      datasets.push({
        label: "Residuals",
        data: residuals.map((r) => ({ x: r.x, y: r.residual })),
        type: "scatter",
        backgroundColor: "rgba(239, 68, 68, 0.6)",
        borderColor: "rgba(239, 68, 68, 1)",
        pointRadius: 4,
        pointStyle: "cross",
      });
    }

    const newChart = new Chart(ctx, {
      type: "scatter",
      data: { datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: "#cbd5e1",
              font: { size: 14 },
            },
          },
          title: {
            display: true,
            text: `${bestModel.model} Regression Analysis (R² = ${bestModel.r2.toFixed(4)})`,
            color: "#22d3ee",
            font: { size: 18, weight: "bold" },
          },
          tooltip: {
            backgroundColor: "rgba(15, 23, 42, 0.9)",
            titleColor: "#22d3ee",
            bodyColor: "#cbd5e1",
            borderColor: "rgba(34, 211, 238, 0.5)",
            borderWidth: 1,
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: "X Values",
              color: "#cbd5e1",
              font: { size: 14 },
            },
            grid: {
              color: "rgba(148, 163, 184, 0.1)",
            },
            ticks: {
              color: "#94a3b8",
            },
          },
          y: {
            title: {
              display: true,
              text: "Y Values",
              color: "#cbd5e1",
              font: { size: 14 },
            },
            grid: {
              color: "rgba(148, 163, 184, 0.1)",
            },
            ticks: {
              color: "#94a3b8",
            },
          },
        },
      },
    });

    setChartInstance(newChart);
  }

  async function handleAnalyze(e) {
    e.preventDefault();
    setError(null);
    setIsAnalyzing(true);
    setRegressionResults(null);

    try {
      const result = parseTextInputWithValidation(text);

      if (result.parseErrors && result.parseErrors.length > 0) {
        setError("Input format error. Please check the data format.");
        setIsAnalyzing(false);
        return;
      }

      if (!result.validPairs || result.validPairs.length < 2) {
        setError("At least two valid data points are required for analysis.");
        setIsAnalyzing(false);
        return;
      }

      setAnalyzedData({
        data: result.validPairs,
        stats: {
          total: result.totalRows,
          valid: result.validRows,
          rejected: result.rejectedRows,
        },
        badLines: result.badLines,
        source: "manual",
      });

      setPreviewRows(result.validPairs.slice(0, 10));

      const backendResults = await sendToBackend(result.validPairs);
      setRegressionResults(backendResults);

      setTimeout(() => {
        createChart(result.validPairs, backendResults);
      }, 100);

      setIsAnalyzing(false);
    } catch (err) {
      setError(err.message);
      setIsAnalyzing(false);
    }
  }

  async function handleFileChange(event) {
    setError(null);
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      setError("Please upload a valid CSV file.");
      return;
    }

    setFilename(file.name);
    setIsAnalyzing(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,

      complete: async function (results) {
        try {
          const validPairs = [];
          const badLines = [];

          results.data.forEach((row, index) => {
            const values = Object.values(row);
            const x = values[0];
            const y = values[1];

            if (Number.isFinite(x) && Number.isFinite(y)) {
              validPairs.push([x, y]);
            } else {
              badLines.push({
                rowNumber: index + 2,
                rowData: row,
                reason: "Invalid or non-numeric value",
              });
            }
          });

          if (results.errors && results.errors.length > 0) {
            setError("CSV format error. Please check the file structure.");
            setIsAnalyzing(false);
            return;
          }

          if (validPairs.length < 2) {
            setError(
              "At least two valid data points are required for analysis.",
            );
            setIsAnalyzing(false);
            return;
          }

          setAnalyzedData({
            data: validPairs,
            stats: {
              total: results.data.length,
              valid: validPairs.length,
              rejected: badLines.length,
            },
            badLines,
            source: "csv",
            fileName: file.name,
          });

          setPreviewRows(validPairs.slice(0, 10));

          const backendResults = await sendToBackend(validPairs);
          setRegressionResults(backendResults);

          setTimeout(() => {
            createChart(validPairs, backendResults);
          }, 100);

          setIsAnalyzing(false);
        } catch (err) {
          setError(err.message);
          setIsAnalyzing(false);
        }
      },
    });
  }

  function loadSample(type = "linear") {
    const samples = {
      linear: "0,0\n1,2\n2,4\n3,6\n4,8",
      quadratic: "0,0\n1,4.9\n2,19.6\n3,44.1\n4,78.4",
      exponential: "0,2\n1,3\n2,4.5\n3,6.75\n4,10.125",
      logarithmic: "1,0\n2,0.693\n3,1.099\n4,1.386\n5,1.609",
      power: "1,1\n2,4\n3,9\n4,16\n5,25",
      cubic: "0,0\n1,1\n2,8\n3,27\n4,64\n5,125",
      sine: "0,0\n0.785,0.707\n1.571,1\n2.356,0.707\n3.142,0\n3.927,-0.707\n4.712,-1\n5.498,-0.707\n6.283,0",
    };

    setText(samples[type] || samples.linear);
    setError(null);
    setPreviewRows([]);
    setAnalyzedData(null);
    setRegressionResults(null);
    if (chartInstance) {
      chartInstance.destroy();
      setChartInstance(null);
    }
  }

  function handleClear() {
    setText("");
    setError(null);
    setPreviewRows([]);
    setFilename("");
    setAnalyzedData(null);
    setRegressionResults(null);
    if (chartInstance) {
      chartInstance.destroy();
      setChartInstance(null);
    }
  }

  function updateChart() {
    if (analyzedData && regressionResults) {
      createChart(analyzedData.data, regressionResults);
    }
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Database className="w-8 h-8 text-cyan-400" />
            <h2 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              Advanced Regression Analysis Portal
            </h2>
          </div>
          <p className="text-slate-400 text-sm">
            Upload or paste your experimental data for comprehensive regression
            analysis
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Manual Input Section */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl opacity-20 group-hover:opacity-30 blur transition duration-300"></div>
            <div className="relative bg-slate-900/90 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50">
              <label className="flex items-center gap-2 text-lg font-semibold mb-4 text-cyan-400">
                <Zap className="w-5 h-5" />
                Manual Input
              </label>

              <textarea
                aria-label="data-input"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="0,0&#10;1,2&#10;2,4&#10;3,6&#10;4,8"
                rows={12}
                className="w-full bg-slate-950/50 text-slate-200 border border-slate-700 rounded-xl p-4 resize-y focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-mono text-sm transition-all"
              />

              <div className="grid grid-cols-2 gap-2 mt-4">
                <button
                  type="button"
                  onClick={handleAnalyze}
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

                <button
                  type="button"
                  onClick={() => loadSample("linear")}
                  className="bg-slate-800 text-slate-300 px-2 py-2 rounded-lg text-xs hover:bg-slate-700 transition-all border border-slate-700"
                >
                  Linear
                </button>

                <button
                  type="button"
                  onClick={() => loadSample("quadratic")}
                  className="bg-slate-800 text-slate-300 px-2 py-2 rounded-lg text-xs hover:bg-slate-700 transition-all border border-slate-700"
                >
                  Quadratic
                </button>

                <button
                  type="button"
                  onClick={() => loadSample("exponential")}
                  className="bg-slate-800 text-slate-300 px-2 py-2 rounded-lg text-xs hover:bg-slate-700 transition-all border border-slate-700"
                >
                  Exponential
                </button>

                <button
                  type="button"
                  onClick={() => loadSample("cubic")}
                  className="bg-slate-800 text-slate-300 px-2 py-2 rounded-lg text-xs hover:bg-slate-700 transition-all border border-slate-700"
                >
                  Cubic
                </button>

                <button
                  type="button"
                  onClick={() => loadSample("logarithmic")}
                  className="bg-slate-800 text-slate-300 px-2 py-2 rounded-lg text-xs hover:bg-slate-700 transition-all border border-slate-700"
                >
                  Logarithmic
                </button>

                <button
                  type="button"
                  onClick={() => loadSample("power")}
                  className="bg-slate-800 text-slate-300 px-2 py-2 rounded-lg text-xs hover:bg-slate-700 transition-all border border-slate-700"
                >
                  Power
                </button>

                <button
                  type="button"
                  onClick={handleClear}
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

          {/* File Upload Section */}
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
                  <span className="text-sm text-slate-400">
                    Click to upload CSV
                  </span>
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
                            <td className="px-4 py-2 text-slate-500">
                              {i + 1}
                            </td>
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
        </div>

        {/* Advanced Settings */}
        {regressionResults && (
          <div className="mb-6 relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl opacity-20 blur transition duration-300"></div>
            <div className="relative bg-slate-900/90 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-lg font-semibold mb-4 text-orange-400 hover:text-orange-300 transition-colors"
              >
                <Settings className="w-5 h-5" />
                Advanced Options
                <span className="text-sm text-slate-500">
                  {showAdvanced ? "▼" : "▶"}
                </span>
              </button>

              {showAdvanced && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-950/50 p-4 rounded-lg">
                    <label className="flex items-center gap-2 text-sm text-slate-300 mb-2">
                      <input
                        type="checkbox"
                        checked={showConfidenceInterval}
                        onChange={(e) => {
                          setShowConfidenceInterval(e.target.checked);
                          setTimeout(updateChart, 50);
                        }}
                        className="w-4 h-4 rounded border-slate-600 text-cyan-500 focus:ring-cyan-500"
                      />
                      Show Confidence Interval
                    </label>
                    <p className="text-xs text-slate-500">
                      Display 95% confidence band
                    </p>
                  </div>

                  <div className="bg-slate-950/50 p-4 rounded-lg">
                    <label className="flex items-center gap-2 text-sm text-slate-300 mb-2">
                      <input
                        type="checkbox"
                        checked={showResiduals}
                        onChange={(e) => {
                          setShowResiduals(e.target.checked);
                          setTimeout(updateChart, 50);
                        }}
                        className="w-4 h-4 rounded border-slate-600 text-cyan-500 focus:ring-cyan-500"
                      />
                      Show Residuals
                    </label>
                    <p className="text-xs text-slate-500">
                      Display prediction errors
                    </p>
                  </div>

                  <div className="bg-slate-950/50 p-4 rounded-lg">
                    <label className="block text-sm text-slate-300 mb-2">
                      Polynomial Degree
                    </label>
                    <input
                      type="number"
                      min="2"
                      max="6"
                      value={polynomialDegree}
                      onChange={(e) =>
                        setPolynomialDegree(parseInt(e.target.value))
                      }
                      className="w-full bg-slate-800 text-slate-200 border border-slate-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      For polynomial regression (2-6)
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-400 font-semibold">Error</p>
              <p className="text-red-300 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {analyzedData && !error && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-green-400 font-semibold">
                  Analysis Complete
                </p>
                <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">Total Rows:</span>
                    <span className="ml-2 text-slate-200 font-semibold">
                      {analyzedData.stats.total}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Valid:</span>
                    <span className="ml-2 text-green-400 font-semibold">
                      {analyzedData.stats.valid}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Rejected:</span>
                    <span className="ml-2 text-red-400 font-semibold">
                      {analyzedData.stats.rejected}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Best Model Card */}
        {regressionResults && (
          <div className="mb-6 relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl opacity-20 blur transition duration-300"></div>
            <div className="relative bg-slate-900/90 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="flex items-center gap-2 text-xl font-semibold text-green-400">
                  <Award className="w-5 h-5" />
                  Best Fit Model
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => exportChart("png")}
                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-sm transition-all border border-slate-600"
                  >
                    <Download className="w-4 h-4" />
                    PNG
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
                      {regressionResults.bestModel.model}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Equation</p>
                    <p className="text-lg font-mono text-purple-400 break-all">
                      {regressionResults.bestModel.equation}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400 mb-1">R² Score</p>
                    <p className="text-2xl font-bold text-green-400">
                      {regressionResults.bestModel.r2 === null ||
                      isNaN(regressionResults.bestModel.r2)
                        ? "N/A"
                        : regressionResults.bestModel.r2.toFixed(6)}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {regressionResults.bestModel.r2 === 1
                        ? "Perfect fit"
                        : regressionResults.bestModel.r2 > 0.95
                          ? "Excellent fit"
                          : regressionResults.bestModel.r2 > 0.85
                            ? "Good fit"
                            : regressionResults.bestModel.r2 > 0.7
                              ? "Moderate fit"
                              : "Poor fit"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400 mb-1">AIC Value</p>
                    <p className="text-2xl font-bold text-yellow-400">
                      {regressionResults.bestModel.aic === null ||
                      regressionResults.bestModel.aic === Infinity ||
                      regressionResults.bestModel.aic === -Infinity ||
                      isNaN(regressionResults.bestModel.aic)
                        ? "N/A"
                        : regressionResults.bestModel.aic.toFixed(4)}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Lower is better
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* All Models Comparison */}
        {regressionResults && regressionResults.allModels && (
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
                      <th className="px-4 py-3 text-slate-300 font-semibold">
                        R²
                      </th>
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
                          model.model === regressionResults.bestModel.model
                            ? "bg-green-500/10"
                            : model.r2 === null || isNaN(model.r2)
                              ? "opacity-50"
                              : ""
                        }`}
                      >
                        <td className="px-4 py-3">
                          <span className="text-cyan-400 font-semibold flex items-center gap-2">
                            {model.model}
                            {model.model ===
                              regressionResults.bestModel.model && (
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
        )}

        {/* Chart */}
        {regressionResults && (
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-2xl opacity-20 blur transition duration-300"></div>
            <div className="relative bg-slate-900/90 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50">
              <h3 className="flex items-center gap-2 text-xl font-semibold mb-4 text-cyan-400">
                <TrendingUp className="w-5 h-5" />
                Visualization
              </h3>
              <div
                className="bg-slate-950/50 p-4 rounded-xl"
                style={{ height: "500px" }}
              >
                <canvas id="regressionChart"></canvas>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
