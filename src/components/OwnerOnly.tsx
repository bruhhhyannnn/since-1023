import { redirect } from "next/navigation";
import { getOwner } from "@/lib/auth";

/** Renders its children for the owners; sends anyone else home. Use inside <Suspense>. */
export async function OwnerOnly({ children }: { children: React.ReactNode }) {
  if (!(await getOwner())) redirect("/");
  return <>{children}</>;
}
