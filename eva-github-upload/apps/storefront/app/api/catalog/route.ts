import { NextResponse } from 'next/server';

const apiBase=process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'https://eva-api-production-c864.up.railway.app';

export async function GET(){
  try{
    const response=await fetch(apiBase + '/api/v1/products',{cache:'no-store'});
    const text=await response.text();
    return new NextResponse(text,{
      status:response.status,
      headers:{'content-type':response.headers.get('content-type')??'application/json'}
    });
  }catch{
    return NextResponse.json({message:'Catalog is unavailable'},{status:503});
  }
}
