export function createError(message: string, cause?: unknown): Error {
  return new (Error as new (msg: string, opts?: { cause: unknown }) => Error)(message, { cause });
}
