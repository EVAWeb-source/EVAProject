import { ImageResponse } from 'next/og';

export const alt='EVA Fine Jewelry';
export const size={width:1200,height:630};
export const contentType='image/png';

export default function OpenGraphImage(){
  return new ImageResponse(
    <div style={{width:'100%',height:'100%',display:'flex',position:'relative',alignItems:'center',justifyContent:'center',background:'#f7f1e8',color:'#272320'}}>
      <div style={{position:'absolute',width:430,height:430,border:'2px solid rgba(183,149,88,.42)',borderRadius:'50%'}}/>
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:22}}>
        <div style={{fontSize:112,fontWeight:500,letterSpacing:'0.16em'}}>EVA</div>
        <div style={{width:70,height:2,background:'#b79558'}}/>
        <div style={{fontSize:28,letterSpacing:'0.18em',color:'#746b63'}}>FINE JEWELRY</div>
      </div>
    </div>,
    size,
  );
}