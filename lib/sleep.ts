export function sleep(durationMs: number, signal?: AbortSignal): Promise<void> {
  return new Promise(resolve => {
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
