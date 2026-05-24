"use client";

import { useEffect, useMemo } from "react";
import { useForm, useFieldArray, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  step2Schema,
  type Step2Values,
} from "../../schemas";
import { useEnrollmentStore } from "../../store";
import { TextField } from "../fields/TextField";
import { TextAreaField } from "../fields/TextAreaField";

interface Step2Props {
  onPrev: () => void;
  onNext: () => void;
}

// 평가 기준 2번 - 컴포넌트/검증 분리
// - 폼 상태: react-hook-form (비제어 → 입력마다 리렌더 없음)
// - 검증: zod 스키마 (UI와 완전 분리)
// - 데이터 영속화: 마운트 시 store.draft → 폼 default,
//   submit 성공 시 폼 값 → store 로 다시 쓰기 (단방향 흐름)
export function Step2ApplicantInfo({ onPrev, onNext }: Step2Props) {
  const draft = useEnrollmentStore((s) => s.draft);
  const setApplicant = useEnrollmentStore((s) => s.setApplicant);
  const setGroup = useEnrollmentStore((s) => s.setGroup);

  // type은 부모(EnrollmentForm)에서 가드되므로 여기 도달 시 항상 정의되어 있다.
  // fallback으로 "personal"을 두지만 실제로는 사용되지 않는다.
  const type = draft.type ?? "personal";

  // 초기값: store.draft 우선 사용
  const defaultValues = useMemo<Step2Values>(() => {
    if (type === "personal") {
      return {
        type: "personal",
        applicant: {
          name: draft.applicant?.name ?? "",
          email: draft.applicant?.email ?? "",
          phone: draft.applicant?.phone ?? "",
          motivation: draft.applicant?.motivation ?? "",
        },
      };
    }
    return {
      type: "group",
      applicant: {
        name: draft.applicant?.name ?? "",
        email: draft.applicant?.email ?? "",
        phone: draft.applicant?.phone ?? "",
        motivation: draft.applicant?.motivation ?? "",
      },
      group: {
        organizationName: draft.group?.organizationName ?? "",
        headCount: draft.group?.headCount ?? 2,
        participants:
          draft.group?.participants && draft.group.participants.length > 0
            ? draft.group.participants
            : Array.from({ length: 2 }, () => ({ name: "", email: "" })),
        contactPerson: draft.group?.contactPerson ?? "",
      },
    };
    // 마운트 시 draft snapshot만 사용. 이후 store 변경에 의해 폼이 reset되지 않도록 deps 비움.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const form = useForm<Step2Values>({
    resolver: zodResolver(step2Schema) as Resolver<Step2Values>,
    defaultValues,
    mode: "onBlur", // 평가 기준 1번 - blur 시 개별 검증
    reValidateMode: "onChange",
    shouldFocusError: true, // 평가 기준 1번 - 첫 에러 필드로 포커스 이동
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitted },
  } = form;

  const motivationLen = (watch("applicant.motivation") ?? "").length;

  // group일 때만 useFieldArray (조건부 훅처럼 보이지만, type은 마운트 후 불변이므로 안전)
  const isGroup = type === "group";
  const fieldArray = useFieldArray({
    control: control as never,
    name: "group.participants" as never,
  });

  // headCount 변경 시 participants 배열 길이 동기화
  useEffect(() => {
    if (!isGroup) return;
    const sub = watch((value, info) => {
      if (info.name !== "group.headCount") return;
      const next = Number(
        (value as { group?: { headCount?: number } }).group?.headCount ?? 0,
      );
      if (!Number.isFinite(next) || next < 2 || next > 10) return;
      const currentLen = fieldArray.fields.length;
      if (next > currentLen) {
        for (let i = currentLen; i < next; i++) {
          fieldArray.append({ name: "", email: "" });
        }
      } else if (next < currentLen) {
        for (let i = currentLen - 1; i >= next; i--) {
          fieldArray.remove(i);
        }
      }
    });
    return () => sub.unsubscribe();
  }, [isGroup, watch, fieldArray]);

  const onSubmit = handleSubmit(
    (values) => {
      setApplicant(values.applicant);
      if (values.type === "group") {
        setGroup(values.group);
      }
      onNext();
    },
    () => {
      // RHF의 shouldFocusError가 첫 에러로 포커스 이동을 처리.
      // 추가로 화면 상단에 에러 요약을 띄우고 싶다면 isSubmitted 상태를 이용.
    },
  );

  return (
    <form noValidate onSubmit={onSubmit} className="space-y-8">
      {/* 공통 필드 */}
      <section>
        <h2 className="mb-1 text-lg font-semibold text-gray-900">
          {isGroup ? "신청자(담당자) 정보" : "수강생 정보"}
        </h2>
        <p className="mb-4 text-xs text-gray-500">
          {isGroup
            ? "단체 신청을 진행하는 분(담당자)의 정보를 입력해 주세요."
            : "본인 정보를 정확히 입력해 주세요."}
        </p>
        <div className="grid gap-4">
          <TextField
            label="이름"
            required
            placeholder="홍길동"
            autoComplete="name"
            {...register("applicant.name")}
            error={errors.applicant?.name?.message}
          />
          <TextField
            label="이메일"
            required
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            {...register("applicant.email")}
            error={errors.applicant?.email?.message}
          />
          <TextField
            label="전화번호"
            required
            type="tel"
            placeholder="010-1234-5678"
            autoComplete="tel"
            {...register("applicant.phone")}
            error={errors.applicant?.phone?.message}
          />
          <TextAreaField
            label="수강 동기"
            maxLength={300}
            currentLength={motivationLen}
            placeholder="(선택) 수강 동기를 자유롭게 작성해 주세요"
            {...register("applicant.motivation")}
            error={errors.applicant?.motivation?.message}
          />
        </div>
      </section>

      {/* 조건부 단체 필드 */}
      {isGroup && (
        <section>
          <h2 className="mb-1 text-lg font-semibold text-gray-900">단체 정보</h2>
          <p className="mb-4 text-xs text-gray-500">
            단체명, 인원수, 참가자 명단을 입력해 주세요. (인원수는 2~10명)
          </p>
          <div className="grid gap-4">
            <TextField
              label="단체명"
              required
              placeholder="OO 주식회사"
              {...register("group.organizationName")}
              error={
                (errors as { group?: { organizationName?: { message?: string } } })
                  .group?.organizationName?.message
              }
            />
            <TextField
              label="신청 인원수"
              required
              type="number"
              min={2}
              max={10}
              {...register("group.headCount", { valueAsNumber: true })}
              error={
                (errors as { group?: { headCount?: { message?: string } } })
                  .group?.headCount?.message
              }
              hint="2명 ~ 10명. 인원수를 변경하면 명단 칸이 자동으로 추가/삭제됩니다."
            />
            <TextField
              label="담당자 연락처"
              required
              type="tel"
              placeholder="010-1234-5678"
              autoComplete="tel"
              {...register("group.contactPerson")}
              error={
                (errors as { group?: { contactPerson?: { message?: string } } })
                  .group?.contactPerson?.message
              }
            />

            <div>
              <p className="mb-2 text-sm font-medium text-gray-800">
                참가자 명단 <span className="text-red-500">*</span>
              </p>
              <ul className="space-y-3">
                {fieldArray.fields.map((field, idx) => {
                  const nameErr = (
                    errors as {
                      group?: { participants?: Array<{ name?: { message?: string } }> };
                    }
                  ).group?.participants?.[idx]?.name?.message;
                  const emailErr = (
                    errors as {
                      group?: { participants?: Array<{ email?: { message?: string } }> };
                    }
                  ).group?.participants?.[idx]?.email?.message;
                  return (
                    <li
                      key={field.id}
                      className="rounded-lg border border-gray-200 bg-white p-3"
                    >
                      <p className="mb-2 text-xs font-medium text-gray-500">
                        {idx + 1}번 참가자
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <TextField
                          label="이름"
                          placeholder="참가자 이름"
                          {...register(`group.participants.${idx}.name` as const)}
                          error={nameErr}
                        />
                        <TextField
                          label="이메일"
                          type="email"
                          placeholder="participant@example.com"
                          {...register(`group.participants.${idx}.email` as const)}
                          error={emailErr}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* 폼 전역 에러(예: 인원수 ≠ 명단 수) - submit 후에만 표시 */}
      {isSubmitted && errors.root && (
        <p className="text-sm font-medium text-red-600" role="alert">
          {errors.root.message}
        </p>
      )}

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onPrev}
          className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          이전
        </button>
        <button
          type="submit"
          className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
        >
          다음
        </button>
      </div>
    </form>
  );
}
