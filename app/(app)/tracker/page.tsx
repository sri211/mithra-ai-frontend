import AdminGuard from "@/components/shell/AdminGuard";
import TrackerPage from "@/components/tracker/TrackerPage";

export default function Page() {
  return (
    <AdminGuard>
      <TrackerPage />
    </AdminGuard>
  );
}
