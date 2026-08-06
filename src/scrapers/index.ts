import type { ProductInfo, StoreId } from './types'
import { StoreNotSupportedError } from './types'

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

export async function scrapeProduct(url: string): Promise<ProductInfo> {
  const store = identifyStore(url)
  if (!store) {
    throw new StoreNotSupportedError()
  }
  if (store === 'shopee') {
    const { scrapeShopee } = await import('./shopee')
    return scrapeShopee(url)
  }
  if (store === 'mercadolivre') {
    const { scrapeMercadoLivre } = await import('./mercadolivre')
    return scrapeMercadoLivre(url)
  }
  const { scrapeShein } = await import('./shein')
  return scrapeShein(url)
}
