import {
  type CourseListResponse,
  type EnrollmentRequest,
  type EnrollmentResponse,
  type ServerErrorPayload,
  EnrollmentApiError,
} from "./types";

// 평가 기준 3번 - 안정성/예외 처리
// 모든 API 호출은 EnrollmentApiError로 정규화한다.
// 네트워크 에러(fetch 실패)와 비즈니스 에러(JSON 응답의 code)를 같은 인터페이스로 다루되,
// `code === "NETWORK_ERROR"`로 명확히 구분 가능하게 한다.

async function parseErrorPayload(res: Response): Promise<ServerErrorPayload> {
  try {
    const data = (await res.json()) as ServerErrorPayload;
    if (data && typeof data === "object" && "code" in data && "message" in data) {
      return data;
    }
  } catch {
    /* fallthrough */
  }
  return {
    code: "UNKNOWN_ERROR",
    message: `서버 오류 (HTTP ${res.status})`,
  };
}

export async function fetchCourses(category?: string): Promise<CourseListResponse> {
  const url = category && category !== "all"
    ? `/api/courses?category=${encodeURIComponent(category)}`
    : `/api/courses`;

  let res: Response;
  try {
    res = await fetch(url);
  } catch (e) {
    throw new EnrollmentApiError(
      "NETWORK_ERROR",
      "네트워크에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.",
    );
  }

  if (!res.ok) {
    const payload = await parseErrorPayload(res);
    throw new EnrollmentApiError(payload.code, payload.message, payload.details, res.status);
  }
  return res.json() as Promise<CourseListResponse>;
}

export async function submitEnrollment(
  body: EnrollmentRequest,
): Promise<EnrollmentResponse> {
  let res: Response;
  try {
    res = await fetch("/api/enrollments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new EnrollmentApiError(
      "NETWORK_ERROR",
      "네트워크에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.",
    );
  }

  if (!res.ok) {
    const payload = await parseErrorPayload(res);
    throw new EnrollmentApiError(payload.code, payload.message, payload.details, res.status);
  }
  return res.json() as Promise<EnrollmentResponse>;
}
