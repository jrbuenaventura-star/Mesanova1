import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import sharp from "sharp"

const MAX_IMAGE_WIDTH = 1200
const IMAGE_QUALITY = 80

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const imageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    const videoTypes = ["video/mp4", "video/webm"]
    const isImage = imageTypes.includes(file.type)
    const isVideo = videoTypes.includes(file.type)

    if (!isImage && !isVideo) {
      return NextResponse.json({ error: "Invalid file type. Allowed: JPG, PNG, GIF, WebP, MP4, WebM" }, { status: 400 })
    }

    const timestamp = Date.now()
    const baseName = file.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9-_]/g, "-")

    if (isImage) {
      // Resize and optimize images
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      const image = sharp(buffer)
      const metadata = await image.metadata()

      let processed = image

      // Resize if wider than max width
      if (metadata.width && metadata.width > MAX_IMAGE_WIDTH) {
        processed = processed.resize(MAX_IMAGE_WIDTH, null, {
          withoutEnlargement: true,
          fit: "inside",
        })
      }

      // Convert to WebP for best size/quality ratio (except GIFs which may be animated)
      let outputBuffer: Buffer
      let outputExt: string
      let contentType: string

      if (file.type === "image/gif") {
        // Keep GIFs as-is (may be animated)
        outputBuffer = await processed.gif().toBuffer()
        outputExt = "gif"
        contentType = "image/gif"
      } else {
        outputBuffer = await processed.webp({ quality: IMAGE_QUALITY }).toBuffer()
        outputExt = "webp"
        contentType = "image/webp"
      }

      const filename = `blog/${timestamp}-${baseName}.${outputExt}`

      const blob = await put(filename, outputBuffer, {
        access: "public",
        contentType,
      })

      return NextResponse.json({
        url: blob.url,
        filename: `${baseName}.${outputExt}`,
        size: outputBuffer.length,
        originalSize: file.size,
        type: contentType,
        width: metadata.width && metadata.width > MAX_IMAGE_WIDTH ? MAX_IMAGE_WIDTH : metadata.width,
      })
    }

    // Videos: upload as-is
    const filename = `blog/${timestamp}-${baseName}${file.name.match(/\.[^.]+$/)?.[0] || ".mp4"}`
    const blob = await put(filename, file, {
      access: "public",
    })

    return NextResponse.json({
      url: blob.url,
      filename: file.name,
      size: file.size,
      type: file.type,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
