const BLOCKED_TAGS = [
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "form",
  "input",
  "button",
  "select",
  "textarea",
  "meta",
  "link",
]

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export function sanitizeRichHtml(html: string) {
  let safe = html || ""

  for (const tag of BLOCKED_TAGS) {
    const pairedTag = new RegExp(`<${tag}[\\s\\S]*?>[\\s\\S]*?<\\/${tag}>`, "gi")
    const singleTag = new RegExp(`<${tag}[\\s\\S]*?\\/?>`, "gi")
    safe = safe.replace(pairedTag, "")
    safe = safe.replace(singleTag, "")
  }

  safe = safe.replace(/\son[a-z]+\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, "")
  safe = safe.replace(/\sstyle\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, "")
  safe = safe.replace(/\ssrcdoc\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, "")
  safe = safe.replace(/\s(href|src)\s*=\s*(['"])\s*javascript:[\s\S]*?\2/gi, ' $1="#"')
  safe = safe.replace(/\s(href|src)\s*=\s*(['"])\s*data:text\/html[\s\S]*?\2/gi, ' $1="#"')

  return safe
}

export function serializeJsonForScript(value: unknown) {
  return JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, (char) => {
    switch (char) {
      case "<":
        return "\\u003c"
      case ">":
        return "\\u003e"
      case "&":
        return "\\u0026"
      case "\u2028":
        return "\\u2028"
      case "\u2029":
        return "\\u2029"
      default:
        return char
    }
  })
}

export function sanitizeSearchTerm(value: string, maxLength = 100) {
  return value
    .replace(/[%(),]/g, " ")
    .replace(/[^\p{L}\p{N}\s._-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength)
}
