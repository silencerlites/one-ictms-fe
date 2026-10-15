import type { LibraryOption } from './library-api'

export type CachedKind = 'departments' | 'divisions' | 'positions'

interface CacheRecord {
  version: 1
  updatedAt: number
  items: LibraryOption[]
}
interface EncryptedRecord {
  iv: Uint8Array
  ciphertext: ArrayBuffer
}

const DB_NAME = 'one-ictms-library-cache-v1'
const DB_VERSION = 1
const STORE = 'cache'
const KEY_NAME = 'aes-key'
const MAX_AGE = 5 * 60 * 1000

function getIndexedDBError(error: DOMException | null, message: string): Error {
  return error ?? new Error(message)
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(getIndexedDBError(req.error, 'IndexedDB request failed.'))
  })
}

function read<T>(db: IDBDatabase, id: string): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).get(id)
    req.onsuccess = () => resolve(req.result as T | undefined)
    req.onerror = () => reject(getIndexedDBError(req.error, 'IndexedDB request failed.'))
  })
}

function write(db: IDBDatabase, id: string, value: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(value, id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(getIndexedDBError(tx.error, 'IndexedDB transaction failed.'))
    tx.onabort = () => reject(getIndexedDBError(tx.error, 'IndexedDB transaction aborted.'))
  })
}

function remove(db: IDBDatabase, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(getIndexedDBError(tx.error, 'IndexedDB transaction failed.'))
    tx.onabort = () => reject(getIndexedDBError(tx.error, 'IndexedDB transaction aborted.'))
  })
}

// A non-extractable CryptoKey is stored by IndexedDB structured cloning. It
// persists across page reloads, but can still be used by scripts on this origin.
async function getKey(db: IDBDatabase): Promise<CryptoKey> {
  const existing = await read<CryptoKey>(db, KEY_NAME)
  if (existing) return existing
  const created = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'],
  )
  await write(db, KEY_NAME, created)
  return created
}

export async function readLibraryCache(kind: CachedKind): Promise<CacheRecord | null> {
  if (typeof indexedDB === 'undefined' || !crypto?.subtle) return null
  const db = await openDb()
  try {
    const encrypted = await read<EncryptedRecord>(db, kind)
    if (!encrypted) return null
    try {
      const key = await getKey(db)
      const iv = new Uint8Array<ArrayBuffer>(
        new ArrayBuffer(encrypted.iv.byteLength),
      )
      iv.set(encrypted.iv)

      const ciphertext = new Uint8Array<ArrayBuffer>(
        new ArrayBuffer(encrypted.ciphertext.byteLength),
      )
      ciphertext.set(new Uint8Array(encrypted.ciphertext))

      const decoded = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        ciphertext,
      )
      const record = JSON.parse(new TextDecoder().decode(decoded)) as CacheRecord
      if (record.version !== 1 || !Array.isArray(record.items) ||
        !Number.isFinite(record.updatedAt) ||
        record.updatedAt > Date.now() || Date.now() - record.updatedAt >= MAX_AGE) {
        await remove(db, kind)
        return null
      }
      return record
    } catch {
      // Corrupted data or a missing key must never prevent fresh API requests.
      await remove(db, kind)
      return null
    }
  } finally { db.close() }
}

export async function writeLibraryCache(kind: CachedKind, items: LibraryOption[], updatedAt: number): Promise<void> {
  if (typeof indexedDB === 'undefined' || !crypto?.subtle) return
  const db = await openDb()
  try {
    const key = await getKey(db)
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const data = new TextEncoder().encode(JSON.stringify({ version: 1, updatedAt, items }))
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data)
    await write(db, kind, { iv, ciphertext } satisfies EncryptedRecord)
  } finally { db.close() }
}

export async function clearLibraryCache(kind?: CachedKind): Promise<void> {
  if (typeof indexedDB === 'undefined') return
  const db = await openDb()
  try {
    for (const item of kind ? [kind] : ['departments', 'divisions', 'positions']) {
      await remove(db, item)
    }
  } finally { db.close() }
}
