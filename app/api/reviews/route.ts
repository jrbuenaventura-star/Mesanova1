import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const status = searchParams.get('status') || 'approved'

    if (!productId) {
      return NextResponse.json({ error: 'Product ID requerido' }, { status: 400 })
    }

    const { data: reviews, error } = await supabase
      .from('product_reviews')
      .select(`
        *,
        user:user_profiles(full_name)
      `)
      .eq('product_id', productId)
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ reviews })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json({ error: 'Error al obtener reviews' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { productId, rating, title, comment, orderId, images } = await request.json()

    if (!productId || !rating) {
      return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 })
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating debe estar entre 1 y 5' }, { status: 400 })
    }

    let verifiedPurchase = false
    if (orderId) {
      const { data: order } = await supabase
        .from('orders')
        .select('id')
        .eq('id', orderId)
        .eq('user_id', user.id)
        .single()
      
      verifiedPurchase = !!order
    }

    const { data: review, error } = await supabase
      .from('product_reviews')
      .insert({
        product_id: productId,
        user_id: user.id,
        rating,
        title,
        comment,
        order_id: orderId,
        verified_purchase: verifiedPurchase,
        images: images || null,
        status: 'approved',
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ review }, { status: 201 })
  } catch (error) {
    console.error('Error creating review:', error)
    return NextResponse.json({ error: 'Error al crear review' }, { status: 500 })
  }
}
