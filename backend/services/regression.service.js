import regression from "regression";
import { calculateAIC } from "../utils/aic.utils.js";

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

      // Check if result is valid
      if (!res || res.r2 === null || isNaN(res.r2)) {
        return; // Skip invalid models
      }

      const k = res.equation.length; // number of parameters
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
      // Skip models that fail
      console.log(`${model.name} model failed:`, e.message);
    }
  });

  // Filter out models with invalid AIC
  const validResults = results.filter((r) => r.aic !== null && !isNaN(r.aic));

  if (validResults.length === 0) {
    throw new Error("No valid regression models found");
  }

  // Select best model (lowest AIC)
  const bestModel = validResults.reduce((best, current) =>
    current.aic < best.aic ? current : best,
  );

  return {
    bestModel,
    allModels: results, // Return all results including invalid ones for comparison
  };
}
