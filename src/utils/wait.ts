export const wait = async (
  func: () => Promise<boolean>,
  maxAttempt = 1200,
  delay = 500
) => {
  for (let attempt = 0; attempt < maxAttempt; ++attempt) {
    if (await func()) {
      return;
    }
    await new Promise((r) => setTimeout(r, delay));
  }
  throw new Error("Timeout");
};
