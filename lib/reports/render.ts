// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
// Render de reportes para correo. El HTML se arma aquí y se pasa a la
// plantilla `partner_report`; el texto plano sirve para clientes sin HTML.

import type { PartnerReport } from './build'

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const cell = 'padding:8px 10px;border-bottom:1px solid #e7e5e4;font-size:13px'
const headCell =
  'padding:8px 10px;border-bottom:1px solid #d6d3d1;font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:#78716c;text-align:left'

export function renderReportHtml(report: PartnerReport): string {
  const metrics = report.metrics
    .map(
      (metric) => `
      <tr>
        <td style="${cell};color:#57534e">
          ${escapeHtml(metric.label)}
          ${
            metric.hint
              ? `<br /><span style="font-size:11px;color:#a8a29e">${escapeHtml(metric.hint)}</span>`
              : ''
          }
        </td>
        <td align="right" style="${cell};font-weight:800;color:#1c1917">${escapeHtml(
        metric.value
      )}</td>
      </tr>`
    )
    .join('')

  const tables = report.tables
    .map((table) => {
      const header = table.headers
        .map((value) => `<th style="${headCell}">${escapeHtml(value)}</th>`)
        .join('')
      const rows = table.rows.length
        ? table.rows
            .map(
              (row) =>
                `<tr>${row
                  .map(
                    (value, index) =>
                      `<td style="${cell}${index === 0 ? ';font-weight:600' : ''}">${escapeHtml(
                        value
                      )}</td>`
                  )
                  .join('')}</tr>`
            )
            .join('')
        : `<tr><td colspan="${table.headers.length}" style="${cell};color:#a8a29e">${escapeHtml(
            table.empty
          )}</td></tr>`

      return `
      <h3 style="margin:24px 0 8px;font-size:15px;color:#1c1917">${escapeHtml(table.title)}</h3>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#fafaf9;border-radius:10px;overflow:hidden">
        <thead><tr>${header}</tr></thead>
        <tbody>${rows}</tbody>
      </table>`
    })
    .join('')

  const notes = report.notes
    .map(
      (note) =>
        `<li style="margin:0 0 6px;color:#78716c;font-size:12px;line-height:1.6">${escapeHtml(
          note
        )}</li>`
    )
    .join('')

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#ffffff;border:1px solid #e7e5e4;border-radius:12px">
      ${metrics}
    </table>
    ${tables}
    <h3 style="margin:24px 0 8px;font-size:15px;color:#1c1917">Notas</h3>
    <ul style="margin:0;padding-left:18px">${notes}</ul>
  `
}

export function renderReportText(report: PartnerReport): string {
  const lines: string[] = []

  lines.push(`Reporte ${report.period.typeLabel} · ${report.period.label}`)
  lines.push('')

  for (const metric of report.metrics) {
    lines.push(`- ${metric.label}: ${metric.value}${metric.hint ? ` (${metric.hint})` : ''}`)
  }

  for (const table of report.tables) {
    lines.push('')
    lines.push(table.title.toUpperCase())
    lines.push(table.headers.join(' | '))
    if (table.rows.length) {
      for (const row of table.rows) lines.push(row.join(' | '))
    } else {
      lines.push(table.empty)
    }
  }

  lines.push('')
  lines.push('Notas:')
  for (const note of report.notes) lines.push(`- ${note}`)

  return lines.join('\n')
}
