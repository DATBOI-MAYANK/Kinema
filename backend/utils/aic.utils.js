export function calculateAIC(n, k, sse) {
  if (!Number.isFinite(n) || !Number.isFinite(k) || !Number.isFinite(sse)) {
    return null;
  }

  if (n <= 0 || k <= 0 || sse < 0) {
    return null;
  }

  const safeSSE = Math.max(sse, Number.EPSILON);
  const sigma2 = safeSSE / n;

  if (!Number.isFinite(sigma2) || sigma2 <= 0) {
    return null;
  }

  return n * Math.log(sigma2) + 2 * k;
}

export function calculateAICc(n, k, sse) {
  const aic = calculateAIC(n, k, sse);

  if (!Number.isFinite(aic)) {
    return null;
  }

  const denominator = n - k - 1;

  if (denominator <= 0) {
    return Number.POSITIVE_INFINITY;
  }

  return aic + (2 * k * (k + 1)) / denominator;
}
