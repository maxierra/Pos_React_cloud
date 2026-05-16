import { logPerformance } from "@/lib/monitoring";

type ServerActionFn<T extends any[], R> = (...args: T) => Promise<R>;

/** Next.js `redirect()` throws; must not count as a 500 in monitoring. */
function isNextRedirect(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "digest" in e &&
    typeof (e as { digest?: unknown }).digest === "string" &&
    (e as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

interface ActionOptions {
  endpoint: string;
  skipLogging?: boolean;
  metadata?: Record<string, unknown>;
}

export function withMonitoring<T extends unknown[], R>(
  action: ServerActionFn<T, R>,
  options: ActionOptions
): ServerActionFn<T, R> {
  return async (...args: T): Promise<R> => {
    const startTime = Date.now();
    let error: Error | null = null;

    try {
      return await action(...args);
    } catch (err) {
      if (isNextRedirect(err)) {
        throw err;
      }
      error = err instanceof Error ? err : new Error(String(err));
      throw err;
    } finally {
      const durationMs = Date.now() - startTime;
      
      if (!options.skipLogging) {
        logPerformance({
          endpoint: options.endpoint,
          method: "POST",
          durationMs,
          statusCode: error ? 500 : 200,
          errorMessage: error?.message,
          metadata: {
            ...options.metadata,
            argsCount: args.length,
          },
        }).catch(console.error);
      }
    }
  };
}

export function createMonitoredAction<T extends unknown[], R>(
  action: ServerActionFn<T, R>,
  endpoint: string
): ServerActionFn<T, R> {
  return withMonitoring(action, { endpoint });
}