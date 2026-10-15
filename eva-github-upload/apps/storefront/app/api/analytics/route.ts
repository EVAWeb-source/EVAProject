import { NextRequest, NextResponse } from 'next/server';

const API_BASE=process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'https://eva-api-production-c864.up.railway.app';

export async function POST(request:NextRequest){
  try{
    const body=await request.json();
    const response=await fetch(`${API_BASE}/api/v1/analytics/events`,{
      method:'POST',
      headers:{'content-type':'application/json'},
      body:JSON.stringify(body),
      cache:'no-store',
    });
    if(!response.ok)return NextResponse.json({ok:false},{status:response.status});
    return NextResponse.json({ok:true});
  }catch{
    return NextResponse.json({ok:false},{status:400});
  }
}
