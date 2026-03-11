// Fonte única de verdade para labels e cores exibidas na UI e nos exports.
// Qualquer novo status, motivo ou região deve ser adicionado AQUI.

export const STATUS_LABEL: Record<string, string> = {
  CANCELADO:     "Cancelado",
  RETIDO:        "Retido",
  INADIMPLENCIA: "Inadimplência",
};

export const STATUS_COR: Record<string, string> = {
  CANCELADO:     "#b91c1c",
  RETIDO:        "#15803d",
  INADIMPLENCIA: "#b45309",
};

export const MOTIVO_LABEL: Record<string, string> = {
  INSATISFACAO_ATD:     "Insatisfação c/ Atendimento",
  INSATISFACAO_SERVICO: "Insatisfação c/ Serviço",
  MUDANCA_ENDERECO:     "Mudança de Endereço",
  MOTIVOS_PESSOAIS:     "Motivos Pessoais",
  TROCA_PROVEDOR:       "Troca de Provedor",
  PROBLEMAS_FINANC:     "Problemas Financeiros",
  OUTROS:               "Outros",
  INADIMPLENCIA_90:     "90 + Inadimplência",
};

export const REGIAO_LABEL: Record<string, string> = {
  SINOS:   "Sinos",
  LITORAL: "Litoral",
  MATRIZ:  "Matriz",
};