import { describe, it, expect } from "vitest";
import {
  applicantSchema,
  groupSchema,
  step1Schema,
  step2Schema,
  fullEnrollmentSchema,
} from "./schemas";

describe("applicantSchema", () => {
  const validApplicant = {
    name: "홍길동",
    email: "test@example.com",
    phone: "010-1234-5678",
    motivation: "",
  };

  it("올바른 입력은 통과한다", () => {
    expect(applicantSchema.safeParse(validApplicant).success).toBe(true);
  });

  it("이름이 2자 미만이면 실패한다", () => {
    const result = applicantSchema.safeParse({ ...validApplicant, name: "김" });
    expect(result.success).toBe(false);
  });

  it("이름이 20자를 초과하면 실패한다", () => {
    const result = applicantSchema.safeParse({
      ...validApplicant,
      name: "가".repeat(21),
    });
    expect(result.success).toBe(false);
  });

  it("이메일 형식이 잘못되면 실패한다", () => {
    const result = applicantSchema.safeParse({
      ...validApplicant,
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("한국 전화번호 형식을 허용한다", () => {
    const validPhones = [
      "010-1234-5678",
      "01012345678",
      "010 1234 5678",
      "+82-10-1234-5678",
    ];
    validPhones.forEach((phone) => {
      const result = applicantSchema.safeParse({ ...validApplicant, phone });
      expect(result.success, `${phone} 는 유효해야 함`).toBe(true);
    });
  });

  it("외국 전화번호 형식은 거부한다", () => {
    const result = applicantSchema.safeParse({
      ...validApplicant,
      phone: "+1-555-1234",
    });
    expect(result.success).toBe(false);
  });

  it("수강 동기는 선택 필드이고 300자 이하여야 한다", () => {
    expect(
      applicantSchema.safeParse({ ...validApplicant, motivation: "" }).success,
    ).toBe(true);
    expect(
      applicantSchema.safeParse({
        ...validApplicant,
        motivation: "가".repeat(300),
      }).success,
    ).toBe(true);
    expect(
      applicantSchema.safeParse({
        ...validApplicant,
        motivation: "가".repeat(301),
      }).success,
    ).toBe(false);
  });
});

describe("groupSchema", () => {
  const validGroup = {
    organizationName: "테스트 회사",
    headCount: 3,
    participants: [
      { name: "참가자1", email: "p1@example.com" },
      { name: "참가자2", email: "p2@example.com" },
      { name: "참가자3", email: "p3@example.com" },
    ],
    contactPerson: "010-1111-2222",
  };

  it("올바른 단체 정보는 통과한다", () => {
    expect(groupSchema.safeParse(validGroup).success).toBe(true);
  });

  it("인원수가 2 미만이면 실패한다", () => {
    const result = groupSchema.safeParse({ ...validGroup, headCount: 1 });
    expect(result.success).toBe(false);
  });

  it("인원수가 10을 초과하면 실패한다", () => {
    const result = groupSchema.safeParse({ ...validGroup, headCount: 11 });
    expect(result.success).toBe(false);
  });

  it("인원수와 참가자 수가 일치하지 않으면 실패한다", () => {
    const result = groupSchema.safeParse({
      ...validGroup,
      headCount: 5,
      participants: validGroup.participants, // 3명만 있음
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const headCountError = result.error.issues.find((i) =>
        i.path.includes("headCount"),
      );
      expect(headCountError).toBeDefined();
    }
  });

  it("참가자 이메일이 중복되면 두 번째 참가자 칸에 에러가 발생한다", () => {
    const result = groupSchema.safeParse({
      ...validGroup,
      participants: [
        { name: "참가자1", email: "same@example.com" },
        { name: "참가자2", email: "same@example.com" },
        { name: "참가자3", email: "p3@example.com" },
      ],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const duplicateError = result.error.issues.find(
        (i) =>
          i.path[0] === "participants" &&
          i.path[1] === 1 &&
          i.path[2] === "email",
      );
      expect(duplicateError).toBeDefined();
    }
  });

  it("이메일 대소문자가 달라도 중복으로 처리한다", () => {
    const result = groupSchema.safeParse({
      ...validGroup,
      participants: [
        { name: "참가자1", email: "Same@Example.com" },
        { name: "참가자2", email: "same@example.com" },
        { name: "참가자3", email: "p3@example.com" },
      ],
    });
    expect(result.success).toBe(false);
  });
});

describe("step1Schema", () => {
  it("courseId와 type이 모두 있으면 통과한다", () => {
    expect(
      step1Schema.safeParse({ courseId: "c-1", type: "personal" }).success,
    ).toBe(true);
  });

  it("courseId가 비어있으면 실패한다", () => {
    expect(
      step1Schema.safeParse({ courseId: "", type: "personal" }).success,
    ).toBe(false);
  });

  it("type이 personal 또는 group이 아니면 실패한다", () => {
    expect(
      step1Schema.safeParse({ courseId: "c-1", type: "invalid" }).success,
    ).toBe(false);
  });
});

describe("step2Schema (discriminated union)", () => {
  const validApplicant = {
    name: "홍길동",
    email: "test@example.com",
    phone: "010-1234-5678",
  };

  it("개인 신청은 applicant만 있으면 된다", () => {
    const result = step2Schema.safeParse({
      type: "personal",
      applicant: validApplicant,
    });
    expect(result.success).toBe(true);
  });

  it("단체 신청은 group 정보가 필수다", () => {
    const result = step2Schema.safeParse({
      type: "group",
      applicant: validApplicant,
    });
    expect(result.success).toBe(false);
  });

  it("단체 신청에 group 정보가 있으면 통과한다", () => {
    const result = step2Schema.safeParse({
      type: "group",
      applicant: validApplicant,
      group: {
        organizationName: "회사",
        headCount: 2,
        participants: [
          { name: "참가자1", email: "p1@example.com" },
          { name: "참가자2", email: "p2@example.com" },
        ],
        contactPerson: "010-1111-2222",
      },
    });
    expect(result.success).toBe(true);
  });
});

describe("fullEnrollmentSchema", () => {
  it("약관 미동의는 실패한다", () => {
    const result = fullEnrollmentSchema.safeParse({
      courseId: "c-1",
      type: "personal",
      applicant: {
        name: "홍길동",
        email: "test@example.com",
        phone: "010-1234-5678",
      },
      agreedToTerms: false,
    });
    expect(result.success).toBe(false);
  });
});