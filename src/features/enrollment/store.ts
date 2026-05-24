"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Course, EnrollmentType, Applicant, GroupInfo, Participant } from "./types";

// 평가 기준 2번 - 스텝 간 데이터 공유
// Context보다 zustand를 택한 이유:
//  - 셀렉터 단위 구독으로 불필요한 리렌더를 막을 수 있다 (예: 스텝 인디케이터는 step만 구독)
//  - persist 미들웨어로 "임시 저장"(선택 구현 1번)을 한 줄로 처리할 수 있다
//  - React Hook Form은 스텝별 폼 UI 안에서 비제어로 동작하고,
//    "스텝 간에 넘어다닐 값"만 이 store에 모은다. 즉, RHF = step-local, store = cross-step.

export const TOTAL_STEPS = 3;
export type StepIndex = 1 | 2 | 3;

// store에 들어가는 폼 데이터 (모두 partial — 작성 중 상태이므로)
export interface EnrollmentDraft {
  courseId?: string;
  selectedCourse?: Course;
  type?: EnrollmentType;
  applicant?: Applicant;
  group?: GroupInfo;
  agreedToTerms?: boolean;
}

interface EnrollmentState {
  step: StepIndex;
  draft: EnrollmentDraft;
  // 한 번이라도 단체로 입력했던 group 데이터를 백업(전환 취소/복귀 시 복구용으로는 사용하지 않음 — 정합성 우선)
  setStep: (step: StepIndex) => void;
  goNext: () => void;
  goPrev: () => void;
  setCourse: (course: Course) => void;
  setType: (type: EnrollmentType) => void;
  setApplicant: (applicant: Applicant) => void;
  setGroup: (group: GroupInfo) => void;
  setAgreedToTerms: (agreed: boolean) => void;
  // 단체 → 개인 전환 시 group 데이터 초기화 (평가 기준 1번)
  clearGroup: () => void;
  // 헤드카운트 변경 시 참가자 배열 길이 맞추기
  syncParticipantsLength: (headCount: number) => void;
  reset: () => void;
}

const initialDraft: EnrollmentDraft = {};

const emptyParticipant: Participant = { name: "", email: "" };

export const useEnrollmentStore = create<EnrollmentState>()(
  persist(
    (set, get) => ({
      step: 1,
      draft: initialDraft,

      setStep: (step) => set({ step }),
      goNext: () =>
        set((s) => ({
          step: Math.min(TOTAL_STEPS, s.step + 1) as StepIndex,
        })),
      goPrev: () =>
        set((s) => ({
          step: Math.max(1, s.step - 1) as StepIndex,
        })),

      setCourse: (course) =>
        set((s) => ({
          draft: { ...s.draft, courseId: course.id, selectedCourse: course },
        })),

      setType: (type) =>
        set((s) => ({
          draft: { ...s.draft, type },
        })),

      setApplicant: (applicant) =>
        set((s) => ({
          draft: { ...s.draft, applicant },
        })),

      setGroup: (group) =>
        set((s) => ({
          draft: { ...s.draft, group },
        })),

      setAgreedToTerms: (agreedToTerms) =>
        set((s) => ({
          draft: { ...s.draft, agreedToTerms },
        })),

      clearGroup: () =>
        set((s) => {
          const next = { ...s.draft };
          delete next.group;
          return { draft: next };
        }),

      syncParticipantsLength: (headCount) => {
        const cur = get().draft.group;
        const prevParticipants = cur?.participants ?? [];
        const next: Participant[] = Array.from({ length: headCount }, (_, i) =>
          prevParticipants[i] ?? { ...emptyParticipant },
        );
        set((s) => ({
          draft: {
            ...s.draft,
            group: {
              organizationName: cur?.organizationName ?? "",
              contactPerson: cur?.contactPerson ?? "",
              headCount,
              participants: next,
            },
          },
        }));
      },

      reset: () => set({ step: 1, draft: initialDraft }),
    }),
    {
      name: "enrollment-draft-v1",
      storage: createJSONStorage(() => localStorage),
      // 제출 완료 후 다시 폼을 열었을 때 stale draft가 떠 있는 걸 막기 위해
      // 컴포넌트에서 reset()을 호출해 비운다. 별도 partialize는 두지 않음.
    },
  ),
);
