// PDF → JPEG via Puppeteer + pdfjs (weißer Hintergrund, kein Browser-Viewer-Chrome)
// Aufruf: node scripts/pdf-to-jpeg.mjs <pfad-zur-pdf> <ziel-dateiname-ohne-ext>

import puppeteer from 'puppeteer'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import sharp from 'sharp'

const SUPABASE_URL = 'https://wsdkmglkqxszyvomrfim.supabase.co'
const ANON_KEY     = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzZGttZ2xrcXhzenl2b21yZmltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNTk4NjYsImV4cCI6MjA5MTczNTg2Nn0.CkX010BgVGjJUOs7RSYHlXJSwA-0jL4iPvi4gA59dTM'
const BUCKET       = 'assets'
const FOLDER       = 'anleitung'

const [,, pdfPath, baseName] = process.argv
if (!pdfPath || !baseName) {
  console.error('Usage: node scripts/pdf-to-jpeg.mjs <pdf-path> <base-name>')
  process.exit(1)
}

const absPath   = resolve(pdfPath)
const pdfBytes  = readFileSync(absPath)
const pdfBase64 = pdfBytes.toString('base64')
console.log(`PDF gelesen: ${Math.round(pdfBytes.length / 1024)} KB`)

// HTML-Seite die pdfjs nutzt um die erste Seite auf weißem Canvas zu rendern
const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { background: white; }
  canvas { display: block; }
</style>
</head>
<body>
<canvas id="c"></canvas>
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
<script>
(async () => {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'

  const base64 = '${pdfBase64}'
  const binary = atob(base64)
  const bytes  = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)

  const pdf  = await pdfjsLib.getDocument({ data: bytes }).promise
  const page = await pdf.getPage(1)

  const scale    = 2
  const viewport = page.getViewport({ scale })

  const canvas  = document.getElementById('c')
  canvas.width  = viewport.width
  canvas.height = viewport.height

  const ctx = canvas.getContext('2d')
  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  await page.render({ canvasContext: ctx, viewport }).promise
  document.title = 'READY'
})()
</script>
</body>
</html>`

const browser = await puppeteer.launch({ headless: true })
const page    = await browser.newPage()

// Großes Viewport — pdfjs rendert in tatsächlicher Größe
await page.setViewport({ width: 1800, height: 2600 })
await page.setContent(html, { waitUntil: 'networkidle0' })

// Warten bis pdfjs fertig ist (document.title wird auf 'READY' gesetzt)
await page.waitForFunction(() => document.title === 'READY', { timeout: 15000 })
await new Promise(r => setTimeout(r, 300))

// Nur das Canvas-Element screenshotten (kein Browser-Chrome)
const canvas = await page.$('#c')
const screenshot = await canvas.screenshot({ type: 'png' })
await browser.close()

console.log(`Screenshot: ${Math.round(screenshot.length / 1024)} KB (PNG)`)

// PNG → JPEG 600px@80 mit sharp
const jpegBuffer = await sharp(screenshot)
  .resize(600)
  .jpeg({ quality: 80 })
  .toBuffer()

console.log(`JPEG: ${Math.round(jpegBuffer.length / 1024)} KB`)

// Upload zu Supabase (erst löschen)
const thumbName = `${baseName}.thumb.jpg`
const fileUrl   = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${FOLDER}/${thumbName}`

const del = await fetch(fileUrl, {
  method: 'DELETE',
  headers: { 'Authorization': `Bearer ${ANON_KEY}` },
})
console.log(`DELETE: ${del.status}`)

const res = await fetch(fileUrl, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${ANON_KEY}`, 'Content-Type': 'image/jpeg' },
  body: jpegBuffer,
})
const json = await res.json()
console.log('Upload:', res.status, JSON.stringify(json))

if (res.ok) {
  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${FOLDER}/${thumbName}`
  console.log(`\n✓ URL: ${publicUrl}`)
}
