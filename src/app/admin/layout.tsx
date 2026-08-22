import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/admin");
  }
  if (session.user.papel !== "SUPER_ADMIN") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b bg-neutral-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded bg-white text-neutral-900 flex items-center justify-center text-sm font-bold">
            C
          </div>
          <span className="font-semibold">Cortano Admin</span>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button type="submit" className="text-sm text-neutral-400 hover:text-white">
            Sair
          </button>
        </form>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
