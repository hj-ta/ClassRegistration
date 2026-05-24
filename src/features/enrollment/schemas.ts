import { z } from "zod";

// 폼 상태 관리 (통합 + 스텝별 스키마 분리)
const KOREAN_PHONE_REGEX = /^(\+?82[-\s]?|0)1[016789][-\s]?\d{3,4}[-\s]?\d{4}$/;

export const participantSchema = z.object({
  name: z
    .string()
    .min(2, "이름은 2자 이상 입력해 주세요")
    .max(20, "이름은 20자 이하로 입력해 주세요"),
  email: z.string().email("이메일 형식이 올바르지 않습니다"),
});

export const applicantSchema = z.object({
  name: z
    .string()
    .min(2, "이름은 2자 이상 입력해 주세요")
    .max(20, "이름은 20자 이하로 입력해 주세요"),
  email: z.string().email("이메일 형식이 올바르지 않습니다"),
  phone: z
    .string()
    .regex(KOREAN_PHONE_REGEX, "한국 전화번호 형식이 올바르지 않습니다 (예: 010-1234-5678)"),
  motivation: z
    .string()
    .max(300, "수강 동기는 300자 이하로 입력해 주세요")
    .optional()
    .or(z.literal("")),
});

export const groupSchema = z
  .object({
    organizationName: z.string().min(1, "단체명을 입력해 주세요"),
    headCount: z
      .number({ invalid_type_error: "인원수를 입력해 주세요" })
      .int("정수로 입력해 주세요")
      .min(2, "단체 신청은 최소 2명부터 가능합니다")
      .max(10, "단체 신청은 최대 10명까지 가능합니다"),
    participants: z.array(participantSchema),
    contactPerson: z
      .string()
      .regex(KOREAN_PHONE_REGEX, "한국 전화번호 형식이 올바르지 않습니다"),
  })
  .superRefine((val, ctx) => {
    // 1) 인원수와 참가자 명단 길이 일치
    if (val.participants.length !== val.headCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["headCount"],
        message: `인원수(${val.headCount})와 참가자 명단 수(${val.participants.length})가 일치하지 않습니다`,
      });
    }
    // 2) 참가자 이메일 중복 검사 
    const seen = new Map<string, number>();
    val.participants.forEach((p, idx) => {
      const key = p.email.trim().toLowerCase();
      if (!key) return;
      if (seen.has(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["participants", idx, "email"],
          message: `이미 ${(seen.get(key) ?? 0) + 1}번 참가자에 입력된 이메일입니다`,
        });
      } else {
        seen.set(key, idx);
      }
    });
  });

// --- Step schemas ---

export const step1Schema = z.object({
  courseId: z.string().min(1, "강의를 선택해 주세요"),
  type: z.enum(["personal", "group"], {
    errorMap: () => ({ message: "신청 유형을 선택해 주세요" }),
  }),
});

// step2는 type에 따라 갈리므로 discriminated union으로 정의
export const step2PersonalSchema = z.object({
  type: z.literal("personal"),
  applicant: applicantSchema,
});

export const step2GroupSchema = z.object({
  type: z.literal("group"),
  applicant: applicantSchema,
  group: groupSchema,
});

export const step2Schema = z.discriminatedUnion("type", [
  step2PersonalSchema,
  step2GroupSchema,
]);

export const step3Schema = z.object({
  agreedToTerms: z.literal(true, {
    errorMap: () => ({ message: "이용약관에 동의해 주세요" }),
  }),
});

// 전체 폼 스키마 (최종 검증용)
export const fullEnrollmentSchema = z.discriminatedUnion("type", [
  z.object({
    courseId: z.string().min(1),
    type: z.literal("personal"),
    applicant: applicantSchema,
    agreedToTerms: z.literal(true),
  }),
  z.object({
    courseId: z.string().min(1),
    type: z.literal("group"),
    applicant: applicantSchema,
    group: groupSchema,
    agreedToTerms: z.literal(true),
  }),
]);

export type Step1Values = z.infer<typeof step1Schema>;
export type Step2Values = z.infer<typeof step2Schema>;
export type Step3Values = z.infer<typeof step3Schema>;
export type FullEnrollmentValues = z.infer<typeof fullEnrollmentSchema>;
