import { acessoBusinessLiberado, getTenantBySlug } from "@/lib/tenant";
import { auth, signOut } from "@/auth";
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

  // Autenticação + isolamento de tenant (seção 3 e 20): só entra quem
  // pertence a esta barbearia, ou o Super Admin (acesso global controlado).
  const session = await auth();
  if (!session?.user) {
    redirect(`/login?callbackUrl=/barbearia/${slug}/dashboard`);
  }
  if (session.user.papel !== "SUPER_ADMIN" && session.user.tenantId !== tenant.id) {
    redirect("/login");
  }

  return (
    <div
      className="min-h-screen bg-neutral-50"
      style={{ "--cor-primaria": tenant.corPrimaria ?? "#171717" } as React.CSSProperties}
    >
      <header className="border-b bg-white px-6 py-4 flex items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          {tenant.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tenant.logoUrl} alt={tenant.nome} className="h-8 w-8 rounded" />
          ) : (
            <div
              className="h-8 w-8 rounded text-white flex items-center justify-center text-sm font-bold"
              style={{ backgroundColor: "var(--cor-primaria)" }}
            >
              {tenant.nome.charAt(0)}
            </div>
          )}
          <span className="font-semibold">{tenant.nome}</span>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button type="submit" className="text-sm text-neutral-500 hover:text-neutral-900">
            Sair
          </button>
        </form>
      </header>
      <nav className="border-b bg-white px-6 flex gap-1 overflow-x-auto text-sm">
        {(session.user.papel === "CLIENTE"
          ? [
              { href: "cliente/inicio", label: "Início" },
              { href: "cliente/agendar", label: "Agendar" },
              { href: "cliente/agendamentos", label: "Agendamentos" },
              { href: "cliente/meu-plano", label: "Meu Plano" },
              { href: "cliente/loja", label: "Loja" },
              { href: "cliente/pedidos", label: "Pedidos" },
              { href: "cliente/perfil", label: "Perfil" },
            ]
          : [
              { href: "dashboard", label: "Início" },
              { href: "agenda", label: "Agenda" },
              { href: "clientes", label: "Clientes" },
              { href: "barbeiros", label: "Equipe" },
              { href: "servicos", label: "Serviços" },
              { href: "assinaturas", label: "Assinaturas" },
              { href: "loja", label: "Loja" },
              { href: "financeiro", label: "Financeiro" },
              { href: "relatorios", label: "Relatórios" },
              { href: "configuracoes", label: "Configurações" },
            ]
        ).map((item) => (
          <a
            key={item.href}
            href={`/barbearia/${slug}/${item.href}`}
            className="px-3 py-3 text-neutral-600 hover:text-neutral-900 whitespace-nowrap"
          >
            {item.label}
          </a>
        ))}
      </nav>
      <main className="p-6">{children}</main>
    </div>
  );
}
