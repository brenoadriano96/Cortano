export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-950 text-white px-6 text-center">
      <div className="h-16 w-16 rounded-2xl bg-white text-neutral-950 flex items-center justify-center text-2xl font-bold mb-6">
        C
      </div>
      <h1 className="text-4xl font-bold mb-3">Cortano</h1>
      <p className="text-neutral-400 max-w-md mb-8">
        A plataforma que transforma sua barbearia em um negócio recorrente.
        Agenda, assinaturas, loja e financeiro em um só lugar.
      </p>
      <div className="flex gap-3">
        <a
          href="/admin"
          className="bg-white text-neutral-950 px-5 py-2.5 rounded-md text-sm font-medium"
        >
          Acessar Cortano Admin
        </a>
      </div>
    </div>
  );
}
