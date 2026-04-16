import { evaluate } from "mathjs";

export function generateEquationPoints(expression) {
  const points = [];
  if (!expression || expression.trim() === "") return points;

  // sample from -10 to 10
  for (let x = -10; x <= 10; x += 0.2) {
    try {
      const y = evaluate(expression, { x });
      if (Number.isFinite(y)) {
        points.push([x, y]);
      }
    } catch {
      // ignore evaluation errors for some x values
    }
  }

  return points;
}
