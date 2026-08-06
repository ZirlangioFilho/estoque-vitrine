import express from 'express'
import cors from 'cors'
import { onRequest } from 'firebase-functions/v2/https'
import { scrape } from './scrapers/index.js'

const app = express()
app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

app.post('/api/scrape', async (req, res) => {
  const url = typeof req.body?.url === 'string' ? req.body.url.trim() : ''
  if (!url) {
    res.status(400).json({ error: 'Informe a URL do produto.' })
    return
  }
  const result = await scrape(url)
  if (result.unsupported) {
    res.status(400).json({ error: 'Loja não suportada.' })
    return
  }
  if (result.error || !result.product) {
    res.status(502).json({ error: result.error || 'Erro durante a busca.' })
    return
  }
  res.json({ product: result.product })
})

export const scrapeApi = onRequest(
  {
    timeoutSeconds: 120,
    memory: '256MiB',
  },
  app
)
