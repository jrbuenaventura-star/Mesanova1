"use client"

const DELIVERY_OFFLINE_KEY = "mesanova.delivery.offline.key"
const DELIVERY_QUEUE_KEY = "mesanova.delivery.offline.queue"
const DELIVERY_DAY_LIST_KEY = "mesanova.delivery.offline.day-list"

type EncryptedPayload = {
  iv: string
  value: string
}

export type DeliveryOfflineQueueItem = {
  id: string
  endpoint: string
  created_at: string
  payload: Record<string, unknown>
}

function toBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ""
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary)
}

function fromBase64(value: string) {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

async function getEncryptionKey() {
  let material = window.localStorage.getItem(DELIVERY_OFFLINE_KEY)
  if (!material) {
    const random = crypto.getRandomValues(new Uint8Array(32))
    material = toBase64(random.buffer)
    window.localStorage.setItem(DELIVERY_OFFLINE_KEY, material)
  }

  return crypto.subtle.importKey("raw", fromBase64(material), "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ])
}

async function encryptJSON(value: unknown): Promise<EncryptedPayload> {
  const key = await getEncryptionKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(JSON.stringify(value))
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded)
  return {
    iv: toBase64(iv.buffer),
    value: toBase64(encrypted),
  }
}

async function decryptJSON<T>(value: string | null): Promise<T | null> {
  if (!value) {
    return null
  }

  try {
    const payload = JSON.parse(value) as EncryptedPayload
    if (!payload.iv || !payload.value) {
      return null
    }
    const key = await getEncryptionKey()
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromBase64(payload.iv) },
      key,
      fromBase64(payload.value)
    )
    return JSON.parse(new TextDecoder().decode(decrypted)) as T
  } catch {
    return null
  }
}

export async function loadEncryptedOfflineQueue() {
  const queue = await decryptJSON<DeliveryOfflineQueueItem[]>(
    window.localStorage.getItem(DELIVERY_QUEUE_KEY)
  )
  return queue || []
}

export async function saveEncryptedOfflineQueue(queue: DeliveryOfflineQueueItem[]) {
  const encrypted = await encryptJSON(queue)
  window.localStorage.setItem(DELIVERY_QUEUE_KEY, JSON.stringify(encrypted))
}

export async function enqueueOfflineDeliveryAction(item: DeliveryOfflineQueueItem) {
  const queue = await loadEncryptedOfflineQueue()
  queue.push(item)
  await saveEncryptedOfflineQueue(queue)
}

export async function storeOfflineDayDeliveries(value: unknown) {
  const encrypted = await encryptJSON(value)
  window.localStorage.setItem(DELIVERY_DAY_LIST_KEY, JSON.stringify(encrypted))
}

export async function getOfflineDayDeliveries<T>() {
  return decryptJSON<T>(window.localStorage.getItem(DELIVERY_DAY_LIST_KEY))
}
