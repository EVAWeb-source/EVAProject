import { ImageResponse } from 'next/og';

export const size={width:64,height:64};
export const contentType='image/png';

export default function Icon(){
  return new ImageResponse(
    <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',background:'#fffdf9',border:'3px solid #b79558',borderRadius:'50%',color:'#272320',fontSize:19,fontWeight:600,letterSpacing:'0.08em'}}>EVA</div>,
    size,
  );
}