// Updates the language table in README.md, using public, non-fork repos only.
import { readFileSync, writeFileSync } from 'node:fs'

const USER = 'NitroDaxs'
const README = new URL('../README.md', import.meta.url)
const LIMIT = 6

async function github(path) {
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': USER }
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  const res = await fetch(`https://api.github.com${path}`, { headers })
  if (!res.ok) throw new Error(`GitHub ${path} returned ${res.status}`)
  return res.json()
}

// This endpoint lists only public repos for any caller, so private work can't leak in.
const repos = await github(`/users/${USER}/repos?type=owner&per_page=100`)
const totals = {}
for (const repo of repos) {
  if (repo.fork || repo.private) continue
  const languages = await github(`/repos/${USER}/${repo.name}/languages`)
  for (const [name, bytes] of Object.entries(languages)) totals[name] = (totals[name] ?? 0) + bytes
}

const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1])
const sum = sorted.reduce((n, [, bytes]) => n + bytes, 0)
if (!sum) throw new Error('No language data found')

const rows = sorted.slice(0, LIMIT)
const rest = sorted.slice(LIMIT).reduce((n, [, bytes]) => n + bytes, 0)
if (rest) rows.push(['Other', rest])

const table = [
  '| Language | Share |',
  '| --- | --- |',
  ...rows.map(([name, bytes]) => `| ${name} | ${((bytes / sum) * 100).toFixed(1)}% |`),
].join('\n')

const readme = readFileSync(README, 'utf8').replace(/\r\n/g, '\n')
const pattern = /(<!-- languages:start -->\n)[\s\S]*?(<!-- languages:end -->)/
if (!pattern.test(readme)) throw new Error('Language markers not found in README.md')
writeFileSync(README, readme.replace(pattern, `$1\n${table}\n\n$2`))
console.log(table)
