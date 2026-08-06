import type { ProductInfo, StoreId } from './types'

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

export function identifyStoreLabel(store: StoreId): string {
  if (store === 'shopee') return 'Shopee'
  if (store === 'mercadolivre') return 'Mercado Livre'
  return 'SHEIN'
}

export function isSupportedStore(url: string): url is string {
  return identifyStore(url) !== null
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
    const { scrapeShopee } = await import('./shopee')
    const { scrapeMercadoLivre } = await import('./mercadolivre')
    const { scrapeShein } = await import('./shein')

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
