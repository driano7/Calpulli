// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX
// GET /api/partners/dashboard/analytics?preset=30d&partnerId=...
// Alias de overview (misma agregación; UI usa overview).
import handler from './overview'

export const config = { runtime: 'nodejs' }

export default handler
