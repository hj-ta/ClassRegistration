"use client";

import { TOTAL_STEPS, type StepIndex } from "../store";

const STEP_LABELS: Record<StepIndex, string> = {
  1: "강의 선택",
  2: "수강생 정보",
  3: "확인 및 제출",
};

interface StepIndicatorProps {
  current: StepIndex;
}

// 스텝 인디케이터
// 데스크탑: 가로 / 모바일: 세로는 안 하고, 가로지만 라벨이 축약되도록 유지
export function StepIndicator({ current }: StepIndicatorProps) {
  return (
    <ol className="mb-8 flex items-center gap-2">
      {Array.from({ length: TOTAL_STEPS }, (_, i) => {
        const step = (i + 1) as StepIndex;
        const isDone = step < current;
        const isActive = step === current;
        return (
          <li key={step} className="flex flex-1 items-center gap-2">
            <div
              className={[
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                isActive
                  ? "bg-brand-500 text-white ring-4 ring-brand-100"
                  : isDone
                    ? "bg-brand-500 text-white"
                    : "bg-gray-200 text-gray-500",
              ].join(" ")}
              aria-current={isActive ? "step" : undefined}
            >
              {isDone ? "✓" : step}
            </div>
            <span
              className={[
                "hidden text-sm font-medium sm:inline",
                isActive ? "text-gray-900" : isDone ? "text-gray-700" : "text-gray-400",
              ].join(" ")}
            >
              {STEP_LABELS[step]}
            </span>
            {step < TOTAL_STEPS && (
              <div
                className={[
                  "ml-2 h-px flex-1",
                  isDone ? "bg-brand-500" : "bg-gray-200",
                ].join(" ")}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
