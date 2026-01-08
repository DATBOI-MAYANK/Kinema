export function calculateAIC(n, k, r2) {
  // Handle edge cases
  if (r2 === null || isNaN(r2)) {
    return null;
  }

  if (r2 >= 0.9999) {
    // Near-perfect fit - return very low value instead of -Infinity
    return -1000;
  }

  if (r2 <= 0.0001) {
    // Very poor fit - return very high value instead of Infinity
    return 1000;
  }

  // Approximation using R² (acceptable for academic use)
  return n * Math.log(1 - r2) + 2 * k;
}
