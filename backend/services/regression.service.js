import regression from "regression";
import { calculateAIC } from "../utils/aic.utils.js";

export function runRegressionAnalysis(data, options = {}) {
  const results = [];
  const polynomialDegree = options.polynomialDegree || 3;

  const models = [
    { name: "Linear", fn: () => regression.linear(data) },
    { name: "Quadratic", fn: () => regression.polynomial(data, { order: 2 }) },
    { name: "Cubic", fn: () => regression.polynomial(data, { order: 3 }) },
    {
      name: "Quartic",
      fn: () =>
        regression.polynomial(data, { order: Math.min(4, polynomialDegree) }),
    },
    { name: "Exponential", fn: () => regression.exponential(data) },
    { name: "Logarithmic", fn: () => regression.logarithmic(data) },
    { name: "Power", fn: () => regression.power(data) },
  ];

  models.forEach((model) => {
    try {
      const res = model.fn();

      if (!res || res.r2 === null || isNaN(res.r2) || res.r2 < 0) {
        return;
      }

      const k = res.equation.length;
      const n = data.length;
      const aic = calculateAIC(n, k, res.r2);

      results.push({
        model: model.name,
        equation: res.string,
        r2: res.r2,
        aic: aic,
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

  let bestModel = validResults[0];

  for (const model of validResults) {
    if (model.r2 - bestModel.r2 > 0.05) {
      bestModel = model;
    } else if (Math.abs(model.r2 - bestModel.r2) <= 0.05) {
      if (model.aic < bestModel.aic) {
        bestModel = model;
      }
    }
  }

  return {
    bestModel,
    allModels: results,
  };
}
