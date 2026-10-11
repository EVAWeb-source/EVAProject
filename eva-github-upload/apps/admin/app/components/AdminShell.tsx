'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
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
type GroupLabel=(typeof navGroups)[number]['label'];

function isItemActive(pathname:string,item:NavItem){
  if('exact' in item&&item.exact)return pathname===item.href;
  if(item.href==='/catalog')return pathname==='/catalog'||pathname.startsWith('/catalog/products/');
  return pathname===item.href||pathname.startsWith(item.href+'/');
}

function activeGroupForPath(pathname:string):GroupLabel{
  return navGroups.find(group=>group.items.some(item=>isItemActive(pathname,item)))?.label??'فروش';
}

export default function AdminShell({children, connected=true}:{children:ReactNode; connected?:boolean}){
  const pathname=usePathname();
  const [open,setOpen]=useState(false);
  const [expandedGroups,setExpandedGroups]=useState<Record<GroupLabel,boolean>>(()=>{
    const activeGroup=activeGroupForPath(pathname);
    return Object.fromEntries(navGroups.map(group=>[group.label,group.label===activeGroup])) as Record<GroupLabel,boolean>;
  });
  const active=(item:NavItem)=>isItemActive(pathname,item);

  useEffect(()=>{
    const saved=sessionStorage.getItem('eva-admin-nav-groups');
    if(saved){
      try{
        const parsed=JSON.parse(saved) as Partial<Record<GroupLabel,boolean>>;
        setExpandedGroups(current=>{
          const next={...current,...parsed};
          next[activeGroupForPath(pathname)]=true;
          return next;
        });
        return;
      }catch{}
    }
    setExpandedGroups(current=>({...current,[activeGroupForPath(pathname)]:true}));
  },[]);

  useEffect(()=>{
    const activeGroup=activeGroupForPath(pathname);
    setExpandedGroups(current=>{
      if(current[activeGroup])return current;
      const next={...current,[activeGroup]:true};
      sessionStorage.setItem('eva-admin-nav-groups',JSON.stringify(next));
      return next;
    });
  },[pathname]);

  function toggleGroup(label:GroupLabel){
    setExpandedGroups(current=>{
      const next={...current,[label]:!current[label]};
      sessionStorage.setItem('eva-admin-nav-groups',JSON.stringify(next));
      return next;
    });
  }

  return <div className={styles.shell}>
    <aside className={`${styles.sidebar} ${open?styles.sidebarOpen:''}`}>
      <div className={styles.sideHead}>
        <a className={styles.logo} href="/">EVA<span>ADMIN</span></a>
        <button className={styles.close} onClick={()=>setOpen(false)} aria-label="بستن منو">×</button>
      </div>

      <nav className={styles.nav} aria-label="منوی مدیریت">
        {navGroups.map(group=>{
          const expanded=expandedGroups[group.label];
          const groupHasActive=group.items.some(item=>active(item));
          return <div className={`${styles.navGroup} ${groupHasActive?styles.activeGroup:''}`} key={group.label}>
            <button
              type="button"
              className={styles.groupToggle}
              onClick={()=>toggleGroup(group.label)}
              aria-expanded={expanded}
            >
              <span>{group.label}</span>
              <i className={expanded?styles.chevronOpen:''}>⌄</i>
            </button>
            {expanded&&<div className={styles.groupItems}>{group.items.map(item=><a key={item.href} className={active(item)?styles.active:''} href={item.href} onClick={()=>setOpen(false)}><i>{item.icon}</i><span>{item.label}</span></a>)}</div>}
          </div>;
        })}
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
