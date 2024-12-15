export async function delay<T>(cb: () => T, timeout: number): Promise<T> {
  return await new Promise<T>((resolve, reject) => {
    setTimeout(async () => {
      try {
        resolve(await cb());
      } catch (e) {
        reject(e);
      }
    }, timeout);
  });
}
