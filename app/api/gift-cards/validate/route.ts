import { createAdminClient } from '@/lib/supabase/admin'
import { enforceRateLimit, enforceSameOrigin } from '@/lib/security/api'
import { redactErrorMessage } from '@/lib/security/redact'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const sameOriginResponse = enforceSameOrigin(request)
    if (sameOriginResponse) return sameOriginResponse

    const rateLimitResponse = await enforceRateLimit(request, {
      bucket: "gift-cards-validate",
      limit: 30,
      windowMs: 60_000,
    })
    if (rateLimitResponse) return rateLimitResponse

    const supabase = createAdminClient()
    const { code } = await request.json()
    const normalizedCode = String(code || "")
      .trim()
      .toUpperCase()

    if (!normalizedCode) {
      return NextResponse.json({ error: 'Código de bono requerido' }, { status: 400 })
    }

    if (!/^GC-[A-Z0-9-]{8,32}$/.test(normalizedCode)) {
      return NextResponse.json({ error: 'Formato de bono inválido' }, { status: 400 })
    }

    const { data: giftCard, error: giftCardError } = await supabase
      .from('gift_cards')
      .select('*')
      .eq('code', normalizedCode)
      .single()

    if (giftCardError || !giftCard) {
      return NextResponse.json({ error: 'Bono no válido' }, { status: 404 })
    }

    if (giftCard.status !== 'active') {
      return NextResponse.json({ 
        error: giftCard.status === 'used' ? 'Bono ya utilizado completamente' : 'Bono no disponible' 
      }, { status: 400 })
    }

    if (giftCard.expires_at && new Date(giftCard.expires_at) < new Date()) {
      await supabase
        .from('gift_cards')
        .update({ status: 'expired' })
        .eq('id', giftCard.id)
      
      return NextResponse.json({ error: 'Bono expirado' }, { status: 400 })
    }

    if (giftCard.current_balance <= 0) {
      return NextResponse.json({ error: 'Bono sin saldo disponible' }, { status: 400 })
    }

    return NextResponse.json({
      valid: true,
      giftCard: {
        id: giftCard.id,
        code: giftCard.code,
        current_balance: giftCard.current_balance,
      },
    })
  } catch (error) {
    console.error('Error validating gift card:', redactErrorMessage(error))
    return NextResponse.json({ error: 'Error al validar bono' }, { status: 500 })
  }
}
