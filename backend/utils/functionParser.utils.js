import { evaluate } from "mathjs";

export function CalculateY(expression, x) {
  try {
    const y = evaluate(expression, { x });
    return y;
  } catch (err) {
    return NaN;
  }
}

export function normalizeEquation(eq) {
  return eq.replace("y=", "").replace(/\s+/g, "").replace(/(\d)x/g, "$1*x");
}
