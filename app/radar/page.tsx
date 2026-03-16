'use client';
import { useState, useEffect, useCallback } from 'react';
const API = 'http://localhost:8000';
export default function Radar() {
  const [crypto, setCrypto] = useState([]);
  const [re, setRe] = useState([]);
  const [narratives, setNarratives] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [online, setOnline] = useState(false);
  const [tab, setTab] = useState('crypto');
  const [testSent, setTestSent] = useState(false);
  const [scanning, setScanning] = useState(false);
  const load = useCallback(async () => {
    try {
      const s = await fetch(API + '/api/status');
      if (!s.ok) { setOnline(false); return; }
      setOnline(true);
      const [c,r,n,a] = await Promise.all([fetch(API+'/api/crypto'),fetch(API+'/api/real-estate'),fetch(API+'/api/narratives'),fetch(API+'/api/alerts')]);
      if(c.ok){const d=await c.json();setCrypto(d.data||[]);}
      if(r.ok){const d=await r.json();setRe(d.data||[]);}
      if(n.ok){const d=await n.json();setNarratives(d.data||[]);}
      if(a.ok){const d=await a.json();setAlerts(d.data||[]);}
    } catch(e) { setOnline(false); }
  }, []);
  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);
  const testAlert = async () => { await fetch(API+'/api/test-alert',{method:'POST'}); setTestSent(true); setTimeout(()=>setTestSent(false),3000); };
  const scanNow = async () => { setScanning(true); await fetch(API+'/api/scan/crypto',{method:'POST'}); await load(); setScanning(false); };
  const tabs = [{id:'crypto',label:'Crypto',count:crypto.length},{id:'re',label:'Immobilien',count:re.length},{id:'narratives',label:'Narratives',count:narratives.length},{id:'alerts',label:'Alerts',count:alerts.length}];
  return (
    <div style={{minHeight:'100vh',background:'#050508',color:'#e8eaf0',padding:20,fontFamily:'system-ui,sans-serif'}}>
      <div style={{maxWidth:1100,margin:'0 auto'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24,borderBottom:'1px solid #1a1d27',paddingBottom:16,flexWrap:'wrap',gap:12}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{width:44,height:44,borderRadius:10,background:'linear-gradient(135deg,#f59e0b,#8b5cf6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22}}>🎯</div>
            <div><div style={{fontSize:20,fontWeight:700}}>Opportunity Radar</div><div style={{fontSize:12,color:'#4a5568'}}>Gem Scanner · Immobilien · Narratives</div></div>
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <div style={{display:'flex',alignItems:'center',gap:6,padding:'4px 12px',background:'#0f1117',border:'1px solid #1a1d27',borderRadius:8}}>
              <div style={{width:8,height:8,borderRadius:'50%',background:online?'#10b981':'#f43f5e'}}/>
              <span style={{fontSize:11,color:'#8892a4'}}>{online?'Online':'Offline'}</span>
            </div>
            <button onClick={testAlert} style={{padding:'6px 12px',background:'#1a1d27',border:'1px solid #252836',borderRadius:6,color:testSent?'#10b981':'#8892a4',fontSize:11,cursor:'pointer'}}>{testSent?'Gesendet!':'Test Alert'}</button>
            <a href="/" style={{padding:'6px 12px',background:'#f59e0b18',border:'1px solid #f59e0b30',borderRadius:6,color:'#f59e0b',fontSize:11,textDecoration:'none'}}>BTC Dashboard</a>
          </div>
        </div>
        {!online&&<div style={{background:'#f43f5e18',border:'1px solid #f43f5e30',borderRadius:8,padding:12,marginBottom:16,fontSize:13,color:'#f43f5e'}}>Backend offline: cd ~/Desktop/opportunity-radar && python3 main.py</div>}
        <div style={{display:'flex',gap:4,marginBottom:16,background:'#0a0b0f',padding:4,borderRadius:10,border:'1px solid #1a1d27'}}>
          {tabs.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:'8px 4px',background:tab===t.id?'#0f1117':'transparent',border:tab===t.id?'1px solid #1a1d27':'1px solid transparent',borderRadius:7,color:tab===t.id?'#e8eaf0':'#4a5568',fontSize:12,cursor:'pointer',fontWeight:tab===t.id?600:400}}>{t.label} <span style={{fontSize:10,background:'#1a1d27',padding:'0 5px',borderRadius:3}}>{t.count}</span></button>)}
        </div>
        <div style={{background:'#0f1117',border:'1px solid #1a1d27',borderRadius:12,padding:16}}>
          {tab==='crypto'&&<div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <span style={{fontSize:14,fontWeight:600,color:'#f59e0b'}}>Top 3 Solana Gems</span>
              <button onClick={scanNow} disabled={scanning} style={{padding:'6px 14px',background:'#f59e0b18',border:'1px solid #f59e0b30',borderRadius:6,color:'#f59e0b',fontSize:11,cursor:'pointer'}}>{scanning?'Scannt...':'Jetzt scannen'}</button>
            </div>
            {crypto.length===0&&<div style={{color:'#4a5568',fontSize:13,padding:20,background:'#0a0b0f',borderRadius:8,textAlign:'center'}}>Keine Gems. Klicke Jetzt scannen.</div>}
            {crypto.map((t,i)=>{
              const sc=t.final_score>=70?'#10b981':t.final_score>=50?'#f59e0b':'#f43f5e';
              const rc=t.rug_risk_score>60?'#f43f5e':t.rug_risk_score>30?'#f59e0b':'#10b981';
              const age=t.age_minutes<60?t.age_minutes+'min':(t.age_minutes/60).toFixed(1)+'h';
              return <div key={i} style={{background:'#0a0b0f',border:'1px solid #1a1d27',borderRadius:10,padding:14,marginBottom:12,borderLeft:'3px solid '+sc}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                  <div><div style={{fontSize:15,fontWeight:700}}>#{i+1} {t.token_name} ({t.token_symbol})</div><div style={{fontSize:11,color:'#4a5568'}}>{age} · Buys: {t.buys_1h||0} · Sells: {t.sells_1h||0}</div></div>
                  <div style={{textAlign:'right'}}><div style={{fontSize:26,fontWeight:700,color:sc}}>{t.final_score}</div><div style={{fontSize:9,color:'#4a5568'}}>GEM SCORE</div></div>
                </div>
                {t.reasons&&<div style={{fontSize:11,color:'#38bdf8',marginBottom:8,background:'#0f1117',padding:'6px 10px',borderRadius:6}}>{t.reasons}</div>}
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6,marginBottom:8}}>
                  {[['5min',((t.price_change_5m||0)>0?'+':'')+(t.price_change_5m||0).toFixed(1)+'%',(t.price_change_5m||0)>=0?'#10b981':'#f43f5e'],['1h',((t.price_change_1h||0)>0?'+':'')+(t.price_change_1h||0).toFixed(1)+'%',(t.price_change_1h||0)>=0?'#10b981':'#f43f5e'],['Liq','$'+(t.liquidity_usd>=1000?(t.liquidity_usd/1000).toFixed(0)+'K':t.liquidity_usd.toFixed(0)),'#8892a4'],['MC',t.market_cap>0?'$'+(t.market_cap>=1000000?(t.market_cap/1000000).toFixed(1)+'M':t.market_cap>=1000?(t.market_cap/1000).toFixed(0)+'K':t.market_cap.toFixed(0)):'?','#8892a4']].map(([l,v,c])=><div key={l} style={{background:'#0f1117',borderRadius:6,padding:'6px 4px',textAlign:'center'}}><div style={{fontSize:9,color:'#4a5568'}}>{l}</div><div style={{fontSize:12,fontWeight:700,color:c}}>{v}</div></div>)}
                </div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontSize:10,background:rc+'18',color:rc,padding:'2px 8px',borderRadius:4}}>{t.rug_risk_score>60?'HIGH RUG RISK':t.rug_risk_score>30?'MEDIUM RISK':'LOW RISK'}</span>
                  <a href={t.dexscreener_url} target="_blank" rel="noreferrer" style={{fontSize:12,color:'#38bdf8',textDecoration:'none',fontWeight:600}}>DexScreener</a>
                </div>
              </div>;
            })}
          </div>}
          {tab==='re'&&<div>
            <div style={{fontSize:14,fontWeight:600,marginBottom:16,color:'#10b981'}}>Immobilien 25km Schriesheim</div>
            {re.map((l,i)=><div key={i} style={{background:'#0a0b0f',border:'1px solid #1a1d27',borderRadius:10,padding:12,marginBottom:8,borderLeft:'3px solid '+(l.is_undervalued?'#10b981':'#94a3b8')}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                <div><div style={{fontSize:13,fontWeight:600}}>{l.title}</div><div style={{fontSize:11,color:'#4a5568'}}>{l.location} {l.distance_km}km</div></div>
                <div style={{fontSize:18,fontWeight:700,color:l.is_undervalued?'#10b981':'#94a3b8'}}>{l.opportunity_score}/100</div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6}}>
                {[['Preis','€'+(l.price||0).toLocaleString()],['Größe',(l.size_sqm||0)+'m²'],['€/m²','€'+(l.price_per_sqm||0).toFixed(0)]].map(([label,val])=><div key={label} style={{background:'#0f1117',borderRadius:6,padding:6,textAlign:'center'}}><div style={{fontSize:9,color:'#4a5568'}}>{label}</div><div style={{fontSize:12,fontWeight:600}}>{val}</div></div>)}
              </div>
              {l.is_undervalued&&<div style={{fontSize:11,color:'#10b981',marginTop:6}}>Unter Durchschnitt</div>}
            </div>)}
          </div>}
          {tab==='narratives'&&<div>
            <div style={{fontSize:14,fontWeight:600,marginBottom:16,color:'#8b5cf6'}}>Emerging Narratives</div>
            {narratives.map((n,i)=><div key={i} style={{background:'#0a0b0f',border:'1px solid #1a1d27',borderRadius:8,padding:10,marginBottom:8}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span style={{fontSize:13,fontWeight:600}}>{n.name}</span><span style={{fontSize:18,fontWeight:700,color:n.acceleration_score>=70?'#10b981':n.acceleration_score>=40?'#f59e0b':'#94a3b8'}}>{n.acceleration_score}</span></div>
              <div style={{fontSize:11,color:'#4a5568',marginBottom:4}}>{n.description}</div>
              <div style={{height:3,background:'#1a1d27',borderRadius:2}}><div style={{height:'100%',width:n.acceleration_score+'%',background:'#8b5cf6',borderRadius:2}}/></div>
            </div>)}
          </div>}
          {tab==='alerts'&&<div>
            <div style={{fontSize:14,fontWeight:600,marginBottom:16,color:'#38bdf8'}}>Telegram Alerts</div>
            {alerts.length===0&&<div style={{color:'#4a5568',fontSize:13}}>Noch keine Alerts</div>}
            {alerts.map((a,i)=><div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 8px',background:'#0a0b0f',borderRadius:6,marginBottom:4}}>
              <div style={{width:6,height:6,borderRadius:'50%',background:a.success?'#10b981':'#f43f5e'}}/>
              <span style={{fontSize:11,color:'#8892a4',flex:1}}>{a.title}</span>
              <span style={{fontSize:10,color:'#4a5568'}}>{new Date(a.sent_at).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})}</span>
            </div>)}
          </div>}
        </div>
      </div>
    </div>
  );
}
