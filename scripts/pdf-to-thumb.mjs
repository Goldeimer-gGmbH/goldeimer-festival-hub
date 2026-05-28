// Einmaliges Script: PDF → PNG-Thumbnail via Puppeteer → Supabase Storage
// Aufruf: node scripts/pdf-to-thumb.mjs <pfad-zur-pdf> <ziel-dateiname-ohne-ext>
// Beispiel: node scripts/pdf-to-thumb.mjs "C:\Downloads\Skizze.pdf" skizze-standardcamp

import puppeteer from 'puppeteer'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const SUPABASE_URL = 'https://wsdkmglkqxszyvomrfim.supabase.co'
const ANON_KEY     = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzZGttZ2xrcXhzenl2b21yZmltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNTk4NjYsImV4cCI6MjA5MTczNTg2Nn0.CkX010BgVGjJUOs7RSYHlXJSwA-0jL4iPvi4gA59dTM'
const BUCKET       = 'assets'
const FOLDER       = 'anleitung'
const THUMB_W      = 800   // px Breite des Thumbnails

const [,, pdfPath, baseName] = process.argv
if (!pdfPath || !baseName) {
  console.error('Usage: node scripts/pdf-to-thumb.mjs <pdf-path> <base-name>')
  process.exit(1)
}

const absPath = resolve(pdfPath)
// file:// URL für Puppeteer
const pdfUrl  = `file:///${absPath.replace(/\\/g, '/')}`
console.log(`Rendere PDF: ${pdfUrl}`)

const browser = await puppeteer.launch({ headless: true })
const page    = await browser.newPage()

// Viewport breit genug für die ganze Seite
await page.setViewport({ width: THUMB_W, height: 1200, deviceScaleFactor: 2 })
await page.goto(pdfUrl, { waitUntil: 'networkidle0', timeout: 30000 })

// Kurz warten bis PDF gerendert ist
await new Promise(r => setTimeout(r, 1500))

const screenshot = await page.screenshot({ type: 'png', fullPage: false })
await browser.close()

console.log(`Screenshot: ${Math.round(screenshot.length / 1024)} KB`)

// Upload zu Supabase Storage
const thumbName = `${baseName}.thumb.png`
const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${FOLDER}/${thumbName}`
console.log(`Lade hoch: ${uploadUrl}`)

const res  = await fetch(uploadUrl, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${ANON_KEY}`,
    'Content-Type':  'image/png',
    'x-upsert':      'true',
  },
  body: screenshot,
})
const json = await res.json()
console.log('Supabase:', res.status, JSON.stringify(json))

if (res.ok) {
  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${FOLDER}/${thumbName}`
  console.log(`\n✓ Öffentliche URL:\n${publicUrl}`)
}
