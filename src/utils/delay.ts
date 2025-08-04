export function delay(timeout: number): Promise<any> {
  return new Promise((resolve) => setTimeout(resolve, timeout));
}
// export async function delay<T>(cb: () => T, timeout: number): Promise<T> {
//   return await new Promise<T>((resolve, reject) => {
//     setTimeout(async () => {
//       try {
//         resolve(await cb());
//       } catch (e) {
//         reject(e);
//       }
//     }, timeout);
//   });
// }
