import styles from './AnalyticsVisuals.module.css';

type Daily={date:string;revenueToman:number;orders:number;pageViews:number;sessions:number};

const money=(value:number)=>new Intl.NumberFormat('fa-IR',{notation:'compact',maximumFractionDigits:1}).format(value);
const number=(value:number)=>new Intl.NumberFormat('fa-IR').format(value);
const dateLabel=(value:string)=>new Intl.DateTimeFormat('fa-IR',{month:'short',day:'numeric'}).format(new Date(`${value}T00:00:00Z`));

function points(values:number[],width=760,height=210,pad=18){
  const max=Math.max(...values,1);
  const min=Math.min(...values,0);
  const range=Math.max(max-min,1);
  return values.map((value,index)=>{
    const x=pad+(index*(width-pad*2))/Math.max(values.length-1,1);
    const y=height-pad-((value-min)/range)*(height-pad*2);
    return{x,y,value};
  });
}

export function RevenueTrend({data,compact=false}:{data:Daily[];compact?:boolean}){
  const values=data.map(item=>item.revenueToman);
  const pts=points(values,760,compact?150:220,18);
  const poly=pts.map(item=>`${item.x},${item.y}`).join(' ');
  const area=`18,${compact?132:202} ${poly} 742,${compact?132:202}`;
  const tickEvery=Math.max(1,Math.ceil(data.length/(compact?5:7)));
  return <div className={`${styles.chart} ${compact?styles.compact:''}`}>
    <svg viewBox={`0 0 760 ${compact?150:220}`} role="img" aria-label="روند فروش">
      <defs><linearGradient id={compact?'evaRevenueCompact':'evaRevenue'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="currentColor" stopOpacity=".16"/><stop offset="1" stopColor="currentColor" stopOpacity="0"/></linearGradient></defs>
      {[.25,.5,.75].map(r=><line key={r} x1="18" x2="742" y1={(compact?150:220)*r} y2={(compact?150:220)*r} className={styles.gridLine}/>)}
      <polygon points={area} fill={`url(#${compact?'evaRevenueCompact':'evaRevenue'})`} className={styles.area}/>
      <polyline points={poly} className={styles.line}/>
      {pts.map((point,index)=><circle key={index} cx={point.x} cy={point.y} r={compact?2.5:3.5} className={styles.point}><title>{`${dateLabel(data[index].date)} — ${money(point.value)} تومان`}</title></circle>)}
    </svg>
    <div className={styles.axis}>{data.map((item,index)=>index%tickEvery===0||index===data.length-1?<span key={item.date}>{dateLabel(item.date)}</span>:null)}</div>
  </div>;
}

export function TrafficTrend({data}:{data:Daily[]}){
  const values=data.map(item=>item.pageViews);
  const sessionValues=data.map(item=>item.sessions);
  const all=[...values,...sessionValues];
  const max=Math.max(...all,1);
  const map=(arr:number[])=>arr.map((value,index)=>({x:18+(index*724)/Math.max(arr.length-1,1),y:202-(value/max)*178}));
  const views=map(values),sessions=map(sessionValues);
  return <div className={styles.chart}>
    <div className={styles.legend}><span><i className={styles.legendPrimary}/>بازدید صفحه</span><span><i className={styles.legendMuted}/>Session</span></div>
    <svg viewBox="0 0 760 220" role="img" aria-label="روند بازدید سایت">
      {[55,110,165].map(y=><line key={y} x1="18" x2="742" y1={y} y2={y} className={styles.gridLine}/>)}
      <polyline points={views.map(p=>`${p.x},${p.y}`).join(' ')} className={styles.line}/>
      <polyline points={sessions.map(p=>`${p.x},${p.y}`).join(' ')} className={styles.lineSecondary}/>
    </svg>
    <div className={styles.axis}>{data.filter((_,index)=>index%Math.max(1,Math.ceil(data.length/7))===0||index===data.length-1).map(item=><span key={item.date}>{dateLabel(item.date)}</span>)}</div>
  </div>;
}

export function HorizontalBars({items,format='number'}:{items:Array<{label:string;value:number;sub?:string}>;format?:'number'|'money'}){
  const max=Math.max(...items.map(item=>item.value),1);
  return <div className={styles.bars}>{items.map((item,index)=><div className={styles.barRow} key={`${item.label}-${index}`}>
    <div className={styles.barMeta}><div><strong>{item.label}</strong>{item.sub&&<small dir="ltr">{item.sub}</small>}</div><b>{format==='money'?`${money(item.value)} تومان`:number(item.value)}</b></div>
    <div className={styles.track}><span style={{width:`${Math.max(3,(item.value/max)*100)}%`}}/></div>
  </div>)}</div>;
}

export function Funnel({items}:{items:Array<{key:string;label:string;count:number}>}){
  const max=Math.max(items[0]?.count??0,1);
  return <div className={styles.funnel}>{items.map((item,index)=>{
    const width=Math.max(20,(item.count/max)*100);
    const rate=index===0?100:(items[index-1]?.count?Math.min(100,(item.count/items[index-1].count)*100):0);
    return <div className={styles.funnelRow} key={item.key}><div className={styles.funnelLabel}><span>{item.label}</span><b>{number(item.count)}</b></div><div className={styles.funnelTrack}><span style={{width:`${width}%`}}/><i>{index===0?'شروع':`${new Intl.NumberFormat('fa-IR',{maximumFractionDigits:1}).format(rate)}٪ از مرحله قبل`}</i></div></div>;
  })}</div>;
}

export function Composition({items,centerLabel}:{items:Array<{label:string;value:number}>;centerLabel:string}){
  const total=items.reduce((sum,item)=>sum+item.value,0);
  const weights=items.map(item=>total?item.value/total:0);
  let cursor=0;
  const stops=weights.map((weight,index)=>{const start=cursor*100;cursor+=weight;return `var(--tone-${(index%5)+1}) ${start}% ${cursor*100}%`;}).join(', ');
  return <div className={styles.composition}><div className={styles.ring} style={{background:total?`conic-gradient(${stops})`:'#f0eeea'}}><div><b>{number(total)}</b><span>{centerLabel}</span></div></div><div className={styles.compositionLegend}>{items.map((item,index)=><div key={item.label}><i style={{background:`var(--tone-${(index%5)+1})`}}/><span>{item.label}</span><b>{number(item.value)}</b></div>)}</div></div>;
}
