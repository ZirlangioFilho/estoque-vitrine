import { fetchText } from './utils'
import type { ProductInfo } from './types'

interface ShopeeItem {
  itemid: string | number
  shopid: string | number
  name?: string
  price?: number
  price_min?: number
  price_max?: number
  normal_price?: number
  image?: string
  images?: string[]
}

function extractIds(url: string): { shopid: string; itemid: string } | null {
  let normalized = url.split('?')[0].replace(/\/+$/, '')
  const pattern = /i\.(\d+)\.(\d+)/i
  const match = normalized.match(pattern)
  if (match) {
    return { shopid: match[1], itemid: match[2] }
  }

  normalized = normalized.replace(/^https?:\/\//i, '')
  const pathParts = normalized.split('/').filter(Boolean)
  const productIndex = pathParts.findIndex((p) => p.toLowerCase() === 'product')
  if (productIndex !== -1 && pathParts[productIndex + 1] && pathParts[productIndex + 2]) {
    return { shopid: pathParts[productIndex + 1], itemid: pathParts[productIndex + 2] }
  }
  return null
}

async function resolveShortUrl(url: string): Promise<string> {
  const shortPath = new URL(url).pathname.replace(/^\/+/, '')
  if (!shortPath) return url
  try {
    const apiUrl = `https://shopee.com.br/api/v4/pages/is_short_url/?path=${encodeURIComponent(shortPath)}`
    const json = await fetchText(apiUrl, 15000, { referer: url })
    const data = JSON.parse(json)
    if (data?.data?.url) return data.data.url
  } catch {
    /* segue com a URL original */
  }
  return url
}

async function fetchItemData(shopid: string, itemid: string): Promise<ShopeeItem | null> {
  try {
    const apiUrl = `https://shopee.com.br/api/v4/item/get?itemid=${itemid}&shopid=${shopid}`
    const json = await fetchText(apiUrl, 15000, { referer: `https://shopee.com.br/product/${shopid}/${itemid}` })
    const data = JSON.parse(json)
    const item = data?.data?.item as ShopeeItem | undefined
    return item ?? null
  } catch {
    return null
  }
}

function shopeePriceToBRL(raw: number | undefined): string {
  if (raw === undefined || isNaN(raw)) return ''
  const value = raw / 100000
  return value.toFixed(2).replace(/\./g, ',')
}

export async function scrapeShopee(url: string): Promise<ProductInfo> {
  const resolved = url.includes('s.shopee.com.br') ? await resolveShortUrl(url) : url
  const ids = extractIds(resolved)
  let item: ShopeeItem | null = null
  if (ids) {
    item = await fetchItemData(ids.shopid, ids.itemid)
  }

  let name = ''
  let price = ''
  let image = ''

  if (item) {
    name = item.name || ''
    price = shopeePriceToBRL(item.price ?? item.price_min ?? item.normal_price)
    const imageHash = item.image || (item.images && item.images[0]) || ''
    if (imageHash) {
      image = `https://cf.shopee.com.br/file/${imageHash}`
    }
  }

  if (!name || !price || !image) {
    try {
      const html = await fetchText(resolved, 15000, { referer: url })
      const htmlName = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() || ''
      if (htmlName && !htmlName.includes('Shopee Brasil')) {
        name = name || htmlName.replace(/\s*[-|]\s*Shopee\s*Brasil\s*$/i, '').trim()
      }
    } catch {
      /* fallback silencioso */
    }
  }

  return {
    name,
    price,
    image,
    store: 'Shopee',
  }
}
