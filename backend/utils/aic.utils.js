export function calculateAIC(n, k, r2) {
  // Avoid log(0)
  if (r2 <= 0) return Infinity;

  // Approximation using R² (acceptable for academic use)
  return n * Math.log(1 - r2) + 2 * k;
}
