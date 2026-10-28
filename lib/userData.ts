import { encryptWithUserId, decryptWithUserId, generateLocalUserId } from '@/lib/encryption'

const FAV_KEY = 'calpulli_favorites'
const COMMENTED_KEY = 'calpulli_commented'
const PROFILE_KEY = 'calpulli_profile'
const USER_ID_KEY = 'calpulli_user_id'

function getUserId(): string {
  if (typeof window === 'undefined') return ''
  let userId = localStorage.getItem(USER_ID_KEY)
  if (!userId) {
    userId = generateLocalUserId()
    localStorage.setItem(USER_ID_KEY, userId)
  }
  return userId
}

function read<T>(key: string): T[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function write(key: string, value: unknown) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore
  }
}

async function readEncrypted<T>(key: string, userId: string): Promise<T | null> {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed._encrypted) {
      return await decryptWithUserId<T>(userId, parsed)
    }
    return parsed as T
  } catch {
    return null
  }
}

async function writeEncrypted(key: string, value: unknown, userId: string) {
  if (typeof window === 'undefined') return
  try {
    const encrypted = await encryptWithUserId(userId, value as Record<string, unknown>)
    localStorage.setItem(key, JSON.stringify(encrypted))
  } catch {
    // fallback to plain
    localStorage.setItem(key, JSON.stringify(value))
  }
}

export function getFavorites(userId?: string): string[] {
  return read<string>(FAV_KEY).filter((f) => typeof f === 'string')
}

export function toggleFavorite(tourId: string): boolean {
  const current = getFavorites()
  const exists = current.includes(tourId)
  const next = exists ? current.filter((id) => id !== tourId) : [...current, tourId]
  write(FAV_KEY, next)
  return !exists
}

export function isFavorite(tourId: string): boolean {
  return getFavorites().includes(tourId)
}

export function getCommented(): string[] {
  return read<string>(COMMENTED_KEY)
}

export function addCommented(tourId: string) {
  const current = getCommented()
  if (!current.includes(tourId)) write(COMMENTED_KEY, [...current, tourId])
}

export interface ProfileData {
  firstName: string
  lastName: string
  email: string
  phone?: string
  country?: string
  marketingEmail?: boolean
  marketingPush?: boolean
  summary?: string
}

export async function getProfileData(
  user?: { firstName?: string; lastName?: string; email?: string } | null
): Promise<ProfileData> {
  const userId = getUserId()
  const stored = await readEncrypted<Record<string, unknown>>(PROFILE_KEY, userId)
  const profile =
    stored ?? (read<Record<string, unknown>>(PROFILE_KEY)[0] as Record<string, unknown> | undefined)
  return {
    firstName: (profile?.firstName as string) || user?.firstName || '',
    lastName: (profile?.lastName as string) || user?.lastName || '',
    email: (profile?.email as string) || user?.email || '',
    phone: (profile?.phone as string) || '',
    country: (profile?.country as string) || '',
    marketingEmail: Boolean(profile?.marketingEmail),
    marketingPush: Boolean(profile?.marketingPush),
    summary: (profile?.summary as string) || '',
  }
}

export async function saveProfileData(data: ProfileData) {
  const userId = getUserId()
  await writeEncrypted(PROFILE_KEY, data, userId)
}

export interface EncryptedExportData {
  exportedAt: string
  profile: Record<string, unknown> | null
  favorites: string[]
  commented: string[]
  bookings: unknown[]
  cart: unknown[]
  _encrypted?: {
    ciphertext: string
    iv: string
    createdAt: string
  }
}

export async function exportMyData(encrypt = false): Promise<EncryptedExportData> {
  const userId = getUserId()
  const payload: EncryptedExportData = {
    exportedAt: new Date().toISOString(),
    profile: (await readEncrypted(PROFILE_KEY, userId)) ?? read(PROFILE_KEY)[0] ?? null,
    favorites: getFavorites(),
    commented: getCommented(),
    bookings: read<unknown[]>('calpulli_bookings'),
    cart: read<unknown[]>('calpulli_cart'),
  }

  let finalPayload = payload
  if (encrypt && userId) {
    const encrypted = await encryptWithUserId(userId, payload)
    finalPayload = { ...payload, _encrypted: encrypted }
  }

  const blob = new Blob([JSON.stringify(finalPayload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `datos-usuario-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)

  return payload
}

export async function deleteMyData() {
  const keys = [
    FAV_KEY,
    COMMENTED_KEY,
    PROFILE_KEY,
    'calpulli_bookings',
    'calpulli_cart',
    'calpulli_cart_version',
    'calpulli_password',
    USER_ID_KEY,
  ]
  keys.forEach((k) => localStorage.removeItem(k))
}

export async function exportEncryptedData(): Promise<void> {
  await exportMyData(true)
}
