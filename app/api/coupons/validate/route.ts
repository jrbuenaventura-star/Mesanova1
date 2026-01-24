import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { code, cartTotal, userId, productIds } = await request.json()

    if (!code) {
      return NextResponse.json({ error: 'Código de cupón requerido' }, { status: 400 })
    }

    const { data: coupon, error: couponError } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .single()

    if (couponError || !coupon) {
      return NextResponse.json({ error: 'Cupón no válido' }, { status: 404 })
    }

    if (coupon.status !== 'active') {
      return NextResponse.json({ error: 'Cupón inactivo o expirado' }, { status: 400 })
    }

    const now = new Date()
    if (coupon.valid_from && new Date(coupon.valid_from) > now) {
      return NextResponse.json({ error: 'Cupón aún no válido' }, { status: 400 })
    }

    if (coupon.valid_until && new Date(coupon.valid_until) < now) {
      return NextResponse.json({ error: 'Cupón expirado' }, { status: 400 })
    }

    if (cartTotal < coupon.min_purchase_amount) {
      return NextResponse.json({ 
        error: `Compra mínima de $${coupon.min_purchase_amount.toLocaleString('es-CO')} requerida` 
      }, { status: 400 })
    }

    if (coupon.max_uses) {
      const { count } = await supabase
        .from('coupon_usages')
        .select('*', { count: 'exact', head: true })
        .eq('coupon_id', coupon.id)

      if (count && count >= coupon.max_uses) {
        return NextResponse.json({ error: 'Cupón agotado' }, { status: 400 })
      }
    }

    if (userId && coupon.max_uses_per_user) {
      const { count } = await supabase
        .from('coupon_usages')
        .select('*', { count: 'exact', head: true })
        .eq('coupon_id', coupon.id)
        .eq('user_id', userId)

      if (count && count >= coupon.max_uses_per_user) {
        return NextResponse.json({ error: 'Ya usaste este cupón el máximo de veces permitido' }, { status: 400 })
      }
    }

    if (coupon.applicable_to === 'specific_products' && productIds) {
      const applicableIds = coupon.applicable_product_ids || []
      const hasApplicableProduct = productIds.some((id: string) => applicableIds.includes(id))
      if (!hasApplicableProduct) {
        return NextResponse.json({ error: 'Cupón no aplicable a los productos en tu carrito' }, { status: 400 })
      }
    }

    let discountAmount = 0
    if (coupon.discount_type === 'percentage') {
      discountAmount = (cartTotal * coupon.discount_value) / 100
      if (coupon.max_discount_amount && discountAmount > coupon.max_discount_amount) {
        discountAmount = coupon.max_discount_amount
      }
    } else if (coupon.discount_type === 'fixed_amount') {
      discountAmount = Math.min(coupon.discount_value, cartTotal)
    }

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        name: coupon.name,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        discount_amount: discountAmount,
      },
    })
  } catch (error) {
    console.error('Error validating coupon:', error)
    return NextResponse.json({ error: 'Error al validar cupón' }, { status: 500 })
  }
}
