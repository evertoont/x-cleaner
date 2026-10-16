import { messages } from './i18n'

export class XCleanerError extends Error {}

export class XTabUnavailableError extends XCleanerError {
  constructor() {
    super(messages.errors.tabUnavailable)
    this.name = 'XTabUnavailableError'
  }
}

export class XNotLoggedInError extends XCleanerError {
  constructor() {
    super(messages.errors.notLoggedIn)
    this.name = 'XNotLoggedInError'
  }
}

export class XSessionExpiredError extends XCleanerError {
  constructor() {
    super(messages.errors.sessionExpired)
    this.name = 'XSessionExpiredError'
  }
}

export function describeError(error: unknown): string {
  if (error instanceof XCleanerError) {
    return error.message
  }

  return messages.errors.generic
}
