import { NextRequest, NextResponse } from "next/server";

// Domínio raiz da plataforma (ajuste para o seu domínio real em produção)
const ROOT_DOMAIN = process.env.ROOT_DOMAIN || "localhost:3000";

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get("host") || "";

  // Remove a porta para comparação (ex: localhost:3000)
  const currentHost = hostname.replace(`.${ROOT_DOMAIN}`, "");

  // Landing page / super admin: acesso direto pelo domínio raiz
  if (hostname === ROOT_DOMAIN || hostname === `www.${ROOT_DOMAIN}`) {
    return NextResponse.next();
  }

  // Caminho /admin sempre vai para o Super Admin, independente de subdomínio
  if (url.pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // Qualquer outro subdomínio é tratado como slug de uma barbearia (tenant)
  const tenantSlug = currentHost;

  // Tela de regularização tem que ficar acessível mesmo com tenant suspenso
  if (url.pathname.startsWith("/regularizacao")) {
    const passthrough = NextResponse.next();
    passthrough.headers.set("x-tenant-slug", tenantSlug);
    return passthrough;
  }

  // NOTA: a checagem completa de status (SUSPENDED/CANCELLED bloqueando
  // acesso administrativo, conforme seção 11) roda no layout do Cortano
  // Business via consulta ao banco (src/lib/tenant.ts), já que o middleware
  // roda no Edge Runtime e não deve depender de round-trip pesado ao DB
  // a cada request. O middleware apenas resolve o tenant e propaga o slug.

  const response = NextResponse.rewrite(
    new URL(`/barbearia/${tenantSlug}${url.pathname}`, req.url)
  );
  response.headers.set("x-tenant-slug", tenantSlug);
  return response;
}

export const config = {
  matcher: [
    /*
     * Roda em todas as rotas exceto:
     * - api (rotas de API tratam tenant via header/session)
     * - arquivos estáticos e _next
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
