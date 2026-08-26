import { getTenantBySlug } from "@/lib/tenant";
import { cadastrarCliente } from "./actions";
import { CadastroClienteForm } from "./cadastro-cliente-form";

export default async function CadastroClientePage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: slug } = await params;
  const tenant = await getTenantBySlug(slug);

  const cadastrarClienteComContexto = cadastrarCliente.bind(null, tenant.id, slug);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          {tenant.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tenant.logoUrl}
              alt={tenant.nome}
              className="h-12 w-12 rounded-xl mx-auto mb-3"
            />
          ) : (
            <div
              className="h-12 w-12 rounded-xl text-white flex items-center justify-center text-lg font-bold mx-auto mb-3"
              style={{ backgroundColor: tenant.corPrimaria ?? "#171717" }}
            >
              {tenant.nome.charAt(0)}
            </div>
          )}
          <h1 className="text-white text-xl font-semibold">Criar conta — {tenant.nome}</h1>
        </div>

        <CadastroClienteForm cadastrarClienteAction={cadastrarClienteComContexto} />

        <p className="text-center text-neutral-500 text-sm mt-4">
          Já tem conta?{" "}
          <a href="/login" className="text-white hover:underline">
            Entrar
          </a>
        </p>
      </div>
    </div>
  );
}
