import { requireArea } from "@/server/admin/guard";

/** Only staff with access to this section (and admins) can open it. */
export default async function Layout({ children }: { children: React.ReactNode }) {
  await requireArea("customers");
  return children;
}
