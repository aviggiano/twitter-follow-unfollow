export default async function waitFor(ms = 10e3): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
