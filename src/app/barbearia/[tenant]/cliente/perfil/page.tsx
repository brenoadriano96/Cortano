import { getTenantBySlug } from "@/lib/tenant";
import { getClienteAtual } from "@/lib/cliente-atual";
import { atualizarPerfilCliente } from "./actions";
import { PerfilForm } from "./perfil-form";

export default async function ClientePerfilPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: slug } = await params;
  const tenant = await getTenantBySlug(slug);
  const cliente = await getClienteAtual(tenant.id);

  const atualizarPerfilComContexto = atualizarPerfilCliente.bind(
    null,
    tenant.id,
    slug,
    cliente.id
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Meu perfil</h1>
      <PerfilForm
        atualizarPerfilAction={atualizarPerfilComContexto}
        nomeAtual={cliente.nome}
        telefoneAtual={cliente.telefone}
        emailAtual={cliente.email}
      />
    </div>
  );
}
