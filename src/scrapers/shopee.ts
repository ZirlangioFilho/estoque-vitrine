import type { ProductInfo } from './types'
import { SCRAPE_API_URL } from './types'

export async function scrapeShopee(url: string): Promise<ProductInfo> {
  const res = await fetch(`${SCRAPE_API_URL}/api/scrape`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.error || 'Erro durante a busca.')
  return data.product as ProductInfo
}
