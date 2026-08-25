"use client";

import { useActionState, useState } from "react";
import type { EstadoForm } from "./actions";

function SeletorEstrelas({ name, valor, onChange }: { name: string; valor: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`text-2xl leading-none ${n <= valor ? "text-amber-400" : "text-neutral-300"}`}
        >
          ★
        </button>
      ))}
      <input type="hidden" name={name} value={valor} />
    </div>
  );
}

export function AvaliacaoForm({
  avaliarAction,
}: {
  avaliarAction: (estado: EstadoForm, formData: FormData) => Promise<EstadoForm>;
}) {
  const [estado, formAction, pendente] = useActionState(avaliarAction, undefined);
  const [notaBarbeiro, setNotaBarbeiro] = useState(5);
  const [notaServico, setNotaServico] = useState(5);
  const [notaExperiencia, setNotaExperiencia] = useState(5);

  if (estado?.sucesso) {
    return (
      <div className="bg-white rounded-lg border p-6 text-center">
        <p className="font-medium mb-1">Obrigado pela avaliação!</p>
        <p className="text-sm text-neutral-500">Isso ajuda a barbearia a melhorar.</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="bg-white rounded-lg border p-4 space-y-4 max-w-md">
      <div>
        <label className="block text-xs text-neutral-500 mb-1">Barbeiro</label>
        <SeletorEstrelas name="notaBarbeiro" valor={notaBarbeiro} onChange={setNotaBarbeiro} />
      </div>
      <div>
        <label className="block text-xs text-neutral-500 mb-1">Serviço</label>
        <SeletorEstrelas name="notaServico" valor={notaServico} onChange={setNotaServico} />
      </div>
      <div>
        <label className="block text-xs text-neutral-500 mb-1">Experiência geral</label>
        <SeletorEstrelas
          name="notaExperiencia"
          valor={notaExperiencia}
          onChange={setNotaExperiencia}
        />
      </div>
      <div>
        <label className="block text-xs text-neutral-500 mb-1" htmlFor="comentario">
          Comentário (opcional)
        </label>
        <textarea
          id="comentario"
          name="comentario"
          rows={3}
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      {estado?.erro && <p className="text-red-500 text-xs">{estado.erro}</p>}

      <button
        type="submit"
        disabled={pendente}
        className="w-full bg-neutral-900 text-white rounded-md py-2 text-sm font-medium disabled:opacity-60"
      >
        {pendente ? "Enviando..." : "Enviar avaliação"}
      </button>
    </form>
  );
}
