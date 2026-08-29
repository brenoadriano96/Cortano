import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { criarUsuarioAdmin, desativarUsuarioAdmin, editarNomeUsuarioAdmin } from "./actions";
import { NovoAdminForm } from "./novo-admin-form";
import { BotaoDesativarAdmin } from "./botao-desativar";
import { EditarNomeAdminForm } from "./editar-nome-admin-form";

export default async function AdminUsuariosPage() {
  const session = await auth();

  const admins = await prisma.usuario.findMany({
    where: { tenantId: null, papel: "SUPER_ADMIN", ativo: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Usuários administrativos</h1>
        <span className="text-sm text-neutral-500">{admins.length} administrador(es)</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-neutral-500">
                <th className="p-3 font-medium">Nome</th>
                <th className="p-3 font-medium">E-mail</th>
                <th className="p-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => (
                <tr key={a.id} className="border-b last:border-0">
                  <td className="p-3 font-medium">
                    {a.nome}
                    {a.id === session?.user.id && (
                      <span className="text-xs text-neutral-400 ml-2">(você)</span>
                    )}
                  </td>
                  <td className="p-3 text-neutral-600">{a.email}</td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <EditarNomeAdminForm
                        usuarioId={a.id}
                        nomeAtual={a.nome}
                        editarNomeAction={editarNomeUsuarioAdmin.bind(null, a.id)}
                      />
                      {a.id !== session?.user.id && (
                        <BotaoDesativarAdmin
                          usuarioId={a.id}
                          desativarAction={desativarUsuarioAdmin}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <NovoAdminForm criarUsuarioAdminAction={criarUsuarioAdmin} />
        </div>
      </div>
    </div>
  );
}

