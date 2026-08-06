import type { ProductInfo, StoreId } from './types.js'

export function identifyStore(url: string): StoreId | null {
  let host: string
  try {
    host = new URL(url).hostname.toLowerCase()
  } catch {
    return null
  }
  if (host.includes('shopee.com.br')) return 'shopee'
  if (host.includes('mercadolivre.com.br') || host.includes('mercadolibre.com.br')) return 'mercadolivre'
  if (host.includes('shein.com')) return 'shein'
  return null
}

export interface ScrapeResult {
  product?: ProductInfo
  error?: string
  unsupported?: boolean
}

export async function scrape(url: string): Promise<ScrapeResult> {
  const store = identifyStore(url)
  if (!store) {
    return { error: 'Loja não suportada.', unsupported: true }
  }
  try {
    const { scrapeShopee } = await import('./shopee.js')
    const { scrapeMercadoLivre } = await import('./mercadolivre.js')
    const { scrapeShein } = await import('./shein.js')

    let product: ProductInfo
    if (store === 'shopee') {
      product = await scrapeShopee(url)
    } else if (store === 'mercadolivre') {
      product = await scrapeMercadoLivre(url)
    } else {
      product = await scrapeShein(url)
    }
    return { product }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    return { error: msg }
  }
}
