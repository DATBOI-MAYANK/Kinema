// Smart tick formatter — avoids ugly floating-point noise
function smartTick(value) {
  const abs = Math.abs(value);
  if (abs === 0) return "0";
  if (abs >= 1e6 || (abs < 1e-3 && abs > 0)) {
    return Number(value).toExponential(2);
  }
  if (Number.isInteger(value)) return String(value);
  // Choose decimal places based on magnitude
  const decimals = abs >= 100 ? 1 : abs >= 1 ? 2 : 3;
  return Number(value).toFixed(decimals);
}

export function CreateChart(data, modelToPlot) {
  // Allow data-only plotting when modelToPlot isn't provided: use a sentinel
  const plotModel = modelToPlot || {
    model: "DataOnly",
    r2: 0,
    coefficients: [],
  };

  const canvas = document.getElementById("regressionChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  if (chartInstance) {
    chartInstance.destroy();
  }

  // ── Palette ────────────────────────────────────────────────────────────
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

  // ── Responsive sizing ──────────────────────────────────────────────────
  const isMobile = window.innerWidth < 640;
  const titleSize = isMobile ? 13 : 15;
  const axisLabelSize = isMobile ? 11 : 12;
  const tickSize = isMobile ? 10 : 11;
  const legendSize = isMobile ? 10 : 11;

  // ── Point decimation for large datasets ───────────────────────────────
  const MAX_RENDER_PTS = 600;
  const rawPairs = data.map(([x, y]) => [x, y]);
  const decimated = decimatePoints(rawPairs, MAX_RENDER_PTS);
  const wasDecimated = decimated.length < data.length;
  const dataPoints = decimated.map(([x, y]) => ({ x, y }));

  // Point visual sizing — still reduce for large sets but not excessively
  const n = decimated.length;
  const pointRadius = n > 400 ? 2 : n > 150 ? 2.5 : 3.5;
  const pointHoverRadius = n > 400 ? 6 : 8;

  // ── Regression curve (always 500 smooth steps, independent of n) ──────
  const xValues = data.map(([x]) => x);
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const xRange = maxX - minX || 1;
  const step = Math.max(xRange / 500, Number.EPSILON);
  // 3% padding so edge points aren't clipped
  const padX = xRange * 0.03;

  const regressionLinePoints = [];

  // Only generate regression line for real fitted models
  if (plotModel.model !== "DataOnly") {
    for (let x = minX - padX; x <= maxX + padX + step * 0.5; x += step) {
      let y;
      switch (plotModel.model) {
        case "Linear":
        case "Quadratic":
        case "Cubic":
        case "Quartic":
        case "Quintic":
        case "Sextic":
          y = evaluatePolynomial(plotModel.coefficients, x);
          break;
        case "Exponential":
          y = evaluateExponential(plotModel.coefficients, x);
          break;
        case "Logarithmic":
          y = evaluateLogarithmic(plotModel.coefficients, x);
          if (y === null) continue;
          break;
        case "Power":
          y = evaluatePower(plotModel.coefficients, x);
          if (y === null) continue;
          break;
        default:
          y = 0;
      }
      if (!Number.isFinite(y)) continue;
      regressionLinePoints.push({ x, y });
    }
  }

  // ── Chart title — include decimation notice if active ─────────────────
  const r2Str = plotModel.r2 ? plotModel.r2.toFixed(4) : "N/A";
  const decimNote = wasDecimated
    ? `  •  showing ${decimated.length.toLocaleString()} / ${data.length.toLocaleString()} pts`
    : "";
  const chartTitle =
    plotModel.model === "DataOnly"
      ? `Data (No fit)${decimNote}`
      : `${plotModel.model} Regression  •  R² = ${r2Str}${decimNote}`;

  // ── Datasets ──────────────────────────────────────────────────────────
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
      tension: 0, // straight segments between computed steps = most accurate
      order: 1,
    });
  }

  // Confidence interval
  if (
    showConfidenceInterval &&
    plotModel.r2 > 0.5 &&
    plotModel.model !== "DataOnly"
  ) {
    const stdError = Math.sqrt((1 - plotModel.r2) / data.length) * 2;
    const upperBound = regressionLinePoints.map((p) => ({
      x: p.x,
      y: p.y + stdError,
    }));
    const lowerBound = regressionLinePoints.map((p) => ({
      x: p.x,
      y: p.y - stdError,
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

  // Residuals (also decimated to match scatter)
  if (showResiduals && plotModel.model !== "DataOnly") {
    const allResiduals = calculateResiduals(data, plotModel);
    const residualPairs = allResiduals.map((r) => [r.x, r.residual]);
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

  // ── Chart.js config ───────────────────────────────────────────────────
  const newChart = new Chart(ctx, {
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
  });

  setChartInstance(newChart);

  return (
    <div className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-2xl opacity-20 blur transition duration-300"></div>
      <div className="relative bg-slate-900/90 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50">
        <h3 className="flex items-center gap-2 text-xl font-semibold mb-4 text-cyan-400">
          <TrendingUp className="w-5 h-5" />
          Visualization
        </h3>
        <div className="bg-slate-950/50 p-2 sm:p-4 rounded-xl relative h-[320px] sm:h-[420px] lg:h-[520px]">
          <canvas
            id="regressionChart"
            className="absolute inset-0 w-full h-full"
          ></canvas>
        </div>
      </div>
    </div>
  );
}
