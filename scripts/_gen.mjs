import puppeteer from 'puppeteer'
import { writeFileSync } from 'fs'

const browser = await puppeteer.launch({ headless: true })
const page = await browser.newPage()
await page.setViewport({ width: 800, height: 1200, deviceScaleFactor: 2 })
await page.goto('file:///C:/Users/biank/Downloads/Standaufbau%20Skizze-Standardcamp.pdf', { waitUntil: 'networkidle0', timeout: 30000 })
await new Promise(r => setTimeout(r, 1500))
const buf = await page.screenshot({ type: 'png', fullPage: false })
await browser.close()
writeFileSync('C:/Users/biank/skizze-thumb.png', buf)
console.log('saved', buf.length, 'bytes')
