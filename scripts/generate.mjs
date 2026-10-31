// Builds the profile's SVG cards. Language totals come from public, non-fork repos only.
import { mkdirSync, writeFileSync } from 'node:fs'

const USER = 'NitroDaxs'
const OUT = new URL('../assets/', import.meta.url)
const FONT = "-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif"
const MONO = "ui-monospace, 'Cascadia Code', Consolas, Menlo, monospace"
const BG = '#0d1117'
const BORDER = '#30363d'
const TEXT = '#e6edf3'
const MUTED = '#8b949e'
const ACCENT = '#3fb950'

const LANGUAGE_COLORS = {
  TypeScript: '#3178c6', JavaScript: '#f1e05a', 'C#': '#2ea043', PHP: '#8892bf',
  HTML: '#e34c26', CSS: '#a371f7', SCSS: '#c6538c', Blade: '#f7523f', 'T-SQL': '#e38c00', EJS: '#a91e50',
}

const escapeXml = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

const REDUCED_MOTION = '@media (prefers-reduced-motion: reduce) { * { animation: none !important; } }'

async function github(path) {
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': USER }
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  const res = await fetch(`https://api.github.com${path}`, { headers })
  if (!res.ok) throw new Error(`GitHub ${path} returned ${res.status}`)
  return res.json()
}

async function languageTotals() {
  // This endpoint lists only public repos for any caller, so private work can't leak in.
  const repos = await github(`/users/${USER}/repos?type=owner&per_page=100`)
  const totals = {}
  for (const repo of repos) {
    if (repo.fork || repo.private) continue
    const languages = await github(`/repos/${USER}/${repo.name}/languages`)
    for (const [name, bytes] of Object.entries(languages)) totals[name] = (totals[name] ?? 0) + bytes
  }
  return totals
}

function languageRows(totals, limit = 6) {
  const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1])
  const sum = sorted.reduce((n, [, bytes]) => n + bytes, 0)
  if (!sum) throw new Error('No language data found')
  const rows = sorted.slice(0, limit).map(([name, bytes]) => ({ name, share: (bytes / sum) * 100 }))
  const rest = sorted.slice(limit).reduce((n, [, bytes]) => n + bytes, 0)
  if (rest) rows.push({ name: 'Other', share: (rest / sum) * 100 })
  return rows
}

function languagesCard(rows) {
  const W = 840, top = 78, rowH = 34, barX = 150, barW = 580
  const H = top + rows.length * rowH + 42
  const bars = rows.map((row, i) => {
    const y = top + i * rowH
    const color = LANGUAGE_COLORS[row.name] ?? MUTED
    const width = Math.max(2, (row.share / 100) * barW).toFixed(1)
    return `<g class="row" style="animation-delay:${i * 90}ms">
    <text x="32" y="${y + 13}" class="label">${escapeXml(row.name)}</text>
    <rect x="${barX}" y="${y + 2}" width="${barW}" height="12" rx="6" fill="#21262d"/>
    <rect class="bar" x="${barX}" y="${y + 2}" width="${width}" height="12" rx="6" fill="${color}" style="animation-delay:${i * 90}ms"/>
    <text x="${W - 32}" y="${y + 13}" class="pct" text-anchor="end">${row.share.toFixed(1)}%</text>
  </g>`
  }).join('\n  ')
  const updated = new Date().toISOString().slice(0, 10)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Languages used across public repositories: ${rows.map((r) => `${escapeXml(r.name)} ${r.share.toFixed(1)}%`).join(', ')}">
  <style>
    .title { font: 600 20px ${FONT}; fill: ${TEXT}; }
    .label { font: 500 14px ${FONT}; fill: ${TEXT}; }
    .pct { font: 500 13px ${MONO}; fill: ${MUTED}; }
    .foot { font: 12px ${FONT}; fill: ${MUTED}; }
    .bar { transform-box: fill-box; transform-origin: left; animation: grow 900ms cubic-bezier(.2,.8,.2,1) both; }
    .row { animation: fade 500ms ease-out both; }
    @keyframes grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
    @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
    ${REDUCED_MOTION}
  </style>
  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="14" fill="${BG}" stroke="${BORDER}"/>
  <text x="32" y="46" class="title">Languages I've used</text>
  ${bars}
  <text x="32" y="${H - 18}" class="foot">Share of code across public repositories, updated ${updated}</text>
</svg>
`
}

function heroCard() {
  const W = 840, H = 230
  const pulse = 'M0 170 H250 l14 -8 l12 8 h22 l10 14 l18 -74 l20 96 l14 -36 h26 l14 -10 l14 10 H840'
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Miroslav, building full-stack apps with React and ASP.NET Core">
  <defs>
    <linearGradient id="fill" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0d1117"/><stop offset="1" stop-color="#10261a"/></linearGradient>
    <linearGradient id="line" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${ACCENT}" stop-opacity="0"/><stop offset=".35" stop-color="${ACCENT}"/><stop offset="1" stop-color="#58a6ff"/></linearGradient>
    <clipPath id="frame"><rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="14"/></clipPath>
  </defs>
  <style>
    .name { font: 700 44px ${FONT}; fill: ${TEXT}; }
    .tag { font: 18px ${FONT}; fill: ${MUTED}; }
    .prompt { font: 14px ${MONO}; fill: ${ACCENT}; }
    .pulse { fill: none; stroke: url(#line); stroke-width: 2.5; stroke-linejoin: round; stroke-dasharray: 1200; animation: draw 5s ease-in-out infinite; }
    @keyframes draw { 0% { stroke-dashoffset: 1200; } 55%, 100% { stroke-dashoffset: 0; } }
    ${REDUCED_MOTION}
  </style>
  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="14" fill="url(#fill)" stroke="${BORDER}"/>
  <text x="32" y="50" class="prompt">~/nitrodaxs $ whoami</text>
  <text x="32" y="100" class="name">Miroslav</text>
  <text x="32" y="132" class="tag">Building full-stack apps with React and ASP.NET Core, from Bulgaria</text>
  <g clip-path="url(#frame)"><path class="pulse" d="${pulse}"/></g>
</svg>
`
}

function stackCard() {
  const groups = [
    ['Languages', ['TypeScript', 'JavaScript', 'C#', 'PHP', 'SQL']],
    ['Frontend', ['React', 'Next.js', 'Vite', 'TanStack Query', 'Tailwind CSS']],
    ['Backend', ['ASP.NET Core', 'EF Core', 'Laravel']],
    ['Data & tools', ['PostgreSQL', 'SQL Server', 'Docker', 'Git']],
  ]
  const W = 840, top = 72, rowH = 46, chipH = 30, startX = 150
  const H = top + groups.length * rowH + 14
  const chips = groups.map(([label, items], g) => {
    const y = top + g * rowH
    let x = startX
    const parts = items.map((item) => {
      const w = Math.round(item.length * 7.6 + 26)
      const chip = `<rect x="${x}" y="${y}" width="${w}" height="${chipH}" rx="15" fill="#161b22" stroke="${BORDER}"/><text x="${x + w / 2}" y="${y + 20}" class="chip" text-anchor="middle">${escapeXml(item)}</text>`
      x += w + 8
      return chip
    }).join('')
    return `<text x="32" y="${y + 20}" class="label">${escapeXml(label)}</text>${parts}`
  }).join('\n  ')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Tech stack: ${groups.flatMap(([, items]) => items).map(escapeXml).join(', ')}">
  <style>
    .title { font: 600 20px ${FONT}; fill: ${TEXT}; }
    .label { font: 500 14px ${FONT}; fill: ${MUTED}; }
    .chip { font: 500 13px ${FONT}; fill: ${TEXT}; }
  </style>
  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="14" fill="${BG}" stroke="${BORDER}"/>
  <text x="32" y="46" class="title">Tech stack</text>
  ${chips}
</svg>
`
}

const rows = languageRows(await languageTotals())
mkdirSync(OUT, { recursive: true })
writeFileSync(new URL('hero.svg', OUT), heroCard())
writeFileSync(new URL('stack.svg', OUT), stackCard())
writeFileSync(new URL('languages.svg', OUT), languagesCard(rows))
console.log(rows.map((r) => `${r.name} ${r.share.toFixed(1)}%`).join(', '))
