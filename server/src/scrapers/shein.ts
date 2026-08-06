import * as cheerio from 'cheerio'
import { fetchText, normalizePrice, findInObject } from './utils'
import type { ProductInfo } from './types'

interface SheinGoods {
  goods_id?: string | number
  goods_name?: string
  salePrice?: string | number
  originalPrice?: string | number
  curPrice?: string | number
  price?: string | number
  goods_img?: string
  goods_imgs?: string[]
}

function extractSheinGoods(html: string): SheinGoods | null {
  const regex = /window\.__PRELOADED_STATE__\s*=\s*({[\s\S]*?});/i
  const match = html.match(regex)
  if (!match) return null
  try {
    const state = JSON.parse(match[1].replace(/undefined/g, 'null'))
    const goods = findInObject(state, [
      'goodsInfo',
      'goods',
      'productDetail',
      'goodsDetail',
    ]) as SheinGoods | null
    if (goods && typeof goods === 'object') return goods
  } catch {
    /* ignora */
  }
  return null
}

export async function scrapeShein(url: string): Promise<ProductInfo> {
  const html = await fetchText(url, 20000, { referer: 'https://br.shein.com/' })
  const $ = cheerio.load(html)

  const h1 = $('h1').first().text().trim()
  const ogTitle = $('meta[property="og:title"]').attr('content') || ''
  let name = h1 || ogTitle || $('meta[name="twitter:title"]').attr('content') || ''

  let image = $('meta[property="og:image"]').attr('content') || ''
  if (!image) {
    const img = $('.product-intro img').first().attr('src') || $('img[data-src]').first().attr('data-src') || ''
    image = img
  }
  if (image && !/^https?:/.test(image)) {
    image = `https:${image}`
  }

  let price = $('meta[property="product:price:amount"]').attr('content') || ''

  const goods = extractSheinGoods(html)
  if (!price && goods) {
    const candidate = goods.salePrice ?? goods.curPrice ?? goods.price ?? goods.originalPrice
    if (candidate !== undefined) {
      price = String(candidate)
    }
  }
  const normalizedPrice = normalizePrice(price)

  if (!name && goods?.goods_name) {
    name = goods.goods_name
  }
  if (!image && (goods?.goods_img || goods?.goods_imgs?.[0])) {
    image = goods.goods_img || goods.goods_imgs![0]
  }

  return {
    name: name.trim(),
    price: normalizedPrice,
    image,
    store: 'SHEIN',
  }
}
