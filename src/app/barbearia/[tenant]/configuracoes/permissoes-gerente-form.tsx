"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { EstadoForm } from "./perfis-actions";

const OPCOES_PERMISSAO = [
  { chave: "agenda.gerenciar", label: "Gerenciar agenda" },
  { chave: "clientes.gerenciar", label: "Gerenciar clientes" },
  { chave: "equipe.visualizar", label: "Visualizar equipe" },
  { chave: "servicos.gerenciar", label: "Gerenciar serviços" },
  { chave: "financeiro.visualizar", label: "Visualizar financeiro" },
  { chave: "relatorios.visualizar", label: "Visualizar relatórios" },
] as const;

export function PermissoesGerenteForm({
  permissoesAtuais,
  atualizarPermissoesAction,
}: {
  permissoesAtuais: Record<string, boolean> | null;
  atualizarPermissoesAction: (
    estado: EstadoForm,
    formData: FormData
  ) => Promise<EstadoForm>;
}) {
  const [aberto, setAberto] = useState(false);
  const [estado, formAction, pendente] = useActionState(atualizarPermissoesAction, undefined);
  const foiSubmetido = useRef(false);

  useEffect(() => {
    if (pendente) {
      foiSubmetido.current = true;
    } else if (foiSubmetido.current && !estado?.erro) {
      setAberto(false);
      foiSubmetido.current = false;
    }
  }, [pendente, estado]);

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="text-xs text-neutral-600 hover:underline"
      >
        Permissões
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <form action={formAction} className="bg-white rounded-lg p-6 space-y-3 w-full max-w-sm">
        <h2 className="font-medium">Permissões do Gerente</h2>
        <p className="text-xs text-neutral-400">
          Controla o que este Gerente pode acessar (seção 4.3).
        </p>

        <div className="space-y-2">
          {OPCOES_PERMISSAO.map((op) => (
            <label key={op.chave} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name={op.chave}
                defaultChecked={permissoesAtuais?.[op.chave] ?? true}
              />
              {op.label}
            </label>
          ))}
        </div>

        {estado?.erro && <p className="text-red-500 text-xs">{estado.erro}</p>}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={pendente}
            className="flex-1 bg-neutral-900 text-white rounded-md py-2 text-sm font-medium disabled:opacity-60"
          >
            {pendente ? "Salvando..." : "Salvar"}
          </button>
          <button
            type="button"
            onClick={() => setAberto(false)}
            className="px-4 py-2 text-sm text-neutral-500"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
