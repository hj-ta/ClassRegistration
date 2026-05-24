import { EnrollmentForm } from "@/features/enrollment/components/EnrollmentForm";

export default function Page() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-8 sm:py-12">
      <header className="mb-8 sm:mb-10">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">수강 신청</h1>
        <p className="mt-1 text-sm text-gray-500">
          3단계로 진행됩니다. 입력하신 내용은 자동으로 임시 저장됩니다.
        </p>
      </header>
      <EnrollmentForm />
    </main>
  );
}
