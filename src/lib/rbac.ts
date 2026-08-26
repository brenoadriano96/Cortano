import { PapelUsuario } from "@prisma/client";

/**
 * Mapa de permissões por papel — seção 4 do documento de arquitetura.
 * Fonte única de verdade para autorização. Nunca decidir acesso apenas no frontend.
 */
export const PERMISSOES_PADRAO: Record<PapelUsuario, string[]> = {
  SUPER_ADMIN: ["*"], // acesso global, controlado separadamente do tenant (seção 20)
  PROPRIETARIO: [
    "equipe.gerenciar",
    "clientes.gerenciar",
    "servicos.gerenciar",
    "agenda.gerenciar",
    "financeiro.visualizar",
    "planos_cliente.gerenciar",
    "produtos.gerenciar",
    "relatorios.visualizar",
    "barbearia.configurar",
  ],
  GERENTE: [
    // Padrão inicial (seção 4.3) — sobrescrito por Usuario.permissoes se definido
    "agenda.gerenciar",
    "clientes.gerenciar",
    "equipe.visualizar",
    "servicos.gerenciar",
    "financeiro.visualizar",
    "relatorios.visualizar",
  ],
  BARBEIRO: [
    "agenda.visualizar_propria",
    "atendimentos.visualizar",
    "clientes.visualizar_relacionados",
    "atendimento.registrar",
    "servicos.visualizar",
  ],
  ATENDENTE: [
    "agenda.gerenciar",
    "clientes.cadastrar",
    "agendamentos.gerenciar",
    "servicos.visualizar",
  ],
  CLIENTE: [
    "agendamentos.visualizar_proprios",
    "agendamentos.criar",
    "agendamentos.reagendar",
    "agendamentos.cancelar",
    "historico.visualizar",
    "plano.visualizar",
    "pagamentos.visualizar",
    "produtos.comprar",
    "pedidos.acompanhar",
    "perfil.editar",
  ],
};

/**
 * Verifica se um usuário tem uma permissão específica.
 * Super Admin sempre passa. Demais papéis: checa permissões customizadas
 * (Usuario.permissoes) antes de cair no padrão do papel.
 */
export function temPermissao(
  papel: PapelUsuario,
  permissao: string,
  permissoesCustomizadas?: Record<string, boolean> | null
): boolean {
  if (papel === "SUPER_ADMIN") return true;

  if (permissoesCustomizadas && permissao in permissoesCustomizadas) {
    return !!permissoesCustomizadas[permissao];
  }

  return PERMISSOES_PADRAO[papel]?.includes(permissao) ?? false;
}

/**
 * Regra central: um usuário só pode agir dentro do próprio tenant,
 * exceto Super Admin (seção 3 e 20 — isolamento absoluto entre tenants).
 */
export function podeAcessarTenant(
  papel: PapelUsuario,
  usuarioTenantId: string | null,
  tenantIdAlvo: string
): boolean {
  if (papel === "SUPER_ADMIN") return true;
  return usuarioTenantId === tenantIdAlvo;
}

/**
 * Papéis que têm acesso de gestão ampla dentro do tenant (financeiro,
 * configurações, equipe, relatórios). Barbeiro e Atendente têm acesso
 * operacional mais restrito (seções 4.4 e 4.5).
 */
export const PAPEIS_GESTAO: PapelUsuario[] = ["SUPER_ADMIN", "PROPRIETARIO", "GERENTE"];

export function temAcessoGestao(papel: PapelUsuario): boolean {
  return PAPEIS_GESTAO.includes(papel);
}
