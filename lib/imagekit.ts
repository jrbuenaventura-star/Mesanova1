type ImageKitTransformOptions = {
  width?: number
  height?: number
  quality?: number
  format?: "auto" | "webp" | "avif" | "jpg" | "png"
}

function buildTransformParam(options: ImageKitTransformOptions) {
  const parts: string[] = []

  if (options.width) parts.push(`w-${options.width}`)
  if (options.height) parts.push(`h-${options.height}`)
  if (options.quality) parts.push(`q-${options.quality}`)

  if (options.format) {
    parts.push(`f-${options.format}`)
  } else {
    parts.push("f-auto")
  }

  return parts.join(",")
}

export function getImageKitUrl(originalUrl: string, options: ImageKitTransformOptions = {}) {
  const endpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT

  if (!endpoint) {
    return originalUrl
  }

  const base = endpoint.endsWith("/") ? endpoint.slice(0, -1) : endpoint

  // If the URL is already an ImageKit URL, return as-is.
  if (originalUrl.startsWith(base) || originalUrl.startsWith("https://ik.imagekit.io")) {
    return originalUrl
  }

  const transform = buildTransformParam(options)
  const joined = `${base}/${originalUrl}`

  if (!transform) return joined

  // Web proxy format supports transformations via query param.
  return joined.includes("?") ? `${joined}&tr=${transform}` : `${joined}?tr=${transform}`
}
