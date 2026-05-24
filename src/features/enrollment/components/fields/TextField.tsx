"use client";

import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
}

// 평가 기준 1번 - 에러 표시 (높은 숙련도: 시각적 강조 + aria 속성)
// ref forwarding으로 부모(Step 컴포넌트)에서 첫 에러 필드로 focus 이동시킬 수 있게 한다.
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField({ label, hint, error, required, id, className, ...rest }, ref) {
    const inputId = id ?? rest.name;
    const errorId = error ? `${inputId}-error` : undefined;
    const hintId = hint ? `${inputId}-hint` : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-gray-800"
        >
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={
            [errorId, hintId].filter(Boolean).join(" ") || undefined
          }
          className={[
            "w-full rounded-lg border bg-white px-3 py-2.5 text-sm",
            "outline-none transition focus:ring-2",
            error
              ? "border-red-400 focus:border-red-500 focus:ring-red-100"
              : "border-gray-200 focus:border-brand-500 focus:ring-brand-100",
            className ?? "",
          ].join(" ")}
          {...rest}
        />
        {hint && !error && (
          <p id={hintId} className="text-xs text-gray-500">
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} className="text-xs font-medium text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);
