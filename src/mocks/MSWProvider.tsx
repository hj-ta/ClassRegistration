// "use client";

// import { useEffect, useState, type ReactNode } from "react";

// export function MSWProvider({ children }: { children: ReactNode }) {
//   const [ready, setReady] = useState(process.env.NODE_ENV !== "development");

//   useEffect(() => {
//     if (process.env.NODE_ENV !== "development") return;
//     let cancelled = false;
//     (async () => {
//       const { worker } = await import("@/mocks/browser");
//       await worker.start({
//         onUnhandledRequest: "bypass",
//         serviceWorker: { url: "/mockServiceWorker.js" },
//       }).catch(() => {
//         // 이미 실행 중이면 무시 (StrictMode 두 번 실행 대응)
//       });
//       if (!cancelled) setReady(true);
//     })();
//     return () => {
//       cancelled = true;
//     };
//   }, []);

//   if (!ready) {
//     return (
//       <div className="flex h-screen items-center justify-center text-sm text-gray-500">
//         Mock API 준비 중…
//       </div>
//     );
//   }
//   return <>{children}</>;
// }

//라이브데모 추가
"use client";

import { useEffect, useState, type ReactNode } from "react";

// MSW는 원래 개발 환경에서만 활성화하지만,
// 별도 백엔드 없이 라이브 데모를 위해 production에서도 활성화.
export function MSWProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    (async () => {
      const { worker } = await import("@/mocks/browser");
      await worker
        .start({
          onUnhandledRequest: "bypass",
          serviceWorker: { url: "/mockServiceWorker.js" },
        })
        .catch((e) => {
          console.warn("MSW start failed:", e);
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