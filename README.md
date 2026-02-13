# CRM Retenção — Fênix Internet (MVP 0.1)

MVP do CRM do **Setor de Cancelamento/Retenção**, substituindo o Google Sheets atual por uma aplicação web com:
- **Login (NextAuth)** e rastreabilidade (quem fez o quê)
- **Competência (mês/ano)** para separar resultados
- **Tabela principal** (CANCELADO / RETIDO / INADIMPLÊNCIA) com listas padronizadas
- **Indicadores** iguais aos do Sheets (retidos, cancelados, churn, ranking, comissão etc.)
- Base pronta para integrar com **n8n/UiPath** futuramente (OPA + IXC)

---

## Stack
- **Next.js (App Router) + TypeScript**
- **Prisma ORM (CLI v7+)**
- **PostgreSQL (Supabase)**
- **NextAuth (Credentials)**
- Deploy: **Vercel (free)**

---

## Pré-requisitos
- Node.js 18+ (recomendado)
- Git
- Conta no Supabase (free tier)

---

## Setup local (do zero)

### 1) Instalar dependências
```bash
npm install
