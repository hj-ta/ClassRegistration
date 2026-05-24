"use client";

import { useEffect, useState } from "react";
import { useEnrollmentStore, type StepIndex } from "../store";
import type { EnrollmentResponse } from "../types";
import { StepIndicator } from "./StepIndicator";
import { Step1CourseSelection } from "./steps/Step1CourseSelection";
import { Step2ApplicantInfo } from "./steps/Step2ApplicantInfo";
import { Step3Confirmation } from "./steps/Step3Confirmation";
import { SuccessScreen } from "./SuccessScreen";

// 스텝 라우팅 책임은 이 컴포넌트가 가진다.
// 각 Step 컴포넌트는 onNext/onPrev/onEdit prop만 받아 라우팅을 모른다.
// 5단계로 늘어나도 이 컴포넌트와 store의 TOTAL_STEPS만 손대면 된다.
export function EnrollmentForm() {
  const step = useEnrollmentStore((s) => s.step);
  const setStep = useEnrollmentStore((s) => s.setStep);
  const goNext = useEnrollmentStore((s) => s.goNext);
  const goPrev = useEnrollmentStore((s) => s.goPrev);
  const reset = useEnrollmentStore((s) => s.reset);
  const draft = useEnrollmentStore((s) => s.draft);

  const [success, setSuccess] = useState<EnrollmentResponse | null>(null);

  // 비정상 진입 가드: step2/3 진입 조건 불충족 시 step1으로 강제 복귀
  useEffect(() => {
    if (step >= 2 && (!draft.courseId || !draft.type)) {
      setStep(1);
    }
    if (step === 3 && !draft.applicant) {
      setStep(2);
    }
  }, [step, draft, setStep]);

  // 이탈 방지
  // 입력 데이터가 있고 아직 제출되지 않았을 때 새로고침/닫기 시 경고.
  useEffect(() => {
    if (success) return;
    const hasInput =
      !!draft.courseId || !!draft.applicant || !!draft.group;
    if (!hasInput) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [draft, success]);

  if (success) {
    return (
      <SuccessScreen
        response={success}
        draft={draft}
        onClose={() => {
          reset();
          setSuccess(null);
        }}
      />
    );
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-8">
      <StepIndicator current={step} />

      {step === 1 && <Step1CourseSelection onNext={goNext} />}
      {step === 2 && draft.courseId && draft.type && (
        <Step2ApplicantInfo onPrev={goPrev} onNext={goNext} />
      )}
      {step === 3 && draft.courseId && draft.type && draft.applicant && (
        <Step3Confirmation
          onPrev={goPrev}
          onEdit={(target: 1 | 2) => setStep(target as StepIndex)}
          onSuccess={(res) => setSuccess(res)}
        />
      )}
    </div>
  );
}
