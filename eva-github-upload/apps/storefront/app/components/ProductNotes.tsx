import styles from './ProductNotes.module.css';

export default function ProductNotes({items}:{items:Array<[string,string]>}){
  if(!items.length)return null;
  return <section className={styles.section}>
    <div className={styles.heading}><span>MORE DETAILS</span><h2>جزئیات بیشتر</h2></div>
    <div className={styles.grid}>{items.map(([title,body])=><article key={title}><span>{title}</span><p>{body}</p></article>)}</div>
  </section>;
}
