import { prisma } from "@/lib/prisma";
import { atualizarConfiguracao } from "./actions";
import { ConfiguracaoForm } from "./configuracao-form";

export default async function AdminConfiguracoesPage() {
  const config = await prisma.configuracaoPlataforma.findUnique({
    where: { id: "singleton" },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Configurações da plataforma</h1>
      <ConfiguracaoForm
        atualizarConfiguracaoAction={atualizarConfiguracao}
        trialDiasAtual={config?.trialDiasPadrao ?? 14}
        suporteEmailAtual={config?.suporteEmail ?? null}
      />
    </div>
  );
}
