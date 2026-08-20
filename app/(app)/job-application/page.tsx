import AdminGuard from "@/components/shell/AdminGuard";
import JobApplicationPage from "@/components/jobs/JobApplicationPage";

export default function Page() {
  return (
    <AdminGuard>
      <JobApplicationPage />
    </AdminGuard>
  );
}
