'use client';

import { useState } from 'react';
import HomeContentManager from './HomeContentManager';
import SiteMediaManager from './SiteMediaManager';
import styles from './MediaWorkspace.module.css';

type Tab='images'|'content';

export default function MediaWorkspace(){
  const [tab,setTab]=useState<Tab>('images');

  return <div className={styles.workspace}>
    <div className={styles.tabs} role="tablist" aria-label="مدیریت رسانه‌ها">
      <button
        type="button"
        role="tab"
        aria-selected={tab==='images'}
        className={tab==='images'?styles.active:''}
        onClick={()=>setTab('images')}
      >
        تصاویر
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={tab==='content'}
        className={tab==='content'?styles.active:''}
        onClick={()=>setTab('content')}
      >
        محتوا
      </button>
    </div>

    <div className={styles.tabBody} role="tabpanel">
      {tab==='images'?<SiteMediaManager view="slots"/>:<HomeContentManager/>}
    </div>
  </div>;
}
