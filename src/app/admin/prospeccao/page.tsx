import { prisma } from "@/lib/prisma";
import { criarProspecto, atualizarStatusProspecto } from "./actions";
import { NovoProspectoForm } from "./novo-prospecto-form";
import { SeletorStatusProspecto } from "./seletor-status";

const STATUS_COR: Record<string, string> = {
  NOVO: "bg-blue-100 text-blue-700",
  CONTATADO: "bg-amber-100 text-amber-700",
  VISITA_AGENDADA: "bg-purple-100 text-purple-700",
  EM_NEGOCIACAO: "bg-orange-100 text-orange-700",
  GANHO: "bg-green-100 text-green-700",
  PERDIDO: "bg-neutral-200 text-neutral-500",
};

export default async function AdminProspeccaoPage() {
  const prospectos = await prisma.prospectoBarbearia.findMany({
    orderBy: { createdAt: "desc" },
  });

  const mrrPotencial = prospectos
    .filter((p) => p.status !== "GANHO" && p.status !== "PERDIDO")
    .reduce((acc, p) => acc + Number(p.valorEstimado ?? 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Prospecção de clientes</h1>
        <span className="text-sm text-neutral-500">
          MRR potencial em aberto: R$ {mrrPotencial.toFixed(2)}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-neutral-500">
                <th className="p-3 font-medium">Barbearia</th>
                <th className="p-3 font-medium">Contato</th>
                <th className="p-3 font-medium">Origem</th>
                <th className="p-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {prospectos.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="p-3">
                    <p className="font-medium">{p.nome}</p>
                    {p.valorEstimado && (
                      <p className="text-xs text-neutral-400">
                        R$ {Number(p.valorEstimado).toFixed(2)}/mês estimado
                      </p>
                    )}
                  </td>
                  <td className="p-3 text-neutral-600">
                    {p.contatoNome && <p>{p.contatoNome}</p>}
                    <p className="text-xs text-neutral-400">
                      {[p.telefone, p.email].filter(Boolean).join(" · ")}
                    </p>
                  </td>
                  <td className="p-3 text-neutral-600">{p.origem ?? "—"}</td>
                  <td className="p-3">
                    <span
                      className={`inline-block mb-1 text-xs px-2 py-0.5 rounded-full ${
                        STATUS_COR[p.status]
                      }`}
                    >
                      {p.status}
                    </span>
                    <SeletorStatusProspecto
                      prospectoId={p.id}
                      statusAtual={p.status}
                      atualizarStatusAction={atualizarStatusProspecto}
                    />
                  </td>
                </tr>
              ))}
              {prospectos.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-neutral-400">
                    Nenhum prospecto cadastrado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div>
          <NovoProspectoForm criarProspectoAction={criarProspecto} />
        </div>
      </div>
    </div>
  );
}
