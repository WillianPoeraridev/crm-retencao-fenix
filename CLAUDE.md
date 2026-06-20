# CLAUDE.md — crm-retencao-fenix

## ⚠️ CRÍTICO — LER ANTES DE QUALQUER COISA

**O banco é PRODUÇÃO.** Rodar local conecta nos dados REAIS do Supabase
(`qferxnctsvkdymvgvfit`). **Cuidado com testes destrutivos rodando local** —
qualquer `DELETE`, `UPDATE`, `prisma migrate reset`, seed, etc. afeta a operação
de verdade da Fênix. Não há banco de dev separado (ainda).

Antes de qualquer operação que escreva no banco: confirmar com o Willian.

## Contexto

App Next.js 16 (CRM Retenção). Package manager: **pnpm** (não usar npm).
Setup completo da máquina: ver o `SETUP.md` do `Dashboard-fenix`.
