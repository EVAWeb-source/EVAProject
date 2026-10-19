import { publicMetadata } from '../lib/seo';

export const metadata=publicMetadata({
  title:'حریم خصوصی | EVA',
  description:'سیاست حریم خصوصی EVA و نحوه استفاده از اطلاعات حساب، سفارش و داده‌های مرورگر.',
  path:'/privacy',
});

export default function PrivacyLayout({children}:{children:React.ReactNode}){return children;}