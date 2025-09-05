export async function waitFor(
  predicate: () => boolean,
  timeoutMs = 3000,
  intervalMs = 100,
): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (predicate()) return true;
    await new Promise(r => setTimeout(r, intervalMs));
  }
  return false;
}