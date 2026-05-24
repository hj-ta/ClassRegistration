"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchCourses } from "../../api";
import { useEnrollmentStore } from "../../store";
import type { Course, CourseCategory, EnrollmentType } from "../../types";
import { CATEGORY_LABELS } from "@/mocks/data";
import { CourseCard } from "../CourseCard";
import { ConfirmDialog } from "../ConfirmDialog";

interface Step1Props {
  onNext: () => void;
}

const TABS: Array<{ key: CourseCategory | "all"; label: string }> = [
  { key: "all", label: "전체" },
  { key: "development", label: CATEGORY_LABELS.development },
  { key: "design", label: CATEGORY_LABELS.design },
  { key: "marketing", label: CATEGORY_LABELS.marketing },
  { key: "business", label: CATEGORY_LABELS.business },
];

export function Step1CourseSelection({ onNext }: Step1Props) {
  const [category, setCategory] = useState<CourseCategory | "all">("all");
  const [showError, setShowError] = useState(false);
  const [pendingTypeSwitch, setPendingTypeSwitch] = useState<EnrollmentType | null>(null);

  const draft = useEnrollmentStore((s) => s.draft);
  const setCourse = useEnrollmentStore((s) => s.setCourse);
  const setType = useEnrollmentStore((s) => s.setType);
  const clearGroup = useEnrollmentStore((s) => s.clearGroup);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["courses", category],
    queryFn: () => fetchCourses(category),
  });

  const courses: Course[] = useMemo(() => data?.courses ?? [], [data]);

  const selectedCourse = draft.selectedCourse;
  const type = draft.type;

  // 평가 기준 1번 - 단체→개인 전환 시, 입력된 group 데이터가 있으면 확인 후 초기화
  const handleSelectType = (next: EnrollmentType) => {
    if (next === type) return;
    const hasGroupData = !!draft.group && (
      !!draft.group.organizationName ||
      !!draft.group.contactPerson ||
      (draft.group.participants ?? []).some((p) => p.name || p.email)
    );
    if (next === "personal" && hasGroupData) {
      setPendingTypeSwitch(next);
      return;
    }
    setType(next);
    if (next === "personal") clearGroup();
  };

  const confirmTypeSwitch = () => {
    if (pendingTypeSwitch) {
      setType(pendingTypeSwitch);
      if (pendingTypeSwitch === "personal") clearGroup();
    }
    setPendingTypeSwitch(null);
  };

  const handleNext = () => {
    if (!selectedCourse || !type) {
      setShowError(true);
      return;
    }
    setShowError(false);
    onNext();
  };

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">강의 선택</h2>

        {/* 카테고리 탭 */}
        <div className="mb-4 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setCategory(t.key)}
              className={[
                "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                category === t.key
                  ? "border-brand-500 bg-brand-500 text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300",
              ].join(" ")}
              aria-pressed={category === t.key}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 강의 리스트: loading / error / empty / list */}
        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-xl border border-gray-100 bg-gray-100"
                aria-hidden
              />
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center">
            <p className="text-sm text-red-700">강의 목록을 불러오지 못했습니다.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-3 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
            >
              다시 시도
            </button>
          </div>
        ) : courses.length === 0 ? (
          <div className="rounded-xl border border-gray-100 bg-white p-8 text-center">
            <p className="text-sm text-gray-500">
              해당 카테고리에 등록된 강의가 없습니다.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                selected={selectedCourse?.id === course.id}
                onSelect={() => setCourse(course)}
              />
            ))}
          </div>
        )}
      </section>

      {/* 선택한 강의 정보 표시 */}
      {selectedCourse && (
        <section className="rounded-xl border border-brand-100 bg-brand-50 p-4">
          <p className="text-xs font-semibold text-brand-700">선택한 강의</p>
          <p className="mt-1 text-sm font-semibold text-gray-900">
            {selectedCourse.title}
          </p>
          <p className="mt-0.5 text-xs text-gray-600">
            {selectedCourse.instructor} ·{" "}
            {selectedCourse.price.toLocaleString("ko-KR")}원
          </p>
        </section>
      )}

      {/* 신청 유형 */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">신청 유형</h2>
        <div className="grid grid-cols-2 gap-3">
          {(["personal", "group"] as EnrollmentType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => handleSelectType(t)}
              aria-pressed={type === t}
              className={[
                "rounded-xl border bg-white p-4 text-left transition",
                "focus-visible:ring-2 focus-visible:ring-brand-500",
                type === t
                  ? "border-brand-500 ring-2 ring-brand-100"
                  : "border-gray-200 hover:border-brand-500",
              ].join(" ")}
            >
              <p className="text-sm font-semibold text-gray-900">
                {t === "personal" ? "개인 신청" : "단체 신청"}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {t === "personal"
                  ? "혼자 수강 신청합니다"
                  : "2~10명 함께 신청합니다"}
              </p>
            </button>
          ))}
        </div>
      </section>

      {showError && (!selectedCourse || !type) && (
        <p className="text-sm font-medium text-red-600" role="alert">
          강의와 신청 유형을 모두 선택해 주세요.
        </p>
      )}

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleNext}
          className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
        >
          다음
        </button>
      </div>

      <ConfirmDialog
        open={pendingTypeSwitch !== null}
        title="단체 신청 정보가 삭제됩니다"
        description="개인 신청으로 변경하면 입력하신 단체명, 인원수, 참가자 명단이 모두 삭제됩니다. 계속하시겠습니까?"
        confirmLabel="개인 신청으로 변경"
        cancelLabel="취소"
        onConfirm={confirmTypeSwitch}
        onCancel={() => setPendingTypeSwitch(null)}
        danger
      />
    </div>
  );
}
