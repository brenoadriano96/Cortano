import { acessoBusinessLiberado, getTenantBySlug } from "@/lib/tenant";
import { ReactNode } from "react";
import { redirect } from "next/navigation";

export default async function BarbeariaLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: slug } = await params;
  const tenant = await getTenantBySlug(slug);

  // Seção 11: bloquear acesso administrativo se suspensa/cancelada
  if (!acessoBusinessLiberado(tenant.status)) {
    redirect(`/regularizacao?motivo=${tenant.status.toLowerCase()}`);
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b bg-white px-6 py-4 flex items-center gap-3">
        {tenant.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={tenant.logoUrl} alt={tenant.nome} className="h-8 w-8 rounded" />
        ) : (
          <div className="h-8 w-8 rounded bg-neutral-900 text-white flex items-center justify-center text-sm font-bold">
            {tenant.nome.charAt(0)}
          </div>
        )}
        <span className="font-semibold">{tenant.nome}</span>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
