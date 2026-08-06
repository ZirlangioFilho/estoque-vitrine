import * as cheerio from 'cheerio'
import { fetchText, normalizePrice, parseJsonLd, GOOGLEBOT_UA } from './utils.js'
import type { ProductInfo } from './types.js'

export async function scrapeMercadoLivre(url: string): Promise<ProductInfo> {
  const html = await fetchText(url, 20000, { referer: 'https://www.mercadolivre.com.br/', ua: GOOGLEBOT_UA })
  const $ = cheerio.load(html)

  const h1 = $('h1.ui-pdp-title').first().text().trim()
  const ogTitle = $('meta[property="og:title"]').attr('content') || ''
  const name = h1 || ogTitle || $('meta[name="twitter:title"]').attr('content') || ''

  let image = $('meta[property="og:image"]').attr('content') || ''
  if (!image) {
    image = $('figure.ui-pdp-gallery__figure img').first().attr('src') || ''
  }
  if (image && !/^https?:/.test(image)) {
    image = `https:${image}`
  }

  let price = $('meta[property="product:price:amount"]').attr('content') || ''
  if (!price) {
    price = $('meta[itemprop="price"]').attr('content') || ''
  }
  if (!price) {
    const jsonLd = parseJsonLd(html)
    for (const data of jsonLd) {
      const rec = data as { offers?: { price?: string | number; lowPrice?: string | number } }
      const offers = rec.offers
      if (offers) {
        const candidate = offers.price ?? offers.lowPrice
        if (candidate !== undefined) {
          price = String(candidate)
          break
        }
      }
    }
  }
  const normalizedPrice = normalizePrice(price)

  return {
    name: name.trim(),
    price: normalizedPrice,
    image,
    store: 'Mercado Livre',
  }
}
