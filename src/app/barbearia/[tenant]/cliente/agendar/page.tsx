import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenant";
import { getClienteAtual } from "@/lib/cliente-atual";
import { clienteAgendar } from "./actions";
import { AgendarForm } from "./agendar-form";

export default async function ClienteAgendarPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: slug } = await params;
  const tenant = await getTenantBySlug(slug);
  const cliente = await getClienteAtual(tenant.id);

  const [barbeiros, servicos] = await Promise.all([
    prisma.barbeiro.findMany({
      where: { tenantId: tenant.id, ativo: true },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    }),
    prisma.servico.findMany({
      where: { tenantId: tenant.id, ativo: true },
      select: { id: true, nome: true, duracaoMin: true, preco: true },
    }),
  ]);

  const clienteAgendarComContexto = clienteAgendar.bind(null, tenant.id, slug, cliente.id);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Agendar horário</h1>
      <AgendarForm
        clienteAgendarAction={clienteAgendarComContexto}
        barbeiros={barbeiros}
        servicos={servicos.map((s) => ({ ...s, preco: Number(s.preco) }))}
      />
    </div>
  );
}
