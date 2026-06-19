import { redirect } from "next/navigation";

/** Default workspace: Provider applications listing. Sidebar lives in `./layout.tsx`. */
export default function AdminIndexPage() {
  redirect("/admin/provider-applications");
}
