// Global fix to suppress noisy ResizeObserver loop errors thrown by some third-party libraries
// This file should be imported as early as possible (main.tsx) to attach handlers before components mount.

const IGNORED_MESSAGES = [
  "ResizeObserver loop limit exceeded",
  "ResizeObserver loop completed with undelivered notifications",
];

function isIgnoredMessage(msg?: unknown) {
  if (!msg) return false;
  try {
    const text = String(msg);
    return IGNORED_MESSAGES.some((m) => text.includes(m));
  } catch {
    return false;
  }
}

if (typeof window !== "undefined") {
  // Prevent the error event from propagating when it matches our ignore list
  window.addEventListener(
    "error",
    (event: ErrorEvent) => {
      const message =
        event.message || (event.error && (event.error as any).message);
      if (isIgnoredMessage(message)) {
        try {
          event.stopImmediatePropagation?.();
        } catch {}
        try {
          event.preventDefault?.();
        } catch {}
      }
    },
    true,
  );

  // Patch console.error to avoid noisy logs in devtools
  try {
    const originalConsoleError = console.error.bind(console);
    console.error = (...args: unknown[]) => {
      if (args && args.length > 0 && isIgnoredMessage(args[0])) return;
      originalConsoleError(...args);
    };
  } catch {}
}

export {};
