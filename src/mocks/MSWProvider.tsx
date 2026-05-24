"use client";

import { useEffect, useState, type ReactNode } from "react";

export function MSWProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(process.env.NODE_ENV !== "development");

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    let cancelled = false;
    (async () => {
      const { worker } = await import("@/mocks/browser");
      await worker.start({
        onUnhandledRequest: "bypass",
        serviceWorker: { url: "/mockServiceWorker.js" },
      });
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-gray-500">
        Mock API 준비 중…
      </div>
    );
  }
  return <>{children}</>;
}
