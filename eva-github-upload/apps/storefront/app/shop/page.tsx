import ShopClient, { type ShopProduct } from './ShopClient';
import styles from './shop.module.css';

export const dynamic = 'force-dynamic';

async function getProducts(): Promise<ShopProduct[]> {
  const apiBase = process.env.API_URL ?? 'https://eva-api-production-c864.up.railway.app';
  const response = await fetch(apiBase + '/api/v1/products', { cache: 'no-store' });
  if (!response.ok) throw new Error('Failed to load EVA catalog: ' + response.status);
  return response.json();
}

export default async function ShopPage() {
  const products = await getProducts();
  return <main className={styles.page}><ShopClient products={products} /></main>;
}
