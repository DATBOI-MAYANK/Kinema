import regression from "regression";
import { calculateAIC } from "../utils/aic.util.js";

export function runRegressionAnalysis(data) {
  const results = [];

  const models = [
    { name: "Linear", fn: () => regression.linear(data) },
    { name: "Quadratic", fn: () => regression.polynomial(data, { order: 2 }) },
    { name: "Exponential", fn: () => regression.exponential(data) },
    { name: "Logarithmic", fn: () => regression.logarithmic(data) },
  ];

  models.forEach((model) => {
    try {
      const res = model.fn();

      const k = res.equation.length; // number of parameters
      const n = data.length;
      const aic = calculateAIC(n, k, res.r2);

      results.push({
        model: model.name,
        equation: res.string,
        r2: res.r2,
        aic,
        coefficients: res.equation,
      });
    } catch (e) {
      // Skip models that fail
    }
  });

  // Select best model (lowest AIC)
  const bestModel = results.reduce((best, current) =>
    current.aic < best.aic ? current : best,
  );

  return {
    bestModel,
    allModels: results,
  };
}
