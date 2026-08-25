import type { MetadataRoute } from "next";

/**
 * Next.js gera /manifest.webmanifest automaticamente a partir deste arquivo
 * (suporte nativo do App Router — não precisa de next-pwa ou config extra).
 *
 * Nota: como o Cortano é multi-tenant num único domínio, este é um manifest
 * genérico da plataforma. Personalização por barbearia (nome/ícone do PWA)
 * exigiria manifests dinâmicos por subdomínio — fica como evolução futura
 * quando o multi-tenant por domínio próprio for implementado.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cortano — Plataforma para Barbearias",
    short_name: "Cortano",
    description: "Agenda, assinaturas, loja e financeiro para barbearias.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
