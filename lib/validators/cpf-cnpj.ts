import { cpf, cnpj } from "cpf-cnpj-validator";
import { z } from "zod";

/** Remove tudo que não é dígito. */
export function normalizeCpfCnpj(value: string): string {
  return value.replace(/\D/g, "");
}

/** Verifica se é CPF (11 dígitos) ou CNPJ (14 dígitos) com dígitos verificadores válidos. */
export function isValidCpfCnpj(value: string): boolean {
  const digits = normalizeCpfCnpj(value);
  if (digits.length === 11) return cpf.isValid(digits);
  if (digits.length === 14) return cnpj.isValid(digits);
  return false;
}

/** Formata pra exibição: 000.000.000-00 (CPF) ou 00.000.000/0000-00 (CNPJ). */
export function formatCpfCnpj(value: string): string {
  const digits = normalizeCpfCnpj(value);
  if (digits.length === 11) return cpf.format(digits);
  if (digits.length === 14) return cnpj.format(digits);
  return value;
}

/**
 * Zod schema que aceita CPF/CNPJ com ou sem máscara e devolve **só dígitos**.
 * Use isso em todo lugar que persistir CPF/CNPJ no banco — garante normalização.
 */
export const cpfCnpjSchema = z
  .string()
  .min(1, "CPF/CNPJ obrigatório")
  .transform(normalizeCpfCnpj)
  .refine(
    (digits) => digits.length === 11 || digits.length === 14,
    "CPF deve ter 11 dígitos ou CNPJ deve ter 14"
  )
  .refine(
    (digits) =>
      digits.length === 11 ? cpf.isValid(digits) : cnpj.isValid(digits),
    "CPF/CNPJ inválido (dígitos verificadores não conferem)"
  );
