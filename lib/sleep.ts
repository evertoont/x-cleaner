export function sleep(durationMs: number, signal?: AbortSignal): Promise<void> {
  return new Promise(resolve => {
    if (signal?.aborted) {
      resolve()
      return
    }

    const timeoutId = setTimeout(resolve, durationMs)

    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timeoutId)
        resolve()
      },
      { once: true },
    )
  })
}
