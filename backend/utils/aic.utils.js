export function calculateAIC(n, k, r2) {
  // Handle edge cases
  if (r2 === null || isNaN(r2) || r2 < 0) {
    return null;
  }

  // For perfect or near-perfect fits
  if (r2 >= 0.99999) {
    // Use a penalty based on model complexity
    // More complex models get higher (worse) AIC
    return -500 + k * 10;
  }

  if (r2 <= 0.00001) {
    // Very poor fit
    return 1000 + k * 10;
  }

  // Standard AIC calculation using R²
  // AIC = n * ln(1 - R²) + 2k
  const logTerm = Math.log(1 - r2);

  if (!isFinite(logTerm)) {
    return -500 + k * 10;
  }

  return n * logTerm + 2 * k;
}
