import fs from 'node:fs'
import path from 'node:path'

const pubDir = path.resolve('.output/public')
if (!fs.existsSync(pubDir)) {
  fs.mkdirSync(pubDir, { recursive: true })
}

const html200 = path.join(pubDir, '200.html')
const indexHtml = path.join(pubDir, 'index.html')

if (fs.existsSync(html200)) {
  fs.copyFileSync(html200, indexHtml)
  console.log('✅ Đã sao chép 200.html sang index.html cho Capacitor')
} else if (!fs.existsSync(indexHtml)) {
  // Fallback tối thiểu nếu chạy trước khi generate
  fs.writeFileSync(
    indexHtml,
    `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>NeNepOS</title></head><body><div id="__nuxt">Đang tải NeNepOS...</div></body></html>`,
  )
  console.log('✅ Đã tạo index.html dự phòng cho Capacitor')
}
