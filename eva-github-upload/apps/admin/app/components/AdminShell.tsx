'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import styles from './AdminShell.module.css';

const navGroups = [
  {
    label:'فروش',
    items:[
      { href:'/', label:'داشبورد', icon:'⌂', exact:true },
      { href:'/orders', label:'سفارش‌ها', icon:'≡' },
      { href:'/fulfillment', label:'ارسال', icon:'→' },
      { href:'/customers', label:'مشتری‌ها', icon:'◎' },
    ],
  },
  {
    label:'کاتالوگ',
    items:[
      { href:'/catalog', label:'محصولات', icon:'◇' },
      { href:'/catalog/collections', label:'کالکشن‌ها', icon:'◫' },
      { href:'/inventory', label:'موجودی', icon:'▦' },
      { href:'/catalog/content', label:'محتوا', icon:'✎' },
      { href:'/catalog/onboarding', label:'آماده‌سازی', icon:'✓' },
    ],
  },
  {
    label:'مالی',
    items:[
      { href:'/pricing', label:'قیمت‌گذاری', icon:'₮' },
      { href:'/invoices', label:'فاکتورها', icon:'▤' },
    ],
  },
  {
    label:'عملیات',
    items:[
      { href:'/after-sales', label:'لغو و مرجوعی', icon:'↺' },
      { href:'/notifications', label:'پیام‌ها', icon:'◌' },
      { href:'/audit', label:'تاریخچه', icon:'◷' },
      { href:'/backup', label:'پشتیبان', icon:'⇩' },
      { href:'/settings', label:'تنظیمات', icon:'⚙' },
    ],
  },
] as const;

type NavItem=(typeof navGroups)[number]['items'][number];

export default function AdminShell({children, connected=true}:{children:ReactNode; connected?:boolean}){
  const pathname=usePathname();
  const [open,setOpen]=useState(false);
  const active=(item:NavItem)=>{
    if('exact' in item&&item.exact)return pathname===item.href;
    if(item.href==='/catalog')return pathname==='/catalog'||pathname.startsWith('/catalog/products/');
    return pathname===item.href||pathname.startsWith(item.href+'/');
  };

  return <div className={styles.shell}>
    <aside className={`${styles.sidebar} ${open?styles.sidebarOpen:''}`}>
      <div className={styles.sideHead}>
        <a className={styles.logo} href="/">EVA<span>ADMIN</span></a>
        <button className={styles.close} onClick={()=>setOpen(false)} aria-label="بستن منو">×</button>
      </div>

      <nav className={styles.nav} aria-label="منوی مدیریت">
        {navGroups.map(group=><div className={styles.navGroup} key={group.label}>
          <span className={styles.groupLabel}>{group.label}</span>
          <div className={styles.groupItems}>{group.items.map(item=><a key={item.href} className={active(item)?styles.active:''} href={item.href} onClick={()=>setOpen(false)}><i>{item.icon}</i><span>{item.label}</span></a>)}</div>
        </div>)}
      </nav>

      <div className={styles.sideBottom}>
        <a className={styles.storeLink} href="https://evaproject-production.up.railway.app" target="_blank" rel="noreferrer">مشاهده فروشگاه <span>↗</span></a>
        <form action="/api/logout" method="post"><button>خروج از حساب</button></form>
      </div>
    </aside>

    {open&&<button className={styles.backdrop} onClick={()=>setOpen(false)} aria-label="بستن منو"/>}

    <div className={styles.main}>
      <header className={styles.topbar}>
        <div className={styles.mobileBrand}><button onClick={()=>setOpen(true)} aria-label="باز کردن منو">☰</button><a href="/">EVA ADMIN</a></div>
        <div className={styles.connection}><span className={connected?styles.dot:styles.dotError}/>{connected?'سیستم آنلاین':'بررسی اتصال'}</div>
        <div className={styles.topActions}><a className={styles.quickPrimary} href="/catalog/products/new">+ محصول جدید</a><a href="/orders">سفارش‌ها</a></div>
      </header>
      <main className={styles.content}>{children}</main>
    </div>
  </div>;
}
