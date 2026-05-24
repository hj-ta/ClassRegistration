"use client";

import type { Course } from "../types";

interface CourseCardProps {
  course: Course;
  selected: boolean;
  onSelect: () => void;
}

function formatPrice(price: number) {
  return price.toLocaleString("ko-KR") + "원";
}

function formatDateRange(start: string, end: string) {
  const fmt = (s: string) => {
    const d = new Date(s);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  };
  return `${fmt(start)} ~ ${fmt(end)}`;
}

export function CourseCard({ course, selected, onSelect }: CourseCardProps) {
  const remaining = course.maxCapacity - course.currentEnrollment;
  const isFull = remaining <= 0;
  //정원이 거의 다 찬 강의의 UX
  const isNearlyFull = !isFull && remaining <= 3;

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={isFull}
      aria-pressed={selected}
      aria-disabled={isFull}
      className={[
        "w-full rounded-xl border bg-white p-4 text-left transition",
        "focus-visible:ring-2 focus-visible:ring-brand-500",
        selected
          ? "border-brand-500 ring-2 ring-brand-100"
          : isFull
            ? "cursor-not-allowed border-gray-200 opacity-60"
            : "border-gray-200 hover:border-brand-500 hover:shadow-sm",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-gray-900">
            {course.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs text-gray-500">
            {course.description}
          </p>
        </div>
        {isFull ? (
          <span className="shrink-0 rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">
            마감
          </span>
        ) : isNearlyFull ? (
          <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
            잔여 {remaining}석
          </span>
        ) : null}
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-y-1 text-xs text-gray-600">
        <dt className="text-gray-400">강사</dt>
        <dd className="text-right">{course.instructor}</dd>
        <dt className="text-gray-400">가격</dt>
        <dd className="text-right font-medium text-gray-900">
          {formatPrice(course.price)}
        </dd>
        <dt className="text-gray-400">일정</dt>
        <dd className="text-right">
          {formatDateRange(course.startDate, course.endDate)}
        </dd>
      </dl>
    </button>
  );
}
