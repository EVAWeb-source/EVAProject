import type { MetadataRoute } from 'next';

export default function manifest():MetadataRoute.Manifest{
  return {
    name:'EVA | ایوا',
    short_name:'EVA',
    description:'بوتیک آنلاین طلای مدرن EVA',
    start_url:'/',
    display:'standalone',
    background_color:'#fffdf9',
    theme_color:'#272320',
    lang:'fa',
    dir:'rtl',
    icons:[{src:'/brand/eva-mark.webp',sizes:'any',type:'image/webp'}],
  };
}