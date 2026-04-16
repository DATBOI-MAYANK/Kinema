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
  ChevronDown,
} from "lucide-react";
import Chart from "chart.js/auto";
import { evaluate } from "mathjs";
import { Header } from "./components/layout/Header";
import ManualInput from "./components/input/ManualInput";
import { FileUpload } from "./components/input/FileUpload";
import ModelCards from "./components/results/ModelCards";
import AdvancedSettings from "./components/settings/AdvancedSettings";
import { CreateChart } from "./components/chart/Chart";

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
  const [selectedModel, setSelectedModel] = useState("AUTO");
  const [inputMode, setInputMode] = useState("pairs"); // 'pairs' | 'x-only' | 'equation'
  const [equation, setEquation] = useState("");

  // Backend API URL
  const API_URL = "http://localhost:3000/api/analyze";

  function getActiveModel(results) {
    if (!results || !results.bestModel) return null;

    if (selectedModel === "AUTO") {
      return results.bestModel;
    }

    const forcedModel = results.allModels?.find(
      (model) => model.model === selectedModel,
    );

    return forcedModel || results.bestModel;
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
          preferredModel: selectedModel === "AUTO" ? undefined : selectedModel,
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

  function calculateResiduals(data, modelToPlot) {
    return data.map(([x, y]) => {
      let predicted;
      switch (modelToPlot.model) {
        case "Linear":
        case "Quadratic":
        case "Cubic":
        case "Quartic":
        case "Quintic":
        case "Sextic":
          predicted = evaluatePolynomial(modelToPlot.coefficients, x);
          break;
        case "Exponential":
          predicted = evaluateExponential(modelToPlot.coefficients, x);
          break;
        case "Logarithmic":
          predicted = evaluateLogarithmic(modelToPlot.coefficients, x);
          break;
        case "Power":
          predicted = evaluatePower(modelToPlot.coefficients, x);
          break;
        default:
          predicted = 0;
      }
      return { x, residual: y - predicted };
    });
  }

  function exportChart() {
    if (!chartInstance) return;

    const canvas = document.getElementById("regressionChart");
    if (!canvas) return;

    // Composite chart onto a background-filled canvas so JPEG has no black/transparent areas
    const offscreen = document.createElement("canvas");
    offscreen.width = canvas.width;
    offscreen.height = canvas.height;
    const offCtx = offscreen.getContext("2d");

    // Fill with the app's dark background colour
    offCtx.fillStyle = "#0f172a";
    offCtx.fillRect(0, 0, offscreen.width, offscreen.height);
    offCtx.drawImage(canvas, 0, 0);

    const url = offscreen.toDataURL("image/jpeg", 0.95);
    const link = document.createElement("a");
    link.download = "regression-analysis.jpg";
    link.href = url;
    link.click();
  }

  function exportData(format = "csv") {
    if (!analyzedData || !regressionResults) return;

    const data = analyzedData.data;
    const activeModel = getActiveModel(regressionResults);

    if (!activeModel) return;

    if (format === "csv") {
      let csv = "X,Y,Predicted,Residual\n";
      data.forEach(([x, y]) => {
        let predicted;
        switch (activeModel.model) {
          case "Linear":
          case "Quadratic":
          case "Cubic":
          case "Quartic":
          case "Quintic":
          case "Sextic":
            predicted = evaluatePolynomial(activeModel.coefficients, x);
            break;
          case "Exponential":
            predicted = evaluateExponential(activeModel.coefficients, x);
            break;
          case "Logarithmic":
            predicted = evaluateLogarithmic(activeModel.coefficients, x);
            break;
          case "Power":
            predicted = evaluatePower(activeModel.coefficients, x);
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
        bestModel: activeModel,
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

  // LTTB decimation — keeps at most `threshold` points while preserving visual shape
  function decimatePoints(points, threshold) {
    if (points.length <= threshold) return points;

    const sampled = [points[0]];
    const bucketSize = (points.length - 2) / (threshold - 2);
    let a = 0; // previously selected index

    for (let i = 0; i < threshold - 2; i++) {
      const bucketStart = Math.floor((i + 1) * bucketSize) + 1;
      const bucketEnd = Math.min(
        Math.floor((i + 2) * bucketSize) + 1,
        points.length - 1,
      );

      // Average of next bucket (lookahead centroid)
      let avgX = 0,
        avgY = 0;
      const nextBucketEnd = Math.min(
        Math.floor((i + 2) * bucketSize) + 1,
        points.length - 1,
      );
      const nextBucketStart = Math.floor((i + 2) * bucketSize) + 1;
      let count = 0;
      for (let j = nextBucketStart; j < nextBucketEnd; j++) {
        avgX += points[j][0];
        avgY += points[j][1];
        count++;
      }
      if (count > 0) {
        avgX /= count;
        avgY /= count;
      }

      // Pick point in current bucket that forms largest triangle with a and centroid
      let maxArea = -1;
      let maxIdx = bucketStart;
      const ax = points[a][0],
        ay = points[a][1];
      for (let j = bucketStart; j < bucketEnd; j++) {
        const area =
          Math.abs(
            (ax - avgX) * (points[j][1] - ay) -
              (ax - points[j][0]) * (avgY - ay),
          ) * 0.5;
        if (area > maxArea) {
          maxArea = area;
          maxIdx = j;
        }
      }

      sampled.push(points[maxIdx]);
      a = maxIdx;
    }

    sampled.push(points[points.length - 1]);
    return sampled;
  }

  async function handleAnalyze(e) {
    e?.preventDefault();
    setError(null);
    setIsAnalyzing(true);
    setRegressionResults(null);

    try {
      if (inputMode === "equation") {
        // generate points from equation and plot them (no backend fit)
        const points = generateEquationPoints(equation);

        if (!points || points.length < 2) {
          setError("Equation produced insufficient points to plot.");
          setIsAnalyzing(false);
          return;
        }

        // store as analyzed data for preview/export convenience
        setAnalyzedData({
          data: points,
          stats: { total: points.length, valid: points.length, rejected: 0 },
          badLines: [],
          source: "equation",
        });
        setPreviewRows(points.slice(0, 10));

        // Create a chart showing only the data (no fitted model)
        setTimeout(() => {
          createChart(points, null); // createChart handles null as data-only
        }, 100);

        setIsAnalyzing(false);
        return;
      }

      const result = parseTextInputWithValidation(text, inputMode);

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

      let chartData = result.validPairs;

      if (inputMode === "x-only") {
        const model = getActiveModel(backendResults);

        chartData = result.validPairs.map(([x]) => {
          const y = predictY(model, x);
          return [x, y];
        });
      }

      setTimeout(() => {
        createChart(chartData, getActiveModel(backendResults));
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
            createChart(validPairs, getActiveModel(backendResults));
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
      exponential: "-2, 0.25\n-1, 0.5\n0, 1\n1,2\n2,4\n3,8",
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
    setSelectedModel("AUTO");
    if (chartInstance) {
      chartInstance.destroy();
      setChartInstance(null);
    }
  }

  function handleClear() {
    setText("");
    setEquation("");
    setError(null);
    setPreviewRows([]);
    setFilename("");
    setAnalyzedData(null);
    setRegressionResults(null);
    setSelectedModel("AUTO");
    if (chartInstance) {
      chartInstance.destroy();
      setChartInstance(null);
    }
  }

  function updateChart() {
    if (analyzedData && regressionResults) {
      createChart(analyzedData.data, getActiveModel(regressionResults));
    }
  }

  const activeModel = getActiveModel(regressionResults);

  const textareaPlaceholder =
    inputMode === "pairs"
      ? "0,0\n1,2\n2,4\n3,6\n4,8"
      : inputMode === "x-only"
        ? "0\n1\n2\n3\n4"
        : "";

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <Header />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Manual Input Section */}
          <ManualInput />

          {/* File Upload Section */}
          <FileUpload />
        </div>

        {/* Advanced Settings */}
        {regressionResults && <AdvancedSettings />}

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
        {regressionResults && <ModelCards />}

        {/* All Models Comparison */}
        {regressionResults && regressionResults.allModels && <ModelCards />}

        {/* Chart */}
        {(regressionResults || inputMode === "equation") && <CreateChart />}
      </div>
    </div>
  );
}
