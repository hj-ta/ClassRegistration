"use client";

import { forwardRef, type TextareaHTMLAttributes } from "react";

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  maxLength?: number;
  currentLength?: number;
  required?: boolean;
}

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  function TextAreaField(
    { label, error, maxLength, currentLength, required, id, className, ...rest },
    ref,
  ) {
    const inputId = id ?? rest.name;
    const errorId = error ? `${inputId}-error` : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between">
          <label htmlFor={inputId} className="text-sm font-medium text-gray-800">
            {label}
            {required && <span className="ml-0.5 text-red-500">*</span>}
          </label>
          {typeof maxLength === "number" && (
            <span className="text-xs text-gray-400">
              {currentLength ?? 0} / {maxLength}
            </span>
          )}
        </div>
        <textarea
          ref={ref}
          id={inputId}
          maxLength={maxLength}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={errorId}
          className={[
            "w-full resize-y rounded-lg border bg-white px-3 py-2.5 text-sm",
            "outline-none transition focus:ring-2",
            error
              ? "border-red-400 focus:border-red-500 focus:ring-red-100"
              : "border-gray-200 focus:border-brand-500 focus:ring-brand-100",
            className ?? "",
          ].join(" ")}
          rows={4}
          {...rest}
        />
        {error && (
          <p id={errorId} className="text-xs font-medium text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);
