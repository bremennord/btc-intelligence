"use client";
import { useState, useEffect } from "react";
export default function Dashboard() {
  const [price, setPrice] = useState(97420);
  const [chg, setChg] = useState(1.92);
  const [tab, setTab] = useState("btc");
  const [gems, setGems] = useState([]);
  const [re, setRe] = useState([]);
  const [nar, setNar] = useState([]);
  const [online, setOnline] = useState(false);
  useEffect(() => {
    fetch("/api/bitcoin").then(r=>r.json()).then(d=>{if(d.success){setPrice(d.data.price);setChg(d.data.priceChangePct24h);}}).catch(()=>{});
    const t = setInterval(() => fetch("/api/bitcoin").then(r=>r.json()).then(d=>{if(d.success){setPrice(d.data.price);setChg(d.data.priceChangePct24h);}}).catch(()=>{}), 15000);
    fetch("http://localhost:8000/api/status").then(s=>{if(s.ok){setOnline(true);fetch("http://localhost:8000/api/crypto").then(r=>r.json()).then(d=>setGems(d.data||[])).catch(()=>{});fetch("http://localhost:8000/api/real-estate").then(r=>r.json()).then(d=>setRe(d.data||[])).catch(()=>{});fetch("http://localhost:8000/api/narratives").then(r=>r.json()).then(d=>setNar(d.data||[])).catch(()=>{});}}).catch(()=>{});
    return () => clearInterval(t);
  }, []);
  const f = (n) => "$"+Math.round(n).toLocaleString();
  return (
    <div style={{minHeight:"100vh",background:"#050508",color:"#e8eaf0",fontFamily:"system-ui"}}>
      <div style={{background:"#0a0b0f",borderBottom:"1px solid #1a1d27",padding:"12px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
        <div style={{fontSize:18,fontWeight:700}}>₿ BTC Intelligence</div>
        <div style={{fontSize:28,fontWeight:700,color:chg>=0?"#10b981":"#f43f5e"}}>{f(price)} <span style={{fontSize:14}}>{chg>0?"+":""}{chg.toFixed(2)}%</span></div>
        <div style={{fontSize:11,color:online?"#10b981":"#f43f5e"}}>{online?"Radar Online":"Radar Offline"}</div>
      </div>
      <div style={{maxWidth:1200,margin:"0 auto",padding:16}}>
        <div style={{display:"flex",gap:4,marginBottom:16,background:"#0a0b0f",padding:3,borderRadius:10,border:"1px solid #1a1d27"}}>
          {[["btc","Bitcoin"],["gems","Gems"],["re","Immobilien"],["nar","Narratives"]].map(([id,label]) =>
            <button key={id} onClick={()=>setTab(id)} style={{flex:1,padding:8,background:tab===id?"#0f1117":"transparent",border:tab===id?"1px solid #1a1d27":"1px solid transparent",borderRadius:7,color:tab===id?"#e8eaf0":"#4a5568",fontSize:12,cursor:"pointer"}}>{label}</button>
          )}
        </div>
        {tab==="btc" && <div style={{background:"#0f1117",border:"1px solid #1a1d27",borderRadius:12,padding:24,textAlign:"center"}}><div style={{fontSize:48,fontWeight:700,color:"#f59e0b"}}>{f(price)}</div><div style={{color:chg>=0?"#10b981":"#f43f5e",fontSize:18,marginTop:8}}>{chg>0?"+":""}{chg.toFixed(2)}% 24h</div><div style={{color:"#4a5568",fontSize:12,marginTop:8}}>Live via CoinGecko · Updates alle 15s</div></div>}
        {tab==="gems" && <div>{gems.length===0?<div style={{padding:20,background:"#0f1117",borderRadius:10,textAlign:"center",color:"#4a5568"}}>Backend starten für Gems</div>:gems.map((t,i)=><div key={i} style={{background:"#0f1117",border:"1px solid #1a1d27",borderRadius:10,padding:14,marginBottom:8}}><div style={{display:"flex",justifyContent:"space-between"}}><b>{t.token_name} ({t.token_symbol})</b><b style={{color:"#f59e0b"}}>{t.final_score}/100</b></div><a href={t.dexscreener_url} target="_blank" rel="noreferrer" style={{color:"#38bdf8",fontSize:11}}>DexScreener</a></div>)}</div>}
        {tab==="re" && <div>{re.map((l,i)=><div key={i} style={{background:"#0f1117",border:"1px solid #1a1d27",borderRadius:10,padding:14,marginBottom:8}}><div style={{display:"flex",justifyContent:"space-between"}}><b>{l.title}</b><b style={{color:"#10b981"}}>{l.opportunity_score}/100</b></div><div style={{fontSize:11,color:"#4a5568"}}>{l.location} · {l.distance_km}km · EUR{(l.price||0).toLocaleString()}</div></div>)}</div>}
        {tab==="nar" && <div>{nar.map((n,i)=><div key={i} style={{background:"#0f1117",border:"1px solid #1a1d27",borderRadius:10,padding:14,marginBottom:8}}><div style={{display:"flex",justifyContent:"space-between"}}><b>{n.name}</b><b style={{color:"#8b5cf6"}}>{n.acceleration_score}</b></div><div style={{fontSize:11,color:"#4a5568"}}>{n.description}</div></div>)}</div>}
      </div>
    </div>
  );
}