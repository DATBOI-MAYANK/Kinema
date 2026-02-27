import regression from "regression";
import { calculateAIC, calculateAICc } from "../utils/aic.utils.js";

const POLYNOMIAL_ORDERS = [
  { order: 1, name: "Linear" },
  { order: 2, name: "Quadratic" },
  { order: 3, name: "Cubic" },
  { order: 4, name: "Quartic" },
  { order: 5, name: "Quintic" },
  { order: 6, name: "Sextic" },
];

function calculateModelMetrics(data, predictFn) {
  const n = data.length;
  if (n === 0) return null;

  let sse = 0;
  let meanY = 0;
  for (const [, y] of data) {
    meanY += y;
  }
  meanY /= n;

  let sst = 0;

  for (const [x, y] of data) {
    const predicted = predictFn(x);
    if (!Number.isFinite(predicted)) {
      return null;
    }

    const residual = y - predicted;
    sse += residual * residual;

    const variance = y - meanY;
    sst += variance * variance;
  }

  if (!Number.isFinite(sse) || sse < 0) {
    return null;
  }

  const r2 = sst === 0 ? (sse === 0 ? 1 : 0) : 1 - sse / sst;

  return {
    sse,
    r2: Math.max(-1, Math.min(1, r2)),
  };
}

export function runRegressionAnalysis(data, options = {}) {
  const results = [];
  const polynomialDegree = Math.max(1, Math.min(6, options.polynomialDegree || 3));
  const preferredModel = options.preferredModel;

  const models = [
    ...POLYNOMIAL_ORDERS.filter((entry) => entry.order <= polynomialDegree).map(
      (entry) => ({
        name: entry.name,
        fn: () =>
          entry.order === 1
            ? regression.linear(data)
            : regression.polynomial(data, { order: entry.order }),
      }),
    ),
    { name: "Exponential", fn: () => regression.exponential(data) },
    { name: "Logarithmic", fn: () => regression.logarithmic(data) },
    { name: "Power", fn: () => regression.power(data) },
  ];

  models.forEach((model) => {
    try {
      const res = model.fn();

      if (!res || !Array.isArray(res.equation) || res.equation.length === 0) {
        return;
      }

      const metrics = calculateModelMetrics(data, (x) => {
        const prediction = res.predict(x);
        if (!Array.isArray(prediction) || prediction.length < 2) {
          return Number.NaN;
        }
        return prediction[1];
      });

      if (!metrics) {
        return;
      }

      const k = res.equation.length;
      const n = data.length;
      const aic = calculateAIC(n, k, metrics.sse);
      const aicc = calculateAICc(n, k, metrics.sse);

      if ((aic === null || !Number.isFinite(aic)) && !Number.isFinite(aicc)) {
        return;
      }

      results.push({
        model: model.name,
        equation: res.string,
        r2: metrics.r2,
        aic: aic,
        aicc: Number.isFinite(aicc) ? aicc : null,
        sse: metrics.sse,
        coefficients: res.equation,
      });
    } catch (e) {
      console.log(`${model.name} model failed:`, e.message);
    }
  });

  const validResults = results.filter(
    (r) => r.aic !== null && !isNaN(r.aic) && isFinite(r.aic),
  );

  if (validResults.length === 0) {
    throw new Error("No valid regression models found");
  }

  validResults.sort((a, b) => {
    const scoreA = Number.isFinite(a.aicc) ? a.aicc : a.aic;
    const scoreB = Number.isFinite(b.aicc) ? b.aicc : b.aic;

    if (scoreA !== scoreB) {
      return scoreA - scoreB;
    }

    return b.r2 - a.r2;
  });

  let bestModel = validResults[0];

  if (preferredModel) {
    const preferred = validResults.find(
      (model) => model.model.toLowerCase() === String(preferredModel).toLowerCase(),
    );
    if (preferred) {
      bestModel = preferred;
    }
  }

  return {
    bestModel,
    allModels: validResults,
  };
}
