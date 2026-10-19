import { ImageResponse } from 'next/og';

export const size={width:180,height:180};
export const contentType='image/png';

export default function AppleIcon(){
  return new ImageResponse(
    <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',background:'#fffdf9',border:'8px solid #b79558',borderRadius:42,color:'#272320',fontSize:52,fontWeight:600,letterSpacing:'0.08em'}}>EVA</div>,
    size,
  );
}