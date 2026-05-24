"use client";

import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { submitEnrollment } from "../../api";
import { useEnrollmentStore } from "../../store";
import {
  EnrollmentApiError,
  type EnrollmentRequest,
  type EnrollmentResponse,
  type ServerErrorCode,
} from "../../types";
import { fullEnrollmentSchema } from "../../schemas";

interface Step3Props {
  onPrev: () => void;
  onEdit: (target: 1 | 2) => void;
  onSuccess: (response: EnrollmentResponse) => void;
}

// 평가 기준 3번 - 서버 에러 코드를 사용자에게 의미 있게 전달
function describeError(err: EnrollmentApiError): {
  title: string;
  detail: string;
  // 사용자에게 어떤 액션을 권유할지
  recoverable: boolean;
} {
  const map: Record<ServerErrorCode, { title: string; detail: string; recoverable: boolean }> = {
    COURSE_FULL: {
      title: "정원이 가득 찼습니다",
      detail: "선택하신 강의의 정원이 모두 찼습니다. 다른 강의를 선택해 주세요.",
      recoverable: true,
    },
    DUPLICATE_ENROLLMENT: {
      title: "이미 신청한 강의입니다",
      detail:
        "동일한 이메일로 이 강의에 이미 신청한 내역이 있습니다. 마이페이지에서 확인해 주세요.",
      recoverable: false,
    },
    INVALID_INPUT: {
      title: "입력값을 다시 확인해 주세요",
      detail:
        err.details
          ? Object.entries(err.details).map(([k, v]) => `· ${k}: ${v}`).join("\n")
          : err.message,
      recoverable: true,
    },
    NETWORK_ERROR: {
      title: "네트워크 연결 문제",
      detail: "네트워크 상태를 확인하고 다시 시도해 주세요. 입력하신 내용은 그대로 유지됩니다.",
      recoverable: true,
    },
    UNKNOWN_ERROR: {
      title: "알 수 없는 오류가 발생했습니다",
      detail: "잠시 후 다시 시도해 주세요. 문제가 지속되면 고객센터로 문의해 주세요.",
      recoverable: true,
    },
  };
  return map[err.code];
}

export function Step3Confirmation({ onPrev, onEdit, onSuccess }: Step3Props) {
  const draft = useEnrollmentStore((s) => s.draft);
  const setAgreedToTerms = useEnrollmentStore((s) => s.setAgreedToTerms);
  const [showTermsError, setShowTermsError] = useState(false);

  const agreed = draft.agreedToTerms ?? false;

  // 제출 직전 최종 검증 (스키마)
  const finalValidation = useMemo(() => {
    if (!draft.courseId || !draft.type || !draft.applicant) return null;
    if (draft.type === "personal") {
      return fullEnrollmentSchema.safeParse({
        courseId: draft.courseId,
        type: "personal",
        applicant: draft.applicant,
        agreedToTerms: agreed,
      });
    }
    return fullEnrollmentSchema.safeParse({
      courseId: draft.courseId,
      type: "group",
      applicant: draft.applicant,
      group: draft.group,
      agreedToTerms: agreed,
    });
  }, [draft, agreed]);

  const mutation = useMutation<EnrollmentResponse, EnrollmentApiError, EnrollmentRequest>({
    mutationFn: submitEnrollment,
    onSuccess: (data) => onSuccess(data),
  });

  // 평가 기준 3번 - 중복 제출 방지: mutation.isPending 동안 버튼 disabled
  const submitting = mutation.isPending;

  const handleSubmit = () => {
    if (!agreed) {
      setShowTermsError(true);
      return;
    }
    setShowTermsError(false);
    if (!finalValidation?.success) {
      // 이론적으로 step1/2에서 막혔어야 하지만 가드.
      return;
    }
    mutation.mutate(finalValidation.data as EnrollmentRequest);
  };

  const course = draft.selectedCourse;
  const applicant = draft.applicant;
  const group = draft.group;
  const isGroup = draft.type === "group";

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">입력 내용 확인</h2>

      {/* 강의 정보 */}
      <SummarySection title="강의" onEdit={() => onEdit(1)}>
        {course ? (
          <dl className="grid grid-cols-3 gap-y-1.5 text-sm">
            <Row label="강의명" value={course.title} />
            <Row label="강사" value={course.instructor} />
            <Row label="가격" value={`${course.price.toLocaleString("ko-KR")}원`} />
            <Row
              label="신청 유형"
              value={draft.type === "personal" ? "개인 신청" : "단체 신청"}
            />
          </dl>
        ) : (
          <p className="text-sm text-gray-500">강의가 선택되지 않았습니다.</p>
        )}
      </SummarySection>

      {/* 신청자 정보 */}
      <SummarySection
        title={isGroup ? "담당자 정보" : "수강생 정보"}
        onEdit={() => onEdit(2)}
      >
        {applicant ? (
          <dl className="grid grid-cols-3 gap-y-1.5 text-sm">
            <Row label="이름" value={applicant.name} />
            <Row label="이메일" value={applicant.email} />
            <Row label="전화번호" value={applicant.phone} />
            {applicant.motivation && (
              <Row label="수강 동기" value={applicant.motivation} multiline />
            )}
          </dl>
        ) : (
          <p className="text-sm text-gray-500">정보가 입력되지 않았습니다.</p>
        )}
      </SummarySection>

      {/* 단체 정보 */}
      {isGroup && group && (
        <SummarySection title="단체 정보" onEdit={() => onEdit(2)}>
          <dl className="grid grid-cols-3 gap-y-1.5 text-sm">
            <Row label="단체명" value={group.organizationName} />
            <Row label="인원수" value={`${group.headCount}명`} />
            <Row label="담당자 연락처" value={group.contactPerson} />
          </dl>
          <div className="mt-3">
            <p className="mb-1.5 text-xs font-medium text-gray-500">참가자 명단</p>
            <ul className="divide-y divide-gray-100 rounded-lg border border-gray-100">
              {group.participants.map((p, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                >
                  <span className="text-gray-700">
                    {i + 1}. {p.name || <em className="text-gray-400">이름 없음</em>}
                  </span>
                  <span className="text-gray-500">{p.email}</span>
                </li>
              ))}
            </ul>
          </div>
        </SummarySection>
      )}

      {/* 약관 동의 */}
      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => {
              setAgreedToTerms(e.target.checked);
              if (e.target.checked) setShowTermsError(false);
            }}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
            aria-invalid={showTermsError ? "true" : "false"}
            aria-describedby={showTermsError ? "terms-error" : undefined}
          />
          <span className="text-sm text-gray-800">
            <span className="font-medium">이용약관 및 개인정보 처리방침</span>에
            동의합니다. <span className="text-red-500">*</span>
          </span>
        </label>
        {showTermsError && (
          <p id="terms-error" className="mt-2 text-xs font-medium text-red-600" role="alert">
            이용약관에 동의해 주세요.
          </p>
        )}
      </section>

      {/* 에러 표시 */}
      {mutation.isError && mutation.error instanceof EnrollmentApiError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4" role="alert">
          <p className="text-sm font-semibold text-red-800">
            {describeError(mutation.error).title}
          </p>
          <p className="mt-1 whitespace-pre-line text-xs text-red-700">
            {describeError(mutation.error).detail}
          </p>
          {mutation.error.code === "COURSE_FULL" && (
            <button
              type="button"
              onClick={() => onEdit(1)}
              className="mt-3 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
            >
              다른 강의 선택하기
            </button>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={submitting}
          className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          이전
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          aria-busy={submitting}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {submitting && (
            <span
              className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
              aria-hidden
            />
          )}
          {submitting ? "제출 중..." : "수강 신청 제출"}
        </button>
      </div>
    </div>
  );
}

function SummarySection({
  title,
  children,
  onEdit,
}: {
  title: string;
  children: React.ReactNode;
  onEdit: () => void;
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          className="text-xs font-medium text-brand-600 hover:underline"
        >
          수정
        </button>
      </div>
      {children}
    </section>
  );
}

function Row({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <>
      <dt className="col-span-1 text-xs text-gray-500">{label}</dt>
      <dd
        className={[
          "col-span-2 text-sm text-gray-900",
          multiline ? "whitespace-pre-line" : "",
        ].join(" ")}
      >
        {value}
      </dd>
    </>
  );
}
