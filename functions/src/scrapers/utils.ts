export interface FetchOptions {
  referer?: string
  headers?: Record<string, string>
  ua?: string
}

export const GOOGLEBOT_UA =
  'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'

export async function fetchText(url: string, timeoutMs = 15000, options: FetchOptions = {}): Promise<string> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  const parsed = new URL(url)
  const headers: Record<string, string> = {
    'User-Agent':
      options.ua ??
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Referer': options.referer ?? `${parsed.protocol}//${parsed.host}/`,
    ...(options.headers || {}),
  }
  try {
    const res = await fetch(url, {
      headers,
      signal: controller.signal,
      redirect: 'follow',
    })
    if (!res.ok) {
      throw new Error(`Falha ao acessar a página (HTTP ${res.status})`)
    }
    return await res.text()
  } finally {
    clearTimeout(timer)
  }
}

export function normalizePrice(raw: string | number | null | undefined): string {
  if (raw === null || raw === undefined) return ''
  const value = String(raw).trim()

  if (!value) return ''

  const token = value.replace(/[^\d.,]/g, '')
  if (!token) return ''

  const hasComma = token.includes(',')
  const hasDot = token.includes('.')

  let normalized: string
  if (hasComma && hasDot) {
    normalized = token.replace(/\./g, '').replace(',', '.')
  } else if (hasComma) {
    normalized = token.replace(',', '.')
  } else if (hasDot) {
    const parts = token.split('.')
    const lastLen = parts[parts.length - 1].length
    if (parts.length > 2 && lastLen <= 2) {
      normalized = parts.slice(0, -1).join('') + '.' + parts[parts.length - 1]
    } else if (lastLen === 3) {
      normalized = token.replace(/\./g, '')
    } else {
      normalized = token
    }
  } else {
    normalized = token
  }

  if (!/^[0-9]+(\.[0-9]+)?$/.test(normalized)) return ''

  const num = parseFloat(normalized)
  if (!isFinite(num) || num < 0) return ''

  return num.toFixed(2).replace(/\./g, ',')
}

export function parseJsonLd(html: string): unknown[] {
  const results: unknown[] = []
  const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let match: RegExpExecArray | null
  while ((match = regex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim())
      results.push(parsed)
    } catch {
      /* ignora JSON inválido */
    }
  }
  return results
}

export function findInObject(obj: unknown, keys: string[]): unknown {
  if (!obj || typeof obj !== 'object') return undefined
  const seen = new Set<unknown>()
  const stack: unknown[] = [obj]
  while (stack.length) {
    const current = stack.pop()
    if (!current || typeof current !== 'object' || seen.has(current)) continue
    seen.add(current)
    if (Array.isArray(current)) {
      for (const item of current) stack.push(item)
      continue
    }
    const record = current as Record<string, unknown>
    for (const key of Object.keys(record)) {
      if (keys.includes(key) && record[key] !== undefined && record[key] !== null && record[key] !== '') {
        return record[key]
      }
      stack.push(record[key])
    }
  }
  return undefined
}
