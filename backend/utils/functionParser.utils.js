import { evaluate } from "mathjs";

export function CalculateY(expression, x) {
  try {
    const y = evaluate(expression, { x });
    return y;
  } catch (err) {
    return NaN;
  }
}

export function generateFunctionPoints(
  expression,
  min = -10,
  max = 10,
  step = 0.2,
) {
  const points = [];

  for (let x = min; x <= max; x += step) {
    const y = evaluate(expression, x);
    if (Number.isFinite(y)) {
      points.push([x, y]);
    }
  }

  return points;
}

export function normalizeEquation(eq) {
  return eq.replace("y=", "").replace(/\s+/g, "").replace(/(\d)x/g, "$1*x");
}
