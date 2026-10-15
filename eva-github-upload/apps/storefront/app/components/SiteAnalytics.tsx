'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

const SESSION_KEY='eva-site-session';

function sessionId(){
  let value=sessionStorage.getItem(SESSION_KEY);
  if(value)return value;
  value=globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  sessionStorage.setItem(SESSION_KEY,value);
  return value;
}

export default function SiteAnalytics(){
  const pathname=usePathname();

  useEffect(()=>{
    if(!pathname)return;
    const timer=window.setTimeout(()=>{
      try{
        const referrer=document.referrer ? new URL(document.referrer).origin : '';
        void fetch('/api/analytics',{
          method:'POST',
          headers:{'content-type':'application/json'},
          body:JSON.stringify({event:'PAGE_VIEW',sessionId:sessionId(),path:pathname,referrer}),
          keepalive:true,
        });
      }catch{}
    },180);
    return()=>window.clearTimeout(timer);
  },[pathname]);

  return null;
}
