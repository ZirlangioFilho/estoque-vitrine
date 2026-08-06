export interface ProductInfo {
  name: string
  price: string
  image: string
  store: string
}

export type StoreId = 'shopee' | 'mercadolivre' | 'shein'

export const SCRAPE_API_URL =
  (import.meta.env.VITE_SCRAPE_API_URL as string | undefined) ||
  'https://us-central1-vitrine-select.cloudfunctions.net/scrapeApi'

export class StoreNotSupportedError extends Error {
  constructor() {
    super('Loja não suportada.')
    this.name = 'StoreNotSupportedError'
  }
}
