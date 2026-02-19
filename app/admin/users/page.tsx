import { permanentRedirect } from "next/navigation"

export default async function AdminUsersPage() {
  permanentRedirect("/admin/settings/users")
}
