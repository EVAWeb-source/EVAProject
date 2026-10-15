import { API_BASE } from './admin-data';

export type AnalyticsData={
  generatedAt:string;
  period:{days:number;start:string;end:string};
  summary:{
    revenueToman:number;netRevenueToman:number;orders:number;aovToman:number;refundsToman:number;
    sessions:number;pageViews:number;conversionRate:number;newCustomers:number;repeatCustomers:number;paymentSuccessRate:number;
  };
  changes:{revenue:number|null;netRevenue:number|null;orders:number|null;aov:number|null;sessions:number|null;pageViews:number|null;conversion:number|null;paymentSuccess:number|null};
  daily:Array<{date:string;revenueToman:number;orders:number;pageViews:number;sessions:number}>;
  financialBreakdown:{gold:number;making:number;profit:number;tax:number;stone:number};
  orderStatus:{paid:number;pending:number;cancelled:number;refunded:number;refundPending:number};
  fulfillment:Array<{status:string;count:number}>;
  inventory:{available:number;reserved:number;sold:number;attention:number;availableValueToman:number};
  funnel:Array<{key:string;label:string;count:number}>;
  topProducts:Array<{name:string;sku:string;quantity:number;revenueToman:number}>;
  topPages:Array<{path:string;views:number;sessions:number}>;
  siteTrackingSince:string|null;
};

export async function loadAnalytics(days=30):Promise<{data:AnalyticsData|null;error:string|null}>{
  const adminKey=process.env.ADMIN_API_KEY;
  if(!adminKey)return{data:null,error:'ADMIN_API_KEY برای سرویس پنل تنظیم نشده است.'};
  try{
    const response=await fetch(`${API_BASE}/api/v1/admin/analytics?days=${days}`,{cache:'no-store',headers:{'x-admin-key':adminKey}});
    if(!response.ok)return{data:null,error:`API تحلیل پاسخ ${response.status} داد.`};
    return{data:await response.json(),error:null};
  }catch{
    return{data:null,error:'دریافت اطلاعات تحلیل انجام نشد.'};
  }
}
