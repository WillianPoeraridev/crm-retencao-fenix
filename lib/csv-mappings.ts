// Mapeamento entre o formato da planilha do gerente e o sistema.
// A planilha tem inconsistências de digitação — esses mapas tratam tudo.

// ═══════════════════════════════════════════════════
// STATUS
// ═══════════════════════════════════════════════════
export const STATUS_CSV_TO_SYSTEM: Record<string, string> = {
  CANCELADO: "CANCELADO",
  RETIDO: "RETIDO",
  INADIMPLENCIA: "INADIMPLENCIA",
  INADIMPLÊNCIA: "INADIMPLENCIA",
};

export const STATUS_SYSTEM_TO_CSV: Record<string, string> = {
  CANCELADO: "CANCELADO",
  RETIDO: "RETIDO",
  INADIMPLENCIA: "INADIMPLENCIA",
};

// ═══════════════════════════════════════════════════
// MOTIVO
// ═══════════════════════════════════════════════════
export const MOTIVO_CSV_TO_SYSTEM: Record<string, string> = {
  "INSATISFAÇÃO C/ ATD": "INSATISFACAO_ATD",
  "INSATISFACAO C/ ATD": "INSATISFACAO_ATD",
  "INSATISFAÇÃO C/ SERVIÇO": "INSATISFACAO_SERVICO",
  "INSATISFACAO C/ SERVICO": "INSATISFACAO_SERVICO",
  "MUDANÇA DE ENDEREÇO": "MUDANCA_ENDERECO",
  "MUDANCA DE ENDERECO": "MUDANCA_ENDERECO",
  "MOTIVOS PESSOAIS": "MOTIVOS_PESSOAIS",
  "TROCA DE PROVEDOR": "TROCA_PROVEDOR",
  "PROBLEMAS FINANC": "PROBLEMAS_FINANC",
  "PROBLEMAS FINANCEIROS": "PROBLEMAS_FINANC",
  OUTROS: "OUTROS",
  "90 + INADIMPLÊNCIA": "INADIMPLENCIA_90",
  "90 + INADIMPLENCIA": "INADIMPLENCIA_90",
};

export const MOTIVO_SYSTEM_TO_CSV: Record<string, string> = {
  INSATISFACAO_ATD: "INSATISFAÇÃO C/ ATD",
  INSATISFACAO_SERVICO: "INSATISFAÇÃO C/ SERVIÇO",
  MUDANCA_ENDERECO: "MUDANÇA DE ENDEREÇO",
  MOTIVOS_PESSOAIS: "MOTIVOS PESSOAIS",
  TROCA_PROVEDOR: "TROCA DE PROVEDOR",
  PROBLEMAS_FINANC: "PROBLEMAS FINANC",
  OUTROS: "OUTROS",
  INADIMPLENCIA_90: "90 + INADIMPLÊNCIA",
};

// ═══════════════════════════════════════════════════
// REGIÃO
// ═══════════════════════════════════════════════════
export const REGIAO_CSV_TO_SYSTEM: Record<string, string> = {
  sinos: "SINOS",
  litoral: "LITORAL",
  litotal: "LITORAL", // typo frequente
  matriz: "MATRIZ",
};

export const REGIAO_SYSTEM_TO_CSV: Record<string, string> = {
  SINOS: "Sinos",
  LITORAL: "Litoral",
  MATRIZ: "Matriz",
};

// ═══════════════════════════════════════════════════
// CIDADE — normaliza variantes para o ID do sistema
// ═══════════════════════════════════════════════════
// A planilha tem: "Cachoeirinha", "Cacchoeirinha", "Cachoeirina",
// "Cachoeriinha", "Cachooeirinha", "cachoeirinha", "Cachoeirinha - RS"
// Todas mapeiam para "CACHOEIRINHA".
export const CIDADE_CSV_TO_SYSTEM: Record<string, string> = {
  // Cachoeirinha e variantes
  cachoeirinha: "CACHOEIRINHA",
  "cachoeirinha - rs": "CACHOEIRINHA",
  cacchoeirinha: "CACHOEIRINHA",
  cachoeirina: "CACHOEIRINHA",
  cachoeriinha: "CACHOEIRINHA",
  cachooeirinha: "CACHOEIRINHA",

  // Gravataí
  gravatai: "GRAVATAI",
  gravataí: "GRAVATAI",
  "gravataí - rs": "GRAVATAI",
  "gravatai - rs": "GRAVATAI",

  // Tramandaí
  tramandai: "TRAMANDAI",
  tramandaí: "TRAMANDAI",
  "tramandaí - rs": "TRAMANDAI",
  "tramandai - rs": "TRAMANDAI",

  // Imbé
  imbé: "IMBE",
  imbe: "IMBE",
  "imbé - rs": "IMBE",

  // Cidreira
  cidreira: "CIDREIRA",

  // Osório
  osório: "OSORIO",
  osorio: "OSORIO",

  // São Leopoldo
  "são leopoldo": "SAO_LEOPOLDO",
  "sao leopoldo": "SAO_LEOPOLDO",

  // Novo Hamburgo e variantes
  "novo hamburgo": "NOVO_HAMBURGO",
  "novo hambuirgo": "NOVO_HAMBURGO",
  "novo hamurgo": "NOVO_HAMBURGO",
  "novo hamburgo - rs": "NOVO_HAMBURGO",

  // Ivoti
  ivoti: "IVOTI",
  "ivoti - rs": "IVOTI",

  // Taquara
  taquara: "TAQUARA",
  "taquara - rs": "TAQUARA",

  // Igrejinha
  igrejinha: "IGREJINHA",
  "igrejinha - rs": "IGREJINHA",
  igrejnha: "IGREJINHA",

  // Parobé
  parobé: "PAROBE",
  parobe: "PAROBE",
  "parobé - rs": "PAROBE",
  parpobé: "PAROBE",

  // Estância Velha
  "estância velha": "ESTANCIA_VELHA",
  "estancia velha": "ESTANCIA_VELHA",
  "estância velha - rs": "ESTANCIA_VELHA",
  "estancia velha.": "ESTANCIA_VELHA",
  estancia: "ESTANCIA_VELHA",

  // Dois Irmãos
  "dois irmãos": "DOIS_IRMAOS",
  "dois irmaos": "DOIS_IRMAOS",
  "dois irmãos - rs": "DOIS_IRMAOS",

  // Campo Bom
  "campo bom": "CAMPO_BOM",

  // Sapucaia
  "sapucaia do sul": "SAPUCAIA",
  sapucaia: "SAPUCAIA",

  // Esteio
  esteio: "ESTEIO",

  // Canoas
  canoas: "CANOAS",
  "canoas - rs": "CANOAS",

  // Porto Alegre
  "porto alegre": "PORTO_ALEGRE",

  // Viamão
  viamão: "VIAMAO",
  viamao: "VIAMAO",

  // Alvorada
  alvorada: "ALVORADA",

  // Cidades que aparecem na planilha mas não estavam no enum original
  sapiranga: "SAPIRANGA",
  "nova hartz": "NOVA_HARTZ",
  "araricá - rs": "ARARICA",
  araricá: "ARARICA",
  indianópolis: "INDIANOPOLIS",
};

// Mapa inverso — usado na exportação
// Chave: ID do sistema → Valor: nome legível pra planilha
export function cidadeIdParaNome(id: string, nome: string): string {
  // Usa o nome cadastrado na tabela Cidade
  return nome;
}

// ═══════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════

export function normalizarCidade(textoOriginal: string): string | null {
  const limpo = textoOriginal.trim().toLowerCase().replace(/\s+/g, " ");
  if (!limpo) return null;
  return CIDADE_CSV_TO_SYSTEM[limpo] ?? null;
}

export function normalizarRegiao(textoOriginal: string): string | null {
  const limpo = textoOriginal.trim().toLowerCase();
  if (!limpo) return null;
  return REGIAO_CSV_TO_SYSTEM[limpo] ?? null;
}

export function normalizarMotivo(textoOriginal: string): string | null {
  const limpo = textoOriginal.trim().toUpperCase();
  if (!limpo) return null;
  // Tenta match exato primeiro
  for (const [csv, system] of Object.entries(MOTIVO_CSV_TO_SYSTEM)) {
    if (csv.toUpperCase() === limpo) return system;
  }
  return null;
}

export function normalizarStatus(textoOriginal: string): string | null {
  const limpo = textoOriginal.trim().toUpperCase();
  return STATUS_CSV_TO_SYSTEM[limpo] ?? null;
}

// Parseia data no formato dd/mm ou dd/mm/yyyy
export function parsearDataCSV(texto: string, anoBase: number): Date | null {
  const limpo = texto.trim();
  if (!limpo) return null;

  // dd/mm/yyyy
  const match4 = limpo.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match4) {
    const d = new Date(parseInt(match4[3]), parseInt(match4[2]) - 1, parseInt(match4[1]));
    if (!isNaN(d.getTime())) return d;
  }

  // dd/mm (assume anoBase)
  const match2 = limpo.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (match2) {
    const d = new Date(anoBase, parseInt(match2[2]) - 1, parseInt(match2[1]));
    if (!isNaN(d.getTime())) return d;
  }

  return null;
}

// Verifica se é texto de "sem retirada" ou similar
export function ehTextoRetirada(texto: string): boolean {
  const lower = texto.trim().toLowerCase();
  return (
    lower.includes("sem retirada") ||
    lower.includes("não atendeu") ||
    lower.includes("entregou") ||
    lower.includes("loja") ||
    lower.includes("matriz") ||
    lower.includes("nao atendeu")
  );
}

// Meses em português — usado no cabeçalho do CSV
export const MESES_PT = [
  "JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO",
  "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO",
];