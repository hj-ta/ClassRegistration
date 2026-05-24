"use client";

import type { EnrollmentResponse } from "../types";
import type { EnrollmentDraft } from "../store";

interface SuccessScreenProps {
  response: EnrollmentResponse;
  draft: EnrollmentDraft;
  onClose: () => void;
}

export function SuccessScreen({ response, draft, onClose }: SuccessScreenProps) {
  const course = draft.selectedCourse;
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
        <svg
          aria-hidden
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <h2 className="mt-4 text-xl font-bold text-gray-900">
        수강 신청이 완료되었습니다
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        입력하신 이메일로 안내 메일을 보내드렸습니다.
      </p>

      <dl className="mx-auto mt-6 max-w-sm divide-y divide-gray-100 rounded-xl border border-gray-100 text-left text-sm">
        <Row label="신청 번호" value={response.enrollmentId} mono />
        <Row
          label="상태"
          value={response.status === "confirmed" ? "확정" : "대기"}
        />
        <Row
          label="신청 일시"
          value={new Date(response.enrolledAt).toLocaleString("ko-KR")}
        />
        {course && <Row label="강의" value={course.title} />}
        <Row
          label="신청 유형"
          value={draft.type === "group" ? "단체 신청" : "개인 신청"}
        />
      </dl>

      <button
        type="button"
        onClick={onClose}
        className="mt-6 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
      >
        새로 신청하기
      </button>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5">
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd
        className={[
          "text-sm text-gray-900",
          mono ? "font-mono tracking-tight" : "",
        ].join(" ")}
      >
        {value}
      </dd>
    </div>
  );
}
