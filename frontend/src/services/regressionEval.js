export function evaluatePolynomial(coefficients, x) {
  return coefficients.reduce((sum, coef, index) => {
    return sum + coef * Math.pow(x, coefficients.length - 1 - index);
  }, 0);
}

export function evaluateExponential(coefficients, x) {
  if (!coefficients || coefficients.length < 2) return 0;
  const a = coefficients[0];
  const b = coefficients[1];
  if (isNaN(a) || isNaN(b)) return 0;
  return a * Math.exp(b * x);
}

export function evaluateLogarithmic(coefficients, x) {
  if (!coefficients || coefficients.length < 2) return null;
  if (x <= 0) return null;
  const a = coefficients[0];
  const b = coefficients[1];
  if (isNaN(a) || isNaN(b)) return null;
  return a + b * Math.log(x);
}

export function evaluatePower(coefficients, x) {
  // Power: y = a * x^b
  if (!coefficients || coefficients.length < 2) return null;
  if (x <= 0) return null;
  const a = coefficients[0];
  const b = coefficients[1];
  if (isNaN(a) || isNaN(b)) return null;
  return a * Math.pow(x, b);
}

export function evaluateSine(coefficients, x) {
  // Sine: y = A * sin(B * x + C) + D
  // coefficients: [A, B, C, D]
  if (!coefficients || coefficients.length < 4) return null;
  const [A, B, C, D] = coefficients;
  if ([A, B, C, D].some((v) => isNaN(v))) return null;
  return A * Math.sin(B * x + C) + D;
}

export function predictY(model, x) {
  if (!model) return 0;
  if (model.model === "Linear") {
    const [m, c] = model.coefficients;
    return m * x + c;
  }
  // other model predictions handled elsewhere
  return 0;
}
