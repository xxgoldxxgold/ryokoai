import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.action === 'track_click') {
      // In production, save to Supabase affiliate_clicks table
      console.log('Affiliate click:', {
        provider: body.provider,
        product_type: body.product_type,
        product_name: body.product_name,
        price: body.price,
        session_id: body.session_id,
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Plans API error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
