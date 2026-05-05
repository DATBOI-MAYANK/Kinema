import { useCallback } from "react";
import Papa from "papaparse";
import { parseTextInputWithValidation } from "../services/parser";
import { generateEquationPoints } from "../services/equation";
import { predictValue } from "../services/modelUtils";
import { useKinemaContext } from "../context/KinemaContext";

const API_URL = "http://localhost:3000/api/analyze";

const SAMPLE_DATA = {
  linear: "0,0\n1,2\n2,4\n3,6\n4,8",
  quadratic: "0,0\n1,4.9\n2,19.6\n3,44.1\n4,78.4",
  exponential: "-2, 0.25\n-1, 0.5\n0, 1\n1,2\n2,4\n3,8",
  logarithmic: "1,0\n2,0.693\n3,1.099\n4,1.386\n5,1.609",
  power: "1,1\n2,4\n3,9\n4,16\n5,25",
  cubic: "0,0\n1,1\n2,8\n3,27\n4,64\n5,125",
  sine: "0,0\n0.785,0.707\n1.571,1\n2.356,0.707\n3.142,0\n3.927,-0.707\n4.712,-1\n5.498,-0.707\n6.283,0",
};

const MODEL_MAP = {
  linear: "Linear",
  quadratic: "Quadratic",
  cubic: "Cubic",
  exponential: "Exponential",
  logarithmic: "Logarithmic",
  power: "Power",
  sine: "Sine",
};

// Precomputed model objects to avoid backend calls for common samples.
const PRECOMPUTED_MODELS = {
  linear: {
    model: "Linear",
    coefficients: [2, 0], // y = 2x + 0
    equation: "2*x + 0",
    r2: 1,
    aic: null,
  },
  quadratic: {
    model: "Quadratic",
    coefficients: [4.9, 0, 0], // y = 4.9*x^2
    equation: "4.9*x^2",
    r2: 1,
    aic: null,
  },
  cubic: {
    model: "Cubic",
    coefficients: [1, 0, 0, 0], // y = x^3
    equation: "x^3",
    r2: 1,
    aic: null,
  },
  exponential: {
    model: "Exponential",
    coefficients: [1, Math.log(2)], // y = 1 * e^(ln2 * x) == 2^x
    equation: "1 * exp(0.693147*x)",
    r2: 1,
    aic: null,
  },
  logarithmic: {
    model: "Logarithmic",
    coefficients: [0, 1], // y = ln(x)
    equation: "ln(x)",
    r2: 1,
    aic: null,
  },
  power: {
    model: "Power",
    coefficients: [1, 2], // y = 1 * x^2
    equation: "x^2",
    r2: 1,
    aic: null,
  },
  sine: {
    model: "Sine",
    coefficients: [1, 1, 0, 0], // y = 1 * sin(1*x + 0) + 0
    equation: "sin(x)",
    r2: 1,
    aic: null,
  },
};

function buildExportCsv(data, activeModel) {
  let csv = "X,Y,Predicted,Residual\n";

  data.forEach(([x, y]) => {
    const predicted = predictValue(activeModel, x);
    csv += `${x},${y},${predicted},${y - predicted}\n`;
  });

  return csv;
}

async function sendToBackend(dataPoints, polynomialDegree, selectedModel) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: dataPoints,
      polynomialDegree,
      preferredModel: selectedModel === "AUTO" ? undefined : selectedModel,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to analyze data");
  }

  return response.json();
}

export function useRegressionData() {
  const {
    text,
    equation,
    inputMode,
    filename,
    previewRows,
    error,
    analyzedData,
    regressionResults,
    isAnalyzing,
    showAdvanced,
    polynomialDegree,
    showConfidenceInterval,
    showResiduals,
    selectedModel,
    activeModel,
    setField,
    setMany,
    resetAll,
  } = useKinemaContext();

  const setText = useCallback((value) => setField("text", value), [setField]);
  const setEquation = useCallback(
    (value) => setField("equation", value),
    [setField],
  );
  const setInputMode = useCallback(
    (value) => setField("inputMode", value),
    [setField],
  );
  const setFilename = useCallback(
    (value) => setField("filename", value),
    [setField],
  );
  const setPreviewRows = useCallback(
    (value) => setField("previewRows", value),
    [setField],
  );
  const setError = useCallback((value) => setField("error", value), [setField]);
  const setAnalyzedData = useCallback(
    (value) => setField("analyzedData", value),
    [setField],
  );
  const setRegressionResults = useCallback(
    (value) => setField("regressionResults", value),
    [setField],
  );
  const setIsAnalyzing = useCallback(
    (value) => setField("isAnalyzing", value),
    [setField],
  );
  const setShowAdvanced = useCallback(
    (value) => setField("showAdvanced", value),
    [setField],
  );
  const setPolynomialDegree = useCallback(
    (value) => setField("polynomialDegree", value),
    [setField],
  );
  const setShowConfidenceInterval = useCallback(
    (value) => setField("showConfidenceInterval", value),
    [setField],
  );
  const setShowResiduals = useCallback(
    (value) => setField("showResiduals", value),
    [setField],
  );
  const setSelectedModel = useCallback(
    (value) => setField("selectedModel", value),
    [setField],
  );

  const clearAll = useCallback(() => {
    resetAll();
  }, [resetAll]);

  const loadSample = useCallback(
    async (type = "linear", action = "replace") => {
      // If user requested to apply the sample as a model (and has X-only inputs),
      // use precomputed coefficients when available to avoid backend calls.
      if (
        action === "applyModel" &&
        text &&
        text.trim() !== "" &&
        inputMode === "x-only"
      ) {
        setError(null);
        setIsAnalyzing(true);
        try {
          const pre = PRECOMPUTED_MODELS[type];
          if (!pre) {
            throw new Error("No precomputed model available for this sample.");
          }

          const userXParsed = parseTextInputWithValidation(text, "x-only");
          if (!userXParsed.validPairs || userXParsed.validPairs.length === 0) {
            throw new Error("No valid X values found in the input to predict.");
          }

          const bestModel = {
            model: pre.model,
            coefficients: pre.coefficients,
            equation: pre.equation,
            r2: pre.r2,
            aic: pre.aic,
          };

          const allModels = [bestModel];

          const predictedPairs = userXParsed.validPairs.map(([x]) => [
            x,
            predictValue(bestModel, x),
          ]);

          const analyzedPayload = {
            data: predictedPairs,
            stats: {
              total: userXParsed.totalRows,
              valid: userXParsed.validRows,
              rejected: userXParsed.rejectedRows,
            },
            badLines: userXParsed.badLines,
            source: "manual",
          };

          setRegressionResults({ bestModel, allModels });
          setSelectedModel(pre.model);
          setAnalyzedData(analyzedPayload);
          setPreviewRows(predictedPairs.slice(0, 10));
        } catch (err) {
          setError(err.message || "Failed to apply sample model");
        } finally {
          setIsAnalyzing(false);
        }

        return;
      }

      // Default behavior: replace textarea with the sample data
      setMany({
        text: SAMPLE_DATA[type] || SAMPLE_DATA.linear,
        error: null,
        previewRows: [],
        analyzedData: null,
        regressionResults: null,
        selectedModel: "AUTO",
        filename: "",
      });
    },
    [
      setMany,
      text,
      inputMode,
      polynomialDegree,
      setIsAnalyzing,
      setError,
      setAnalyzedData,
      setRegressionResults,
      setSelectedModel,
      setPreviewRows,
    ],
  );

  const handleAnalyze = useCallback(
    async (event) => {
      event?.preventDefault();
      setError(null);
      setIsAnalyzing(true);
      setRegressionResults(null);

      try {
        if (inputMode === "equation") {
          const points = generateEquationPoints(equation);

          if (!points || points.length < 2) {
            throw new Error("Equation produced insufficient points to plot.");
          }

          setAnalyzedData({
            data: points,
            stats: { total: points.length, valid: points.length, rejected: 0 },
            badLines: [],
            source: "equation",
          });
          setPreviewRows(points.slice(0, 10));
          return;
        }

        const result = parseTextInputWithValidation(text, inputMode);

        if (result.parseErrors && result.parseErrors.length > 0) {
          throw new Error("Input format error. Please check the data format.");
        }

        if (!result.validPairs || result.validPairs.length < 2) {
          throw new Error(
            "At least two valid data points are required for analysis.",
          );
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

        // If user provided X-only values we cannot meaningfully send them to the backend
        // (which expects X,Y pairs). Instead, require an existing model (from prior
        // analysis) or instruct the user to switch to equation/full-pair input.
        if (inputMode === "x-only") {
          if (!activeModel) {
            throw new Error(
              "X-only input requires an existing model to predict Y. Please first analyze full (X,Y) data to obtain a model, or switch to 'equation' mode.",
            );
          }

          const predictedPairs = result.validPairs.map(([x]) => [
            x,
            predictValue(activeModel, x),
          ]);

          const analyzedPayload = {
            data: predictedPairs,
            stats: {
              total: result.totalRows,
              valid: result.validRows,
              rejected: result.rejectedRows,
            },
            badLines: result.badLines,
            source: "manual",
          };

          setAnalyzedData(analyzedPayload);
          setPreviewRows(predictedPairs.slice(0, 10));

          // No backend call in x-only mode
          setIsAnalyzing(false);
          return;
        }

        const backendResults = await sendToBackend(
          result.validPairs,
          polynomialDegree,
          selectedModel,
        );

        let analyzedPayload = {
          data: result.validPairs,
          stats: {
            total: result.totalRows,
            valid: result.validRows,
            rejected: result.rejectedRows,
          },
          badLines: result.badLines,
          source: "manual",
        };

        setAnalyzedData(analyzedPayload);
        setRegressionResults(backendResults);
      } catch (err) {
        setError(err.message || "Failed to analyze data");
      } finally {
        setIsAnalyzing(false);
      }
    },
    [
      equation,
      inputMode,
      polynomialDegree,
      selectedModel,
      setAnalyzedData,
      setError,
      setIsAnalyzing,
      setPreviewRows,
      setRegressionResults,
      text,
      activeModel,
    ],
  );

  const handleFileChange = useCallback(
    (event) => {
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
        complete: async (results) => {
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
              throw new Error(
                "CSV format error. Please check the file structure.",
              );
            }

            if (validPairs.length < 2) {
              throw new Error(
                "At least two valid data points are required for analysis.",
              );
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

            const backendResults = await sendToBackend(
              validPairs,
              polynomialDegree,
              selectedModel,
            );
            setRegressionResults(backendResults);
          } catch (err) {
            setError(err.message || "Failed to analyze CSV data");
          } finally {
            setIsAnalyzing(false);
          }
        },
      });
    },
    [
      polynomialDegree,
      selectedModel,
      setAnalyzedData,
      setError,
      setFilename,
      setIsAnalyzing,
      setPreviewRows,
      setRegressionResults,
    ],
  );

  const exportChart = useCallback(() => {
    const canvas = document.getElementById("regressionChart");
    if (!canvas) return;

    const offscreen = document.createElement("canvas");
    offscreen.width = canvas.width;
    offscreen.height = canvas.height;

    const offCtx = offscreen.getContext("2d");
    offCtx.fillStyle = "#0f172a";
    offCtx.fillRect(0, 0, offscreen.width, offscreen.height);
    offCtx.drawImage(canvas, 0, 0);

    const url = offscreen.toDataURL("image/jpeg", 0.95);
    const link = document.createElement("a");
    link.download = "regression-analysis.jpg";
    link.href = url;
    link.click();
  }, []);

  const exportData = useCallback(
    (format = "csv") => {
      if (!analyzedData) return;

      const data = analyzedData.data;

      if (format === "csv") {
        // If we have an activeModel use it to compute predicted/residual columns
        if (activeModel) {
          const csv = buildExportCsv(data, activeModel);
          const blob = new Blob([csv], { type: "text/csv" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.download = "regression-data.csv";
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
          return;
        }

        // Fallback: export X,Y only
        let csv = "X,Y\n";
        data.forEach(([x, y]) => {
          csv += `${x},${y}\n`;
        });
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = "data.csv";
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        return;
      }

      // JSON export: include what we have
      const exportObj = {
        originalData: data,
        bestModel: activeModel || null,
        allModels: regressionResults?.allModels || null,
        statistics: analyzedData.stats || null,
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
    },
    [activeModel, analyzedData, regressionResults],
  );

  return {
    text,
    equation,
    inputMode,
    filename,
    previewRows,
    error,
    analyzedData,
    regressionResults,
    isAnalyzing,
    showAdvanced,
    polynomialDegree,
    showConfidenceInterval,
    showResiduals,
    selectedModel,
    activeModel,
    setText,
    setEquation,
    setInputMode,
    setFilename,
    setPreviewRows,
    setError,
    setAnalyzedData,
    setRegressionResults,
    setIsAnalyzing,
    setShowAdvanced,
    setPolynomialDegree,
    setShowConfidenceInterval,
    setShowResiduals,
    setSelectedModel,
    handleAnalyze,
    handleFileChange,
    loadSample,
    clearAll,
    exportChart,
    exportData,
  };
}
