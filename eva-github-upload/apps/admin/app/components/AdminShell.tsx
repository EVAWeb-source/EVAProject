'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import styles from './AdminShell.module.css';

const nav = [
  { href:'/', label:'داشبورد', icon:'⌂', exact:true },
  { href:'/catalog', label:'کاتالوگ', icon:'◇' },
  { href:'/catalog/onboarding', label:'آماده‌سازی محصولات', icon:'✓' },
  { href:'/inventory', label:'موجودی و Unitها', icon:'▦' },
  { href:'/orders', label:'سفارش‌ها', icon:'≡' },
  { href:'/fulfillment', label:'آماده‌سازی و ارسال', icon:'→' },
  { href:'/invoices', label:'فاکتورها', icon:'▤' },
  { href:'/pricing', label:'قیمت‌گذاری', icon:'₮' },
  { href:'/notifications', label:'پیام‌ها', icon:'◌' },
  { href:'/settings', label:'تنظیمات', icon:'⚙' },
] as const;

export default function AdminShell({children, connected=true}:{children:ReactNode; connected?:boolean}){
  const pathname=usePathname();
  const [open,setOpen]=useState(false);
  const active=(item:(typeof nav)[number])=>{
    if('exact' in item&&item.exact)return pathname===item.href;
    if(item.href==='/catalog')return pathname==='/catalog'||pathname.startsWith('/catalog/products/');
    return pathname===item.href||pathname.startsWith(item.href+'/');
  };

  return <div className={styles.shell}>
    <aside className={`${styles.sidebar} ${open?styles.sidebarOpen:''}`}>
      <div className={styles.sideHead}><a className={styles.logo} href="/">EVA<span>ADMIN V2</span></a><button className={styles.close} onClick={()=>setOpen(false)} aria-label="بستن منو">×</button></div>
      <nav className={styles.nav}>{nav.map(item=><a key={item.href} className={active(item)?styles.active:''} href={item.href} onClick={()=>setOpen(false)}><i>{item.icon}</i><span>{item.label}</span></a>)}</nav>
      <div className={styles.sideBottom}><a className={styles.storeLink} href="https://evaproject-production.up.railway.app" target="_blank" rel="noreferrer">مشاهده فروشگاه ↗</a><form action="/api/logout" method="post"><button>خروج امن</button></form><small>EVA Commerce Administration<br/>نسخه عملیاتی V2</small></div>
    </aside>
    {open&&<button className={styles.backdrop} onClick={()=>setOpen(false)} aria-label="بستن منو"/>}
    <div className={styles.main}>
      <header className={styles.topbar}><div className={styles.mobileBrand}><button onClick={()=>setOpen(true)} aria-label="باز کردن منو">☰</button><a href="/">EVA ADMIN</a></div><div className={styles.connection}><span className={connected?styles.dot:styles.dotError}/>{connected?'متصل به دیتابیس':'نیاز به بررسی اتصال'}</div><div className={styles.topActions}><a href="/catalog/onboarding">+ محصول</a><a href="/orders">سفارش‌ها</a></div></header>
      <main className={styles.content}>{children}</main>
    </div>
  </div>;
}
