// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
// Referencia legible de reserva (el folio). Función pura, sin base de
// datos: vive separada de lib/booking/turso.ts para poder probarla en
// tests sin levantar un cliente de Turso.
import { randomBytes } from 'crypto'

/** Alfabeto sin caracteres ambiguos: O/0, I/1, S/5. */
const ALPHABET = 'ABCDEFGHJKLMNPQRTUVWXYZ23456789'

/** Referencia legible y corta: CDMX-7K3QF9 */
export function generateBookingReference(): string {
  const bytes = randomBytes(6)
  let out = ''
  for (let i = 0; i < 6; i++) out += ALPHABET[bytes[i] % ALPHABET.length]
  return `CDMX-${out}`
}
