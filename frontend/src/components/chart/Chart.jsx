import React, { useEffect, useMemo } from "react";
import { TrendingUp } from "lucide-react";
import useChart from "../../hooks/useChart";
import { useRegressionData } from "../../hooks/useRegressionData";
import { calculateResiduals, predictValue } from "../../services/modelUtils";

function smartTick(value) {
  const abs = Math.abs(value);
  if (abs === 0) return "0";
  if (abs >= 1e6 || (abs < 1e-3 && abs > 0)) {
    return Number(value).toExponential(2);
  }
  if (Number.isInteger(value)) return String(value);
  const decimals = abs >= 100 ? 1 : abs >= 1 ? 2 : 3;
  return Number(value).toFixed(decimals);
}

function decimatePoints(points, threshold) {
  if (points.length <= threshold) return points;

  const sampled = [points[0]];
  const bucketSize = (points.length - 2) / (threshold - 2);
  let a = 0;

  for (let i = 0; i < threshold - 2; i++) {
    const bucketStart = Math.floor((i + 1) * bucketSize) + 1;
    const bucketEnd = Math.min(
      Math.floor((i + 2) * bucketSize) + 1,
      points.length - 1,
    );

    let avgX = 0;
    let avgY = 0;
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

    let maxArea = -1;
    let maxIdx = bucketStart;
    const ax = points[a][0];
    const ay = points[a][1];

    for (let j = bucketStart; j < bucketEnd; j++) {
      const area =
        Math.abs(
          (ax - avgX) * (points[j][1] - ay) - (ax - points[j][0]) * (avgY - ay),
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

import { generateEquationPoints } from "../../services/equation";

function buildChartConfig({
  data,
  model,
  selectedModel,
  showConfidenceInterval,
  showResiduals,
  inputMode,
  equation,
  analyzedData,
}) {
  const plotModel = model || { model: "DataOnly", r2: 0, coefficients: [] };
  const isMobile = window.innerWidth < 640;
  const titleSize = isMobile ? 13 : 15;
  const axisLabelSize = isMobile ? 11 : 12;
  const tickSize = isMobile ? 10 : 11;
  const legendSize = isMobile ? 10 : 11;

  const C_DATA_FILL = "rgba(34, 211, 238, 0.55)";
  const C_DATA_BORDER = "rgba(34, 211, 238, 0.9)";
  const C_LINE = "rgba(168, 85, 247, 1)";
  const C_LINE_FILL = "rgba(168, 85, 247, 0.07)";
  const C_CI_BORDER = "rgba(168, 85, 247, 0.3)";
  const C_CI_FILL = "rgba(168, 85, 247, 0.1)";
  const C_RESID_FILL = "rgba(251, 113, 133, 0.7)";
  const C_RESID_BDR = "rgba(251, 113, 133, 0.95)";
  const C_GRID = "rgba(148, 163, 184, 0.08)";
  const C_GRID_ZERO = "rgba(148, 163, 184, 0.25)";
  const C_AXIS_LABEL = "#94a3b8";
  const C_AXIS_TITLE = "#cbd5e1";
  const C_TITLE = "#e2e8f0";
  const C_TOOLTIP_BG = "rgba(2, 6, 23, 0.95)";
  const C_TOOLTIP_BDR = "rgba(34, 211, 238, 0.4)";

  const MAX_RENDER_PTS = 600;
  const rawPairs = data.map(([x, y]) => [x, y]);
  const decimated = decimatePoints(rawPairs, MAX_RENDER_PTS);
  const wasDecimated = decimated.length < data.length;
  const dataPoints = decimated.map(([x, y]) => ({ x, y }));

  const n = decimated.length;
  const pointRadius = n > 400 ? 2 : n > 150 ? 2.5 : 3.5;
  const pointHoverRadius = n > 400 ? 6 : 8;

  const xValues = data.map(([x]) => x);
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const xRange = maxX - minX || 1;
  const step = Math.max(xRange / 500, Number.EPSILON);
  const padX = xRange * 0.03;
  const regressionLinePoints = [];

  if (plotModel.model !== "DataOnly") {
    for (let x = minX - padX; x <= maxX + padX + step * 0.5; x += step) {
      const y = predictValue(plotModel, x);
      if (!Number.isFinite(y)) continue;
      regressionLinePoints.push({ x, y });
    }
  }

  const r2Str = plotModel.r2 ? plotModel.r2.toFixed(4) : "N/A";
  const decimNote = wasDecimated
    ? `  •  showing ${decimated.length.toLocaleString()} / ${data.length.toLocaleString()} pts`
    : "";
  const chartTitle =
    plotModel.model === "DataOnly"
      ? `Data (No fit)${decimNote}`
      : `${plotModel.model} Regression  •  R² = ${r2Str}${decimNote}`;

  const datasets = [
    {
      label: "Data Points",
      data: dataPoints,
      backgroundColor: C_DATA_FILL,
      borderColor: C_DATA_BORDER,
      pointRadius,
      pointHoverRadius,
      pointHoverBackgroundColor: "#fff",
      borderWidth: 1,
      order: 2,
    },
  ];

  // If we have a fitted model, show its regression line
  if (plotModel.model !== "DataOnly") {
    datasets.push({
      label:
        selectedModel === "AUTO"
          ? `${plotModel.model} Fit (best)`
          : `${plotModel.model} Fit (forced)`,
      data: regressionLinePoints,
      type: "line",
      borderColor: C_LINE,
      backgroundColor: C_LINE_FILL,
      borderWidth: 2,
      pointRadius: 0,
      pointHitRadius: 14,
      fill: false,
      tension: 0,
      order: 1,
    });
  } else {
    // No fitted model available — draw a smooth interpolation line through data (Desmos-like)
    try {
      const linePoints = [...rawPairs]
        .sort((a, b) => a[0] - b[0])
        .map(([x, y]) => ({ x, y }));
      if (linePoints.length > 1) {
        datasets.push({
          label: "Interpolation",
          data: linePoints,
          type: "line",
          borderColor: "rgba(99,102,241,0.9)",
          backgroundColor: "rgba(99,102,241,0.08)",
          borderWidth: 2,
          pointRadius: 0,
          fill: false,
          tension: 0.35,
          order: 1,
        });
      }
    } catch {
      // ignore
    }
  }

  // If the dataset was created from an explicit equation, draw that equation curve on top
  if (
    (inputMode === "equation" || analyzedData?.source === "equation") &&
    equation
  ) {
    try {
      // generate denser points across the visible range
      const eqPts = generateEquationPoints(equation).map(([x, y]) => ({
        x,
        y,
      }));
      if (eqPts.length > 0) {
        datasets.unshift({
          label: "Equation",
          data: eqPts,
          type: "line",
          borderColor: "rgba(16,185,129,0.95)",
          backgroundColor: "rgba(16,185,129,0.08)",
          borderWidth: 2,
          pointRadius: 0,
          fill: false,
          tension: 0,
          order: 0,
        });
      }
    } catch {
      // ignore equation generation errors
    }
  }

  if (
    showConfidenceInterval &&
    plotModel.r2 > 0.5 &&
    plotModel.model !== "DataOnly"
  ) {
    const stdError = Math.sqrt((1 - plotModel.r2) / data.length) * 2;
    const upperBound = regressionLinePoints.map((point) => ({
      x: point.x,
      y: point.y + stdError,
    }));
    const lowerBound = regressionLinePoints.map((point) => ({
      x: point.x,
      y: point.y - stdError,
    }));

    datasets.push({
      label: "95% Confidence Band",
      data: [...upperBound, ...lowerBound.reverse()],
      type: "line",
      borderColor: C_CI_BORDER,
      backgroundColor: C_CI_FILL,
      borderWidth: 1,
      borderDash: [4, 3],
      pointRadius: 0,
      fill: true,
      tension: 0,
      order: 3,
    });
  }

  if (showResiduals && plotModel.model !== "DataOnly") {
    const residualPairs = calculateResiduals(data, plotModel).map((item) => [
      item.x,
      item.residual,
    ]);
    const decimatedResiduals = decimatePoints(residualPairs, MAX_RENDER_PTS);

    datasets.push({
      label: "Residuals",
      data: decimatedResiduals.map(([x, y]) => ({ x, y })),
      type: "scatter",
      backgroundColor: C_RESID_FILL,
      borderColor: C_RESID_BDR,
      pointRadius: isMobile ? 2 : 2.5,
      pointHoverRadius: 5,
      pointStyle: "crossRot",
      yAxisID: "yResidual",
      order: 4,
    });
  }

  return {
    type: "scatter",
    data: { datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      devicePixelRatio: window.devicePixelRatio || 2,
      interaction: {
        mode: "nearest",
        axis: "xy",
        intersect: false,
      },
      animation: {
        duration: 400,
        easing: "easeOutCubic",
      },
      elements: {
        point: { hitRadius: 10 },
      },
      layout: {
        padding: {
          top: 4,
          right: isMobile ? 8 : 16,
          bottom: 4,
          left: isMobile ? 4 : 8,
        },
      },
      plugins: {
        legend: {
          position: isMobile ? "bottom" : "top",
          align: isMobile ? "center" : "start",
          labels: {
            color: C_AXIS_TITLE,
            font: { size: legendSize, weight: "500" },
            usePointStyle: true,
            pointStyle: "circle",
            boxWidth: 8,
            boxHeight: 8,
            padding: isMobile ? 10 : 16,
          },
        },
        title: {
          display: true,
          text: chartTitle,
          color: C_TITLE,
          padding: { top: 6, bottom: isMobile ? 8 : 12 },
          font: {
            size: titleSize,
            weight: "600",
            family: "'Inter', sans-serif",
          },
        },
        tooltip: {
          backgroundColor: C_TOOLTIP_BG,
          titleColor: "#22d3ee",
          bodyColor: "#cbd5e1",
          footerColor: "#94a3b8",
          borderColor: C_TOOLTIP_BDR,
          borderWidth: 1,
          cornerRadius: 8,
          padding: isMobile ? 8 : 12,
          displayColors: true,
          caretSize: 5,
          callbacks: {
            title(items) {
              if (!items?.length) return "";
              return `x = ${smartTick(Number(items[0].parsed.x))}`;
            },
            label(context) {
              const yValue = context.parsed?.y;
              const series = context.dataset?.label ?? "Value";
              return `  ${series}: ${smartTick(Number(yValue))}`;
            },
          },
        },
      },
      scales: {
        x: {
          title: {
            display: !isMobile,
            text: "X",
            color: C_AXIS_TITLE,
            font: { size: axisLabelSize, weight: "600" },
          },
          grid: {
            color(ctx) {
              return ctx.tick?.value === 0 ? C_GRID_ZERO : C_GRID;
            },
            lineWidth(ctx) {
              return ctx.tick?.value === 0 ? 1.5 : 1;
            },
          },
          border: { color: "rgba(148,163,184,0.2)" },
          ticks: {
            color: C_AXIS_LABEL,
            maxTicksLimit: isMobile ? 6 : 10,
            font: { size: tickSize },
            callback(value) {
              return smartTick(Number(value));
            },
          },
        },
        y: {
          title: {
            display: !isMobile,
            text: "Y",
            color: C_AXIS_TITLE,
            font: { size: axisLabelSize, weight: "600" },
          },
          grid: {
            color(ctx) {
              return ctx.tick?.value === 0 ? C_GRID_ZERO : C_GRID;
            },
            lineWidth(ctx) {
              return ctx.tick?.value === 0 ? 1.5 : 1;
            },
          },
          border: { color: "rgba(148,163,184,0.2)" },
          ticks: {
            color: C_AXIS_LABEL,
            maxTicksLimit: isMobile ? 6 : 8,
            font: { size: tickSize },
            callback(value) {
              return smartTick(Number(value));
            },
          },
        },
        yResidual: {
          display: showResiduals && plotModel.model !== "DataOnly",
          position: "right",
          title: {
            display: showResiduals && !isMobile,
            text: "Residual",
            color: C_RESID_BDR,
            font: { size: axisLabelSize, weight: "600" },
          },
          grid: { drawOnChartArea: false },
          border: { color: "rgba(148,163,184,0.2)" },
          ticks: {
            color: "#fda4af",
            font: { size: tickSize },
            callback(value) {
              return smartTick(Number(value));
            },
          },
        },
      },
    },
  };
}

export function CreateChart() {
  const {
    analyzedData,
    regressionResults,
    activeModel,
    selectedModel,
    showConfidenceInterval,
    showResiduals,
    inputMode,
    equation,
    exportChart: doExportChart,
    exportData: doExportData,
  } = useRegressionData();
  const { canvasRef, createChart, destroyChart } = useChart();

  const plotData = useMemo(() => {
    const data = analyzedData?.data || [];

    if (inputMode === "x-only" && activeModel) {
      return data.map(([x]) => [x, predictValue(activeModel, x)]);
    }

    return data;
  }, [activeModel, analyzedData, inputMode]);

  useEffect(() => {
    if (!plotData.length) {
      destroyChart();
      return undefined;
    }

    const config = buildChartConfig({
      data: plotData,
      model: regressionResults ? activeModel : null,
      selectedModel,
      showConfidenceInterval,
      showResiduals,
      inputMode,
      equation,
      analyzedData,
    });

    createChart(config);

    return () => {
      destroyChart();
    };
  }, [
    activeModel,
    createChart,
    destroyChart,
    plotData,
    regressionResults,
    selectedModel,
    showConfidenceInterval,
    showResiduals,
    inputMode,
    equation,
    analyzedData,
  ]);

  return (
    <div className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-2xl opacity-20 blur transition duration-300" />
      <div className="relative bg-slate-900/90 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="flex items-center gap-2 text-xl font-semibold text-cyan-400">
            <TrendingUp className="w-5 h-5" />
            Visualization
          </h3>

          <div className="flex items-center gap-2">
            {/* Export buttons: image always available when analyzedData exists */}
            {analyzedData && (
              <>
                <button
                  onClick={() => doExportChart()}
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-lg text-sm transition-all border border-slate-600"
                >
                  Export JPG
                </button>
                <button
                  onClick={() => doExportData("csv")}
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-lg text-sm transition-all border border-slate-600"
                >
                  CSV
                </button>
                <button
                  onClick={() => doExportData("json")}
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-lg text-sm transition-all border border-slate-600"
                >
                  JSON
                </button>
              </>
            )}
          </div>
        </div>

        <div className="bg-slate-950/50 p-2 sm:p-4 rounded-xl relative h-[320px] sm:h-[420px] lg:h-[520px]">
          <canvas
            ref={canvasRef}
            id="regressionChart"
            className="absolute inset-0 w-full h-full"
          />
        </div>
      </div>
    </div>
  );
}
