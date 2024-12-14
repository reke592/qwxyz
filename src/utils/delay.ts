export async function delay<T>(cb: () => T, timeout: number): Promise<T> {
  return await new Promise<T>((resolve) => {
    setTimeout(() => resolve(cb()), timeout);
  });
}
