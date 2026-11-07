// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX
// CSV helpers for partner reports. Server + client safe.

/** Neutralize Excel/Sheets formula injection (leading =,+,-,@,tab,CR). */
export function sanitizeCsvValue(value) {
  if (value === null || value === undefined) return ''
  const text = String(value)
  return /^[=+\-@\t\r]/.test(text) ? `'${text}` : text
}

export function csvEscape(value) {
  const text = sanitizeCsvValue(value)
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`
  return text
}

/**
 * Render rows to CSV. UTF-8 BOM included so Excel opens UTF-8 correctly.
 * @param {string[]} headers
 * @param {Record<string,unknown>[]} rows
 */
export function toCsv(headers, rows) {
  const lines = [headers.map(csvEscape).join(',')]
  for (const row of rows) {
    lines.push(headers.map((h) => csvEscape(row[h])).join(','))
  }
  return '\uFEFF' + lines.join('\n') + '\n'
}
