import { http, HttpResponse, delay } from "msw";
import { MOCK_COURSES, CATEGORIES } from "./data";
import type {
  EnrollmentRequest,
  EnrollmentResponse,
  ServerErrorPayload,
} from "@/features/enrollment/types";

// 데모용 in-memory 신청 기록 (DUPLICATE_ENROLLMENT 테스트용)
const enrollments = new Map<string, { courseId: string; email: string }>();

function err(
  status: number,
  body: ServerErrorPayload,
): ReturnType<typeof HttpResponse.json> {
  return HttpResponse.json(body, { status });
}

export const handlers = [
  // GET /api/courses?category=...
  http.get("/api/courses", async ({ request }) => {
    await delay(400); // 로딩 상태 UI 확인용

    const url = new URL(request.url);
    const category = url.searchParams.get("category");

    const filtered = category
      ? MOCK_COURSES.filter((c) => c.category === category)
      : MOCK_COURSES;

    return HttpResponse.json({
      courses: filtered,
      categories: CATEGORIES,
    });
  }),

  // POST /api/enrollments
  http.post("/api/enrollments", async ({ request }) => {
    await delay(800); // 제출 진행 표시 UI 확인용

    let body: EnrollmentRequest;
    try {
      body = (await request.json()) as EnrollmentRequest;
    } catch {
      return err(400, {
        code: "INVALID_INPUT",
        message: "요청 본문을 해석할 수 없습니다",
      });
    }

    // 1) 강의 존재/정원 확인
    const course = MOCK_COURSES.find((c) => c.id === body.courseId);
    if (!course) {
      return err(404, {
        code: "INVALID_INPUT",
        message: "존재하지 않는 강의입니다",
        details: { courseId: "강의를 다시 선택해 주세요" },
      });
    }
    const wantedSeats = body.type === "group" ? body.group.headCount : 1;
    if (course.currentEnrollment + wantedSeats > course.maxCapacity) {
      return err(409, {
        code: "COURSE_FULL",
        message: "선택한 강의의 정원이 가득 찼습니다",
      });
    }

    // 2) 중복 신청 확인 (같은 강의 + 같은 이메일)
    const key = `${body.courseId}::${body.applicant.email.toLowerCase()}`;
    if (enrollments.has(key)) {
      return err(409, {
        code: "DUPLICATE_ENROLLMENT",
        message: "이미 신청 내역이 있는 강의입니다",
      });
    }

    // 3) 서버 측 형식 검증 (간단한 시뮬레이션)
    if (!body.agreedToTerms) {
      return err(400, {
        code: "INVALID_INPUT",
        message: "이용약관 동의가 필요합니다",
        details: { agreedToTerms: "이용약관에 동의해 주세요" },
      });
    }
    if (body.type === "group") {
      if (body.group.headCount !== body.group.participants.length) {
        return err(400, {
          code: "INVALID_INPUT",
          message: "인원수와 참가자 수가 일치하지 않습니다",
          details: { "group.headCount": "참가자 수를 확인해 주세요" },
        });
      }
    }

    // 4) 데모용: 이메일에 "fail-network"이 들어있으면 네트워크 에러 시뮬레이트 X
    //    (MSW에서 네트워크 에러는 HttpResponse.error()로 시뮬레이션)
    if (body.applicant.email.includes("fail-network")) {
      return HttpResponse.error();
    }

    enrollments.set(key, { courseId: body.courseId, email: body.applicant.email });

    const response: EnrollmentResponse = {
      enrollmentId: `ENR-${Date.now().toString(36).toUpperCase()}`,
      status: "confirmed",
      enrolledAt: new Date().toISOString(),
    };
    return HttpResponse.json(response, { status: 201 });
  }),
];
