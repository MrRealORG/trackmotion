'use client'

/**
 * Uploaded asset cache (stickers / previews / backgrounds).
 *
 * The studio reads this synchronously while rendering the sticker picker, so we
 * keep an in-memory cache that is hydrated from the Postgres-backed library
 * (`GET /api/assets`) on boot, with a localStorage fallback for offline use.
 */

export type AssetKind = 'sticker' | 'preview' | 'background'

export interface UploadedAsset {
  id: string
  name: string
  type: AssetKind
  dataUrl: string
  uploadedAt: number
}

const STORAGE_KEY = 'trackweb_assets'

let CACHE: UploadedAsset[] | null = null
const listeners = new Set<() => void>()

function readLocal(): UploadedAsset[] {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    return raw ? (JSON.parse(raw) as UploadedAsset[]) : []
  } catch {
    return []
  }
}

function writeLocal(assets: UploadedAsset[]) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(assets.slice(0, 60)))
    }
  } catch {
    /* quota — ignore */
  }
}

export function getUploadedAssets(type?: AssetKind): UploadedAsset[] {
  if (!CACHE) CACHE = readLocal()
  return type ? CACHE.filter((a) => a.type === type) : CACHE
}

export function subscribeAssets(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function commit(next: UploadedAsset[]) {
  CACHE = next
  writeLocal(next)
  listeners.forEach((l) => l())
}

/** Pull the shared library from the server and merge it into the local cache. */
export async function hydrateAssets(): Promise<void> {
  try {
    const res = await fetch('/api/assets', { cache: 'no-store' })
    if (!res.ok) throw new Error(String(res.status))
    const rows = (await res.json()) as UploadedAsset[]
    const local = readLocal()
    const seen = new Set(rows.map((r) => r.id))
    commit([...rows, ...local.filter((l) => !seen.has(l.id))])
  } catch {
    if (!CACHE) CACHE = readLocal()
    listeners.forEach((l) => l())
  }
}

export async function uploadAssets(files: FileList | File[], type: AssetKind): Promise<number> {
  const list = Array.from(files).filter((f) => f.type.startsWith('image/'))
  const encoded = await Promise.all(
    list.map(
      (file) =>
        new Promise<UploadedAsset>((resolve) => {
          const reader = new FileReader()
          reader.onload = () =>
            resolve({
              id:
                typeof crypto !== 'undefined' && 'randomUUID' in crypto
                  ? crypto.randomUUID()
                  : Math.random().toString(36).slice(2, 11),
              name: file.name,
              type,
              dataUrl: reader.result as string,
              uploadedAt: Date.now(),
            })
          reader.onerror = () =>
            resolve({
              id: Math.random().toString(36).slice(2, 11),
              name: file.name,
              type,
              dataUrl: '',
              uploadedAt: Date.now(),
            })
          reader.readAsDataURL(file)
        }),
    ),
  )
  if (encoded.length) commit([...encoded, ...getUploadedAssets()])
  try {
    await fetch('/api/assets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: encoded }),
    })
  } catch {
    /* offline — local cache already updated */
  }
  return encoded.length
}

export async function removeAsset(id: string) {
  commit(getUploadedAssets().filter((a) => a.id !== id))
  try {
    await fetch(`/api/assets?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
  } catch {
    /* ignore */
  }
}
