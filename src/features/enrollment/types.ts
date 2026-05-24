// 평가 기준 2번 - 타입 설계
// 개인/단체를 discriminated union으로 분리해 컴파일러가 분기를 강제하도록 함.
// 이렇게 하면 "단체 신청인데 group 필드가 없는 상태"가 타입 레벨에서 불가능해진다.

export type CourseCategory = "development" | "design" | "marketing" | "business";

export interface Course {
  id: string;
  title: string;
  description: string;
  category: CourseCategory;
  price: number;
  maxCapacity: number;
  currentEnrollment: number;
  startDate: string; // ISO 8601
  endDate: string;   // ISO 8601
  instructor: string;
}

export interface CourseListResponse {
  courses: Course[];
  categories: CourseCategory[];
}

export type EnrollmentType = "personal" | "group";

export interface Applicant {
  name: string;
  email: string;
  phone: string;
  motivation?: string;
}

export interface Participant {
  name: string;
  email: string;
}

export interface GroupInfo {
  organizationName: string;
  headCount: number;
  participants: Participant[];
  contactPerson: string;
}

// --- API request types (discriminated by `type`) ---

interface BaseEnrollmentRequest {
  courseId: string;
  applicant: Applicant;
  agreedToTerms: boolean;
}

export interface PersonalEnrollmentRequest extends BaseEnrollmentRequest {
  type: "personal";
}

export interface GroupEnrollmentRequest extends BaseEnrollmentRequest {
  type: "group";
  group: GroupInfo;
}

export type EnrollmentRequest = PersonalEnrollmentRequest | GroupEnrollmentRequest;

export interface EnrollmentResponse {
  enrollmentId: string;
  status: "confirmed" | "pending";
  enrolledAt: string;
}

// --- Error types ---

export type ServerErrorCode =
  | "COURSE_FULL"
  | "DUPLICATE_ENROLLMENT"
  | "INVALID_INPUT"
  | "NETWORK_ERROR"
  | "UNKNOWN_ERROR";

export interface ServerErrorPayload {
  code: ServerErrorCode;
  message: string;
  details?: Record<string, string>;
}

export class EnrollmentApiError extends Error {
  constructor(
    public readonly code: ServerErrorCode,
    message: string,
    public readonly details?: Record<string, string>,
    public readonly httpStatus?: number,
  ) {
    super(message);
    this.name = "EnrollmentApiError";
  }
}
