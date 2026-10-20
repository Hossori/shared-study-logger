/** `promise` が `ms` 以内に settle しなければ reject する。 */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message = "timeout",
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(message));
    }, ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}
