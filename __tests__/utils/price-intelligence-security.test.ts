import {
  buildMesanovaPricePromptContext,
  normalizeAndValidateSourceUrl,
  sanitizeModelOutputForStorage,
  sanitizePromptField,
} from "@/lib/price-intelligence/security"

describe("price-intelligence security helpers", () => {
  it("sanitizes prompt fields and removes dangerous characters", () => {
    const value = sanitizePromptField("  <script>alert(1)</script>\n\nSKU-123  ", 32)
    expect(value).not.toContain("<")
    expect(value).not.toContain(">")
    expect(value).not.toContain("\n")
    expect(value.length).toBeLessThanOrEqual(32)
  })

  it("builds a non-empty price prompt context", () => {
    const context = buildMesanovaPricePromptContext(12345)
    expect(typeof context).toBe("string")
    expect(context.length).toBeGreaterThan(0)
  })

  it("accepts only safe source urls", () => {
    expect(normalizeAndValidateSourceUrl("javascript:alert(1)")).toBeUndefined()
    expect(normalizeAndValidateSourceUrl("ftp://evil.com/payload")).toBeUndefined()
    expect(normalizeAndValidateSourceUrl("https://127.0.0.1/private")).toBeUndefined()
    expect(normalizeAndValidateSourceUrl("https://localhost/internal")).toBeUndefined()
    expect(normalizeAndValidateSourceUrl("https://example.com/path#fragment")).toBe(
      "https://example.com/path"
    )
  })

  it("redacts sensitive tokens in stored model output", () => {
    const raw =
      "Contacto: maria.garcia@company.co, telefono +57 300 123 4567. Texto largo para guardar."
    const sanitized = sanitizeModelOutputForStorage(raw, 500)
    expect(sanitized).toContain("[redacted_email]")
    expect(sanitized).toContain("[redacted_phone]")
    expect(sanitized).not.toContain("maria.garcia@company.co")
  })
})
