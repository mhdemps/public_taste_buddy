/**
 * Pull PNGs into src/assets/figma/ using filenames from your imports (figma:asset/<hash>.png).
 *
 * Primary design file (default for --discover and --pull):
 *   https://www.figma.com/design/Zk3vOU0WnK54wS9NxPlKS4/MADIson?m=dev
 *
 * Setup:
 *   1. Figma → Settings → Security → Personal access tokens → generate token
 *   2. Node IDs: right-click a layer → Copy/Paste → Copy link (node-id= in URL; use ":" not "-")
 *
 * Env:
 *   FIGMA_ACCESS_TOKEN — required for pull / discover
 *   FIGMA_FILE_KEY — optional; defaults to MADIson file key below
 *   FIGMA_MAKE_FILE_KEY — optional; only for --discover --make
 *
 * Usage:
 *   node scripts/pull-figma-assets.mjs --needs
 *   node scripts/pull-figma-assets.mjs --discover
 *   node scripts/pull-figma-assets.mjs --pull
 */
import fs from 'node:fs/promises'
import { createWriteStream } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { pipeline } from 'node:stream/promises'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const SRC = path.join(ROOT, 'src')
const OUT = path.join(ROOT, 'src', 'assets', 'figma')
const MAP_FILE = path.join(__dirname, 'figma-asset-map.json')

/** MADIson — https://www.figma.com/design/Zk3vOU0WnK54wS9NxPlKS4/MADIson?m=dev */
const MADISON_FILE_KEY = 'Zk3vOU0WnK54wS9NxPlKS4'

const MAKE_FILE_KEY = process.env.FIGMA_MAKE_FILE_KEY || 'fVQJ01F71gTAakgqjFYZf3'

function defaultFileKey() {
  return process.env.FIGMA_FILE_KEY || MADISON_FILE_KEY
}

const FIGMA_API = 'https://api.figma.com/v1'

function getToken() {
  const t = process.env.FIGMA_ACCESS_TOKEN
  if (!t) {
    console.error('Set FIGMA_ACCESS_TOKEN (Figma → Settings → Personal access tokens).')
    process.exit(1)
  }
  return t
}

async function figmaGet(urlPath, token) {
  const res = await fetch(`${FIGMA_API}${urlPath}`, {
    headers: { 'X-Figma-Token': token },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${res.status} ${res.statusText} ${urlPath}\n${text}`)
  }
  return res.json()
}

function walkNodes(node, visit) {
  visit(node)
  for (const c of node.children || []) walkNodes(c, visit)
}

async function collectSourceFiles(dir, acc = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const e of entries) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) await collectSourceFiles(p, acc)
    else if (/\.(tsx|ts|jsx|js)$/.test(e.name)) acc.push(p)
  }
  return acc
}

async function cmdNeeds() {
  const re = /figma:asset\/([a-f0-9]+\.png)/g
  const set = new Set()
  const files = await collectSourceFiles(SRC)
  for (const f of files) {
    const text = await fs.readFile(f, 'utf8')
    let m
    while ((m = re.exec(text)) !== null) set.add(m[1])
  }
  const list = [...set].sort()
  console.log(`${list.length} unique asset filenames referenced in src/:\n`)
  for (const x of list) console.log(x)
  console.log(
    `\nMap each line in ${path.relative(ROOT, MAP_FILE)} to a node id from MADIson:\n  https://www.figma.com/design/${MADISON_FILE_KEY}/MADIson?m=dev\nExample: "<filename>": "123:456" (from Copy link → node-id=; use colons not hyphens)`,
  )
}

async function cmdDiscover(fileKey) {
  const token = getToken()
  if (fileKey === MADISON_FILE_KEY) {
    console.log(
      `MADIson: https://www.figma.com/design/${MADISON_FILE_KEY}/MADIson?m=dev`,
    )
  }
  console.log(`Fetching file ${fileKey} …`)
  const data = await figmaGet(`/files/${fileKey}`, token)
  const found = []
  walkNodes(data.document, (n) => {
    if (n.exportSettings && n.exportSettings.length > 0)
      found.push({ id: n.id, name: n.name, type: n.type })
  })
  if (found.length === 0) {
    console.log(
      'No layers with Export settings. In Figma: select a layer → right sidebar → Export → + → pick PNG, then re-run.',
    )
    return
  }
  console.log(JSON.stringify(found, null, 2))
}

function chunk(arr, size) {
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

async function downloadUrl(url, dest) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Download failed ${res.status} ${url}`)
  await pipeline(res.body, createWriteStream(dest))
}

async function cmdPull() {
  const token = getToken()
  let map
  try {
    const raw = await fs.readFile(MAP_FILE, 'utf8')
    map = JSON.parse(raw)
  } catch {
    console.error(`Missing or invalid ${MAP_FILE}`)
    process.exit(1)
  }

  const entries = Object.entries(map).filter(
    ([k, v]) => typeof v === 'string' && k.endsWith('.png') && /^\d+:\d+$/.test(v),
  )
  if (entries.length === 0) {
    console.error(`No valid entries in map. Use "${path.basename(MAP_FILE)}" like:`)
    console.error('  "a75f13ee8fdc55044426e18a4df7c4c3f15a6468.png": "123:456"')
    process.exit(1)
  }

  const fileKey = defaultFileKey()
  console.log(`Figma file: ${fileKey} (${entries.length} assets)`)
  if (fileKey === MADISON_FILE_KEY) {
    console.log(`  Open: https://www.figma.com/design/${MADISON_FILE_KEY}/MADIson?m=dev\n`)
  } else console.log('')

  await fs.mkdir(OUT, { recursive: true })

  const byNode = new Map(entries.map(([file, id]) => [id, file]))
  const nodeIds = [...byNode.keys()]
  const batches = chunk(nodeIds, 50)

  for (const batch of batches) {
    const ids = batch.join(',')
    const imgMeta = await figmaGet(
      `/images/${fileKey}?ids=${ids}&format=png&scale=2`,
      token,
    )
    if (imgMeta.err) throw new Error(imgMeta.err)

    for (const id of batch) {
      const url = imgMeta.images[id]
      const filename = byNode.get(id)
      if (!url) {
        console.warn(`No render URL for node ${id} (${filename})`)
        continue
      }
      const dest = path.join(OUT, filename)
      await downloadUrl(url, dest)
      console.log(`Wrote ${filename}`)
    }
  }
  console.log(`\nDone → ${path.relative(ROOT, OUT)}`)
}

const argv = process.argv.slice(2)
if (argv.includes('--needs')) {
  await cmdNeeds()
} else if (argv.includes('--discover')) {
  const useMake = argv.includes('--make')
  await cmdDiscover(useMake ? MAKE_FILE_KEY : defaultFileKey())
} else if (argv.includes('--pull')) {
  await cmdPull()
} else {
  console.log(`Usage:
  FIGMA_ACCESS_TOKEN=… node scripts/pull-figma-assets.mjs --needs
  FIGMA_ACCESS_TOKEN=… node scripts/pull-figma-assets.mjs --discover [--make]
  FIGMA_ACCESS_TOKEN=… node scripts/pull-figma-assets.mjs --pull

Default design (MADIson):
  https://www.figma.com/design/${MADISON_FILE_KEY}/MADIson?m=dev
  File key: ${MADISON_FILE_KEY}

Optional --discover --make uses FIGMA_MAKE_FILE_KEY (default ${MAKE_FILE_KEY}).

Map import filenames → node IDs in:
  ${path.relative(ROOT, MAP_FILE)}
`)
}
