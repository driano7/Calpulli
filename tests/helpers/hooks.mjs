// Module customization hooks that let plain Node import the repo's
// Next.js-style modules in tests, with zero new dependencies:
//
//  - The repo has no "type": "module" in package.json, but lib/ and data/
//    are written as ESM for Next. The `load` hook below marks repo .js
//    files as ESM so `export` works under node --test.
//  - Imports use the "@/..." alias (jsconfig paths) and often omit the
//    file extension; the `resolve` hook maps "@/x" to the repo root and
//    tries .ts/.js/.tsx and index files for extensionless specifiers.
//  - .ts files are left to Node's built-in type stripping (Node >= 22.6);
//    the modules under test only use erasable type syntax.
//
// Test files register these hooks BEFORE importing the module under test
// (via dynamic import), e.g.:
//
//   import { register } from 'node:module'
//   register(new URL('./helpers/hooks.mjs', import.meta.url))
//   const sales = await import('../lib/chatbot/sales.js')
import { existsSync, statSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = fileURLToPath(new URL('../../', import.meta.url))

function isFile(p) {
  try {
    return statSync(p).isFile()
  } catch {
    return false
  }
}

function resolveAsFile(baseNoExt) {
  for (const ext of ['.ts', '.js', '.tsx', '.jsx']) {
    if (isFile(baseNoExt + ext)) return baseNoExt + ext
  }
  if (isFile(baseNoExt)) return baseNoExt
  for (const idx of ['index.ts', 'index.js', 'index.tsx']) {
    const p = path.join(baseNoExt, idx)
    if (isFile(p)) return p
  }
  return null
}

export async function resolve(specifier, context, next) {
  if (specifier.startsWith('@/')) {
    const found = resolveAsFile(path.join(ROOT, specifier.slice(2)))
    if (found) return { url: pathToFileURL(found).href, shortCircuit: true }
    return next(specifier, context)
  }
  if (
    (specifier.startsWith('./') || specifier.startsWith('../')) &&
    context.parentURL &&
    context.parentURL.startsWith('file:')
  ) {
    try {
      return await next(specifier, context)
    } catch {
      const parentDir = path.dirname(fileURLToPath(context.parentURL))
      const found = resolveAsFile(path.join(parentDir, specifier))
      if (found) return { url: pathToFileURL(found).href, shortCircuit: true }
      throw new Error(`Cannot resolve ${specifier} from ${context.parentURL}`)
    }
  }
  return next(specifier, context)
}

export async function load(url, context, next) {
  if (url.startsWith('file:')) {
    const p = fileURLToPath(url)
    if (p.startsWith(ROOT) && !p.includes('node_modules') && p.endsWith('.js')) {
      const source = await readFile(p, 'utf8')
      return { format: 'module', source, shortCircuit: true }
    }
  }
  return next(url, context)
}
