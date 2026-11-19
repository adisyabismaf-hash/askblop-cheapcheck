import type { Register } from 'claude-code'

const DEFAULT_PATH = 'Apa itu Layer 2/1. Draft/00-naskah-lengkap.md'
const HANDLES = ['@AskBlop', '@askblop']
const SLOP = ['sangat penting untuk dicatat', 'di era digital', 'revolusioner', 'game changer', 'tidak hanya itu', 'mari kita selami', 'dalam dunia yang']

type Row = [ok: boolean, label: string, detail: string]

function audit(text: string): Row[] {
  const rows: Row[] = []
  const body = text.split(/\n---\n/)[0] ?? text
  const words = body.split(/\s+/).filter(Boolean).length
  rows.push([true, 'Jumlah kata (di atas garis ---)', String(words)])

  const urls: string[] = text.match(/https?:\/\/[^\s)]+/g) ?? []
  const dup = urls.filter((u, i) => urls.indexOf(u) !== i)
  rows.push([dup.length === 0, 'URL duplikat', dup.length ? [...new Set(dup)].join(', ') : 'tidak ada'])
  rows.push([urls.length === 0, 'URL di teks (harusnya tanda kurung nama situs)', urls.length ? String(urls.length) : 'tidak ada'])

  rows.push([HANDLES.every(h => text.includes(h)) || text.includes('@askblop'), 'Handle sosmed (YouTube/IG/TikTok)', text.includes('@askblop') ? 'ada' : 'HILANG'])
  rows.push([/bukan saran keuangan/i.test(text), 'Pengingat bukan saran keuangan', /bukan saran keuangan/i.test(text) ? 'ada' : 'HILANG'])
  rows.push([/angka.*bisa berubah/i.test(text), 'Catatan angka bisa berubah', /angka.*bisa berubah/i.test(text) ? 'ada' : 'HILANG'])

  const gambar = (text.match(/^>\s*Gambar:/gm) ?? []).length
  rows.push([gambar > 0, 'Caption "Gambar:"', String(gambar)])

  const dashes = (body.match(/—|–/g) ?? []).length
  rows.push([dashes === 0, 'Tanda pisah panjang (em/en dash)', String(dashes)])

  const slop = SLOP.filter(s => body.toLowerCase().includes(s))
  rows.push([slop.length === 0, 'Frasa khas AI', slop.length ? slop.join(', ') : 'tidak ada'])

  const lowerStart = body.split('\n').filter(l => /^[a-z]/.test(l.trim()) && /^[A-Za-z]/.test(l.trim()))
  rows.push([lowerStart.length === 0, 'Baris diawali huruf kecil (cek huruf awal terpotong)', String(lowerStart.length)])

  const pola = ['Pembuka', 'Blop bilang', 'Ide besar', 'Peta', 'Catatan jujur']
  const missing = pola.filter(p => !body.includes(p))
  rows.push([missing.length === 0, 'Pola bab lengkap', missing.length ? 'kurang: ' + missing.join(', ') : 'lengkap'])
  return rows
}

export const register: Register = (on) => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'blopcheck',
      description: 'Audit mekanis naskah Ask Blop (0 token). Tambah --haiku untuk review gaya murah.',
      argumentHint: '[path] [--haiku]',
    })
    return next(e)
  })

  on('command.run', { command: 'blopcheck' }, async ($, e) => {
    const useHaiku = /(^|\s)--haiku(\s|$)/.test(e.args)
    const path = e.args.replace(/--haiku/g, '').trim() || DEFAULT_PATH
    let text: string
    try {
      text = (await $.fs.read(path)) as string
    } catch {
      return { text: `File tidak ketemu: ${path}\nPakai: /blopcheck <path naskah>` }
    }

    const rows = audit(text)
    const fails = rows.filter(r => !r[0]).length
    const lines = rows.map(([ok, label, detail]) => `${ok ? 'OK  ' : 'CEK '} ${label}: ${detail}`)
    let out = `Audit mekanis (0 token): ${path}\n${lines.join('\n')}\n=> ${fails === 0 ? 'lolos' : fails + ' item perlu dicek'}`

    if (useHaiku) {
      const r = await $.model.complete({
        model: 'haiku',
        effort: 'low',
        maxTokens: 500,
        timeoutMs: 30000,
        system: 'Lu editor e-book crypto Gen Z Indonesia (gw/lu, santai, kalimat pendek). Jawab maksimal 5 butir singkat.',
        prompt: `Review naskah ini: nada konsisten gw/lu? ada kalimat kepanjangan? perumpamaan konsisten? klaim yang terlalu pasti?\n\n${text}`,
      })
      out += r.isAnswered
        ? `\n\nReview gaya (Haiku, ${r.usage.input_tokens} in / ${r.usage.output_tokens} out):\n${r.text}`
        : `\n\nHaiku tidak menjawab: ${r.reason}`
    }
    return { text: out, isTextDisplayOnly: true }
  })
}
