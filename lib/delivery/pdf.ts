import "server-only"

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)")
}

function wrapText(value: string, maxChars = 92) {
  const words = value.trim().split(/\s+/)
  const lines: string[] = []
  let current = ""

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (candidate.length > maxChars) {
      if (current) {
        lines.push(current)
      }
      current = word
      continue
    }
    current = candidate
  }

  if (current) {
    lines.push(current)
  }

  return lines.length ? lines : [""]
}

function buildPdfDocument(content: string) {
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Count 1 /Kids [3 0 R] >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
    `5 0 obj << /Length ${Buffer.byteLength(content, "utf8")} >> stream\n${content}\nendstream endobj`,
  ]

  let body = ""
  const offsets: number[] = []
  for (const object of objects) {
    offsets.push(Buffer.byteLength(`%PDF-1.4\n${body}`, "utf8"))
    body += `${object}\n`
  }

  const xrefOffset = Buffer.byteLength(`%PDF-1.4\n${body}`, "utf8")
  let xref = "xref\n0 6\n0000000000 65535 f \n"
  for (const offset of offsets) {
    xref += `${String(offset).padStart(10, "0")} 00000 n \n`
  }

  const trailer = `trailer << /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  return Buffer.from(`%PDF-1.4\n${body}${xref}${trailer}`, "utf8")
}

export function createDeliveryEvidencePdf(input: {
  title: string
  lines: string[]
}) {
  const textLines = [input.title, "", ...input.lines.flatMap((line) => wrapText(line))]
  const safeLines = textLines.map(escapePdfText)

  const operations: string[] = ["BT", "/F1 10 Tf", "50 760 Td", "14 TL"]
  safeLines.forEach((line, index) => {
    operations.push(`(${line}) Tj`)
    if (index < safeLines.length - 1) {
      operations.push("T*")
    }
  })
  operations.push("ET")

  return buildPdfDocument(operations.join("\n"))
}
