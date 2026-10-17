import sharp from 'sharp'
const svg = 'public/icon.svg'
for (const [name, size] of [['icon-192.png', 192], ['icon-512.png', 512], ['apple-touch-icon.png', 180]]) {
  await sharp(svg, { density: 300 }).resize(size, size).png().toFile(`public/${name}`)
}
