import type { ReactNode } from 'react';
import styles from './AdminPageHeader.module.css';

export default function AdminPageHeader({eyebrow,title,description,meta,actions}:{eyebrow:string;title:string;description?:string;meta?:string;actions?:ReactNode}){
  return <header className={styles.head}>
    <div><span>{eyebrow}</span><h1>{title}</h1>{description&&<p>{description}</p>}</div>
    <div className={styles.aside}>{meta&&<small>{meta}</small>}{actions&&<div className={styles.actions}>{actions}</div>}</div>
  </header>;
}
