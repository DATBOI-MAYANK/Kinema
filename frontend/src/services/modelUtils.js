import {
  evaluateExponential,
  evaluateLogarithmic,
  evaluatePolynomial,
  evaluatePower,
  evaluateSine,
} from "./regressionEval";

export function getActiveModel(regressionResults, selectedModel) {
  if (!regressionResults || !regressionResults.bestModel) return null;

  if (selectedModel === "AUTO") {
    return regressionResults.bestModel;
  }

  const forcedModel = regressionResults.allModels?.find(
    (model) => model.model === selectedModel,
  );

  return forcedModel || regressionResults.bestModel;
}

export function predictValue(model, x) {
  if (!model) return 0;

  switch (model.model) {
    case "Linear":
    case "Quadratic":
    case "Cubic":
    case "Quartic":
    case "Quintic":
    case "Sextic":
      return evaluatePolynomial(model.coefficients, x);
    case "Exponential":
      return evaluateExponential(model.coefficients, x);
    case "Logarithmic":
      return evaluateLogarithmic(model.coefficients, x);
    case "Power":
      return evaluatePower(model.coefficients, x);
    case "Sine":
      return evaluateSine(model.coefficients, x);
    default:
      return 0;
  }
}

export function calculateResiduals(data, model) {
  return data.map(([x, y]) => ({
    x,
    residual: y - predictValue(model, x),
  }));
}
