import { getTenantBySlug } from "@/lib/tenant";
import { getClienteAtual } from "@/lib/cliente-atual";
import { atualizarPerfilCliente, indicarAmigo } from "./actions";
import { PerfilForm } from "./perfil-form";
import { IndicarAmigoForm } from "./indicar-amigo-form";

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
  const indicarAmigoComContexto = indicarAmigo.bind(null, tenant.id, slug, cliente.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Meu perfil</h1>
        {Number(cliente.saldoCashback) > 0 && (
          <p className="text-sm text-green-600">
            Saldo de cashback: R$ {Number(cliente.saldoCashback).toFixed(2)}
          </p>
        )}
      </div>

      <PerfilForm
        atualizarPerfilAction={atualizarPerfilComContexto}
        nomeAtual={cliente.nome}
        telefoneAtual={cliente.telefone}
        emailAtual={cliente.email}
      />

      <IndicarAmigoForm indicarAmigoAction={indicarAmigoComContexto} />
    </div>
  );
}
