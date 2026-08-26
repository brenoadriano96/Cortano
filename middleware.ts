import { NextRequest, NextResponse } from "next/server";

// Domínio raiz da plataforma (ajuste para o seu domínio real em produção)
const ROOT_DOMAIN = process.env.ROOT_DOMAIN || "localhost:3000";

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get("host") || "";

  // Remove a porta para comparação (ex: localhost:3000)
  const currentHost = hostname.replace(`.${ROOT_DOMAIN}`, "");

  // Propaga o pathname para os Server Components via header de REQUEST
  // (headers de resposta não chegam ao pipeline de renderização — é preciso
  // usar a API `request.headers` do NextResponse.next() para isso).
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", url.pathname);

  // Landing page / super admin: acesso direto pelo domínio raiz
  // (cobre também o caso de ROOT_DOMAIN não configurado corretamente:
  // se currentHost === hostname, é porque nenhum subdomínio foi removido,
  // ou seja, estamos no domínio raiz mesmo)
  if (
    hostname === ROOT_DOMAIN ||
    hostname === `www.${ROOT_DOMAIN}` ||
    currentHost === hostname
  ) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Caminho /admin sempre vai para o Super Admin, independente de subdomínio
  if (url.pathname.startsWith("/admin")) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Qualquer outro subdomínio é tratado como slug de uma barbearia (tenant)
  const tenantSlug = currentHost;
  requestHeaders.set("x-tenant-slug", tenantSlug);

  // Tela de regularização tem que ficar acessível mesmo com tenant suspenso
  if (url.pathname.startsWith("/regularizacao")) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // NOTA: a checagem completa de status (SUSPENDED/CANCELLED bloqueando
  // acesso administrativo, conforme seção 11) roda no layout do Cortano
  // Business via consulta ao banco (src/lib/tenant.ts), já que o middleware
  // roda no Edge Runtime e não deve depender de round-trip pesado ao DB
  // a cada request. O middleware apenas resolve o tenant e propaga o slug.

  return NextResponse.rewrite(
    new URL(`/barbearia/${tenantSlug}${url.pathname}`, req.url),
    { request: { headers: requestHeaders } }
  );
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
