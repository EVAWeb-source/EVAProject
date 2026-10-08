import styles from './ProductNotes.module.css';

export default function ProductNotes({items}:{items:Array<[string,string]>}){
  if(!items.length)return null;
  return <section className={styles.section}>
    <div className={styles.heading}><span>MORE DETAILS</span><h2>جزئیات بیشتر</h2><p>اطلاعات فنی، نگهداری و بسته‌بندی را در صورت نیاز باز کن.</p></div>
    <div className={styles.grid}>{items.map(([title,body])=><details className={styles.item} key={title}><summary><span>{title}</span><i aria-hidden="true">+</i></summary><p>{body}</p></details>)}</div>
  </section>;
}
