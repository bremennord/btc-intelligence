/* eslint-disable */
/* eslint-disable react/no-unescaped-entities */
'use client';
import { useState, useEffect, useCallback, useRef, memo } from 'react';

/* ═══════════════════════════════════════════════════════════
   RETIREMENT CALCULATOR
   - memo() prevents ANY re-render from parent
   - fetches BTC price once on mount, frozen forever
   - inputs stay stable until manual page reload
═══════════════════════════════════════════════════════════ */
const RetirementCalculator = memo(function RetirementCalculator() {
  const [price,   setPrice]   = useState<number | null>(null);
  const [btc,     setBtc]     = useState('1.0');
  const [monthly, setMonthly] = useState('3000');
  const [growth,  setGrowth]  = useState('20');
  const [inf,     setInf]     = useState('3');
  const [scen,    setScen]    = useState('base');
  const [showTL,  setShowTL]  = useState(false);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    fetch('/api/bitcoin')
      .then(r => r.json())
      .then(d => setPrice(d?.success ? d.data.price : 83000))
      .catch(() => setPrice(83000));
  }, []);

  const p = price ?? 83000;

  const results = (() => {
    const b  = Math.max(0,    parseFloat(btc)     || 0);
    const m  = Math.max(1,    parseFloat(monthly) || 3000);
    const g0 = Math.max(0.01, parseFloat(growth)  || 20) / 100;
    const i  = Math.max(0,    parseFloat(inf)      || 3)  / 100;
    const portfolio = b * p;

    return [
      { key:'bear', label:'Bear', emoji:'🐻', color:'#ef4444', g: g0 * 0.3  },
      { key:'base', label:'Base', emoji:'⚖️', color:'#f59e0b', g: g0        },
      { key:'bull', label:'Bull', emoji:'🐂', color:'#22c55e', g: g0 * 2.0  },
    ].map(s => {
      const realG  = Math.max(0.001, s.g - i);
      const needed = (m * 12) / realG;
      let years = '0';
      if (portfolio < needed) {
        if (s.g <= i) years = '∞';
        else {
          const n = Math.log(needed / portfolio) / Math.log(1 + s.g);
          years = n > 60 ? '60+' : n.toFixed(1);
        }
      }
      const y = parseFloat(years) || 0;
      const portAtRetire = portfolio * Math.pow(1 + s.g, y);
      const monthlyThen  = (portAtRetire * realG) / 12;
      const tl = Array.from({ length: Math.min(11, Math.ceil(y) + 1) }, (_, i) => ({
        year: i, usd: Math.round(portfolio * Math.pow(1 + s.g, i)),
      }));
      return { ...s, years, needed, portfolio, portAtRetire: Math.round(portAtRetire), monthlyThen: Math.round(monthlyThen), tl, retired: portfolio >= needed };
    });
  })();

  const active = results.find(r => r.key === scen) || results[1];
  const g0val  = parseFloat(growth) || 20;
  const activeG = scen === 'bear' ? Math.round(g0val * 0.3) : scen === 'base' ? g0val : Math.round(g0val * 2);
  const pct = Math.min(100, active.portfolio / active.needed * 100);
  const fmt = (n: number) => '$' + Math.round(n).toLocaleString('en-US');

  if (!price) return (
    <div style={{ padding: 60, textAlign: 'center' }}>
      <div style={{ width: 32, height: 32, border: '3px solid #f59e0b', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
      <div style={{ color: '#4a5568', fontSize: 14 }}>Lade BTC Preis...</div>
    </div>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px,320px) 1fr', gap: 24 }}>
      {/* INPUTS */}
      <div style={{ background: '#0d0f18', border: '1px solid #1e2235', borderRadius: 14, padding: 24 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#3d4460', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 24 }}>Eingaben</div>

        {[
          { label: 'Bitcoin Menge', val: btc, set: setBtc, unit: 'BTC', color: '#f59e0b', step: '0.1', hint: `≈ ${fmt(parseFloat(btc || '0') * p)}` },
          { label: 'Monatliche Ausgaben', val: monthly, set: setMonthly, unit: '$/Mo', color: '#e2e8f0', step: '100', hint: 'Mehr Ausgaben = mehr Jahre bis Rente' },
          { label: 'Inflation p.a.', val: inf, set: setInf, unit: '%', color: '#e2e8f0', step: '0.5', hint: '' },
        ].map(f => (
          <div key={f.label} style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 6, fontWeight: 500 }}>{f.label}</label>
            <div style={{ display: 'flex', alignItems: 'center', background: '#080a12', border: '1px solid #1e2235', borderRadius: 9, padding: '0 14px', transition: 'border-color 0.2s' }}>
              <input type="number" value={f.val} onChange={e => f.set(e.target.value)} step={f.step}
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: f.color, fontSize: 20, fontWeight: 700, padding: '11px 0', width: '100%' }} />
              <span style={{ color: '#3d4460', fontSize: 12 }}>{f.unit}</span>
            </div>
            {f.hint && <div style={{ fontSize: 10, color: '#3d4460', marginTop: 4 }}>{f.hint}</div>}
          </div>
        ))}

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 6, fontWeight: 500 }}>BTC Wachstum p.a.</label>
          <div style={{ display: 'flex', gap: 5, marginBottom: 8 }}>
            {[['10', 'Konservativ'], ['20', 'Moderat'], ['40', 'Optimistisch']].map(([v, l]) => (
              <button key={v} onClick={() => setGrowth(v)} style={{ flex: 1, padding: '6px 0', background: growth === v ? '#f59e0b15' : '#080a12', border: '1px solid ' + (growth === v ? '#f59e0b50' : '#1e2235'), borderRadius: 7, color: growth === v ? '#f59e0b' : '#3d4460', fontSize: 10, cursor: 'pointer', fontWeight: growth === v ? 700 : 400, transition: 'all 0.2s' }}>{v}%</button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', background: '#080a12', border: '1px solid #1e2235', borderRadius: 9, padding: '0 14px' }}>
            <input type="number" value={growth} onChange={e => setGrowth(e.target.value)} step="1"
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#e2e8f0', fontSize: 20, fontWeight: 700, padding: '11px 0' }} />
            <span style={{ color: '#3d4460', fontSize: 12 }}>% p.a.</span>
          </div>
        </div>

        <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 8, fontWeight: 500 }}>Szenario</label>
        <div style={{ display: 'flex', gap: 6 }}>
          {results.map(r => (
            <button key={r.key} onClick={() => setScen(r.key)} style={{ flex: 1, padding: '10px 4px', background: scen === r.key ? r.color + '15' : '#080a12', border: '1px solid ' + (scen === r.key ? r.color + '50' : '#1e2235'), borderRadius: 9, color: scen === r.key ? r.color : '#3d4460', fontSize: 11, cursor: 'pointer', fontWeight: scen === r.key ? 700 : 400, transition: 'all 0.2s' }}>{r.emoji} {r.label}</button>
          ))}
        </div>
      </div>

      {/* RESULTS */}
      <div>
        <div style={{ background: active.color + '08', border: '1px solid ' + active.color + '25', borderRadius: 14, padding: 28, marginBottom: 14 }}>
          {active.retired ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 52 }}>🎉</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#22c55e', marginTop: 8 }}>Du kannst JETZT in Rente!</div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>Dein Portfolio deckt bereits deine monatlichen Ausgaben dauerhaft.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
              <div>
                <div style={{ fontSize: 11, color: active.color, fontWeight: 600, letterSpacing: '0.5px', marginBottom: 8 }}>{active.emoji} {active.label} Case · BTC +{activeG}% p.a.</div>
                <div style={{ fontSize: 80, fontWeight: 900, color: active.color, lineHeight: 1, letterSpacing: '-4px' }}>{active.years}</div>
                <div style={{ fontSize: 18, color: active.color, marginTop: 6, fontWeight: 500 }}>Jahre bis zur Rente</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 10 }}>Bei <strong style={{ color: active.color }}>{fmt(parseFloat(monthly) || 3000)}</strong>/Monat Ausgaben</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, minWidth: 240 }}>
                {[
                  ['Portfolio heute', fmt(active.portfolio)],
                  ['Rentenziel', fmt(active.needed)],
                  ['Portfolio bei Rente', fmt(active.portAtRetire)],
                  ['Monatl. Einkommen', fmt(active.monthlyThen) + '/Mo'],
                ].map(([l, v]) => (
                  <div key={l} style={{ background: '#0d0f18', borderRadius: 9, padding: '10px 14px', border: '1px solid #1e2235' }}>
                    <div style={{ fontSize: 10, color: '#3d4460', marginBottom: 3 }}>{l}</div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {!active.retired && (
            <div style={{ marginTop: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 10, color: '#3d4460' }}>{fmt(active.portfolio)}</span>
                <span style={{ fontSize: 10, color: active.color, fontWeight: 600 }}>{pct.toFixed(1)}% des Ziels</span>
                <span style={{ fontSize: 10, color: '#3d4460' }}>{fmt(active.needed)}</span>
              </div>
              <div style={{ height: 6, background: '#1e2235', borderRadius: 3 }}>
                <div style={{ height: '100%', width: pct + '%', background: 'linear-gradient(90deg,' + active.color + ',' + active.color + '80)', borderRadius: 3, transition: 'width 0.6s ease' }} />
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 14 }}>
          {results.map(r => (
            <div key={r.key} onClick={() => setScen(r.key)} style={{ background: '#0d0f18', border: '2px solid ' + (scen === r.key ? r.color : '#1e2235'), borderRadius: 11, padding: 16, cursor: 'pointer', transition: 'border-color 0.2s' }}>
              <div style={{ fontSize: 12, color: r.color, fontWeight: 600, marginBottom: 6 }}>{r.emoji} {r.label}</div>
              <div style={{ fontSize: 38, fontWeight: 900, color: r.color, lineHeight: 1 }}>{r.retired ? 'Jetzt' : r.years}</div>
              <div style={{ fontSize: 11, color: '#3d4460', marginTop: 4 }}>{r.retired ? 'Bereits möglich' : 'Jahre'}</div>
            </div>
          ))}
        </div>

        <button onClick={() => setShowTL(!showTL)} style={{ width: '100%', padding: 11, background: '#0d0f18', border: '1px solid #1e2235', borderRadius: 9, color: '#64748b', fontSize: 12, cursor: 'pointer', marginBottom: showTL ? 12 : 0, transition: 'background 0.2s' }}>
          {showTL ? '▲ Portfolio-Entwicklung ausblenden' : '▼ Portfolio-Wachstum Jahr für Jahr anzeigen'}
        </button>
        {showTL && (
          <div style={{ background: '#0d0f18', border: '1px solid #1e2235', borderRadius: 11, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', background: '#080a12', padding: '8px 16px' }}>
              {['Jahr', 'Portfolio', 'Veränderung'].map(h => <div key={h} style={{ fontSize: 10, color: '#3d4460', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</div>)}
            </div>
            {active.tl.map((row, i) => {
              const chg = ((row.usd - active.portfolio) / active.portfolio * 100).toFixed(0);
              return (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', padding: '9px 16px', borderTop: '1px solid #1e223520', background: i % 2 ? '#0a0c1520' : 'transparent' }}>
                  <div style={{ fontSize: 12, color: '#3d4460' }}>Jahr {row.year}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: row.usd > active.portfolio ? '#22c55e' : '#ef4444' }}>${row.usd.toLocaleString()}</div>
                  <div style={{ fontSize: 12, color: parseFloat(chg) > 0 ? '#22c55e' : '#ef4444' }}>{parseFloat(chg) > 0 ? '+' : ''}{chg}%</div>
                </div>
              );
            })}
          </div>
        )}
        <div style={{ fontSize: 10, color: '#1e2235', marginTop: 8 }}>⚠️ Modellrechnung · Kein Finanzrat · Steuern nicht berücksichtigt</div>
      </div>
    </div>
  );
});

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════ */
export default function Home() {
  const [btc, setBtc] = useState({ price: 83000, change: -0.5, high: 85000, low: 81000, volume: 38e9, marketCap: 1.63e12, dominance: 54.3 });
  const [upd, setUpd] = useState('');
  const [fg,  setFg]  = useState<{ value: number; label: string } | null>(null);
  const [gold, setGold]   = useState(3100);
  const [silver, setSilver] = useState(34);
  const [mTime, setMTime] = useState('');

  const fetchBTC = useCallback(async () => {
    try {
      const r = await fetch('/api/bitcoin');
      const d = await r.json();
      if (d.success) { setBtc(p => ({ ...p, ...d.data })); setUpd(new Date().toLocaleTimeString('de-DE')); }
    } catch {}
  }, []);

  const fetchFG = useCallback(async () => {
    try {
      const r = await fetch('https://api.alternative.me/fng/?limit=1');
      const d = await r.json();
      if (d?.data?.[0]) setFg({ value: parseInt(d.data[0].value), label: d.data[0].value_classification });
    } catch {}
  }, []);

  const fetchMetals = useCallback(async () => {
    try {
      const r = await fetch('https://api.metals.live/v1/spot');
      if (r.ok) {
        const d = await r.json();
        const g = d.find((m: any) => m.gold);
        const s = d.find((m: any) => m.silver);
        if (g?.gold) setGold(g.gold);
        if (s?.silver) setSilver(s.silver);
        setMTime(new Date().toLocaleTimeString('de-DE'));
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchBTC(); fetchFG(); fetchMetals();
    const t1 = setInterval(fetchBTC,    15000);
    const t2 = setInterval(fetchFG,    300000);
    const t3 = setInterval(fetchMetals,300000);
    return () => { clearInterval(t1); clearInterval(t2); clearInterval(t3); };
  }, [fetchBTC, fetchFG, fetchMetals]);

  const fgv = fg?.value ?? 25;
  const fgColor = fgv <= 25 ? '#ef4444' : fgv <= 45 ? '#fb923c' : fgv <= 55 ? '#f59e0b' : fgv <= 75 ? '#34d399' : '#22c55e';

  const models = [
    { label: 'Macro',     score: 58, desc: 'M2 steigt, Zinsen noch hoch' },
    { label: 'Liquidity', score: 62, desc: 'Globale Liq. leicht positiv' },
    { label: 'Cycle',     score: 65, desc: 'Post-Halving, Konsolidierung' },
    { label: 'Valuation', score: 55, desc: 'MVRV fair bewertet' },
    { label: 'Sentiment', score: Math.max(10, Math.round(fgv * 0.7)), desc: `Fear & Greed: ${fgv}` },
    { label: 'On-Chain',  score: 57, desc: 'Accumulation erkennbar' },
  ];
  const composite = Math.round(models.reduce((a, b) => a + b.score, 0) / models.length);
  const sigCol = composite >= 65 ? '#22c55e' : composite >= 50 ? '#f59e0b' : '#ef4444';
  const signal = composite >= 65 ? 'BULLISH' : composite >= 50 ? 'NEUTRAL' : 'BEARISH';

  const horizons = [
    { label: '7 Days',   bull: { p:.28, ret:6,   price: btc.price*1.06 }, base: { p:.44, ret:-1,  price: btc.price*.99  }, bear: { p:.28, ret:-8,  price: btc.price*.92 } },
    { label: '3 Months', bull: { p:.32, ret:35,  price: btc.price*1.35 }, base: { p:.40, ret:8,   price: btc.price*1.08 }, bear: { p:.28, ret:-25, price: btc.price*.75 } },
    { label: '1 Year',   bull: { p:.38, ret:150, price: btc.price*2.50 }, base: { p:.35, ret:45,  price: btc.price*1.45 }, bear: { p:.27, ret:-40, price: btc.price*.60 } },
    { label: '5 Years',  bull: { p:.42, ret:800, price: btc.price*9.0  }, base: { p:.35, ret:250, price: btc.price*3.5  }, bear: { p:.23, ret:-60, price: btc.price*.40 } },
  ];

  const fmt  = (n: number) => '$' + Math.round(n).toLocaleString('en-US');

  const niches = [
    { name: 'Uranium / Nuclear Energy', score: 91, color: '#f59e0b', tag: 'Rohstoffe',
      thesis: 'Das perfekte asymmetrische Setup', bullets: [
        'AI-Rechenzentren brauchen 24/7-Grundlast – Solar & Wind können das nicht liefern',
        'Uranium Spotpreis 40% unter Hochs, Angebotslücke bis 2030 ungelöst',
        'Microsoft, Google, Amazon haben SMR-Verträge unterzeichnet',
        '60+ neue Reaktoren weltweit im Bau – höchster Stand seit Jahrzehnten',
      ], risk: 'Regulatorisch · langer Entwicklungshorizont',
      stocks: [
        { ticker:'CCJ',  name:'Cameco',          why:'Weltgrößter börsennotierter Uranproduzent' },
        { ticker:'SPUT', name:'Sprott U Trust',  why:'Direkter Uranium-Spotpreis-Proxy' },
        { ticker:'NXE',  name:'NexGen Energy',   why:'Weltklasse-Vorkommen in Kanada' },
        { ticker:'DNN',  name:'Denison Mines',   why:'ISR-Technologie, hohe Margen möglich' },
      ]},
    { name: 'AI Infrastructure', score: 88, color: '#38bdf8', tag: 'Technologie',
      thesis: 'Wer schaufelt wenn alle Gold suchen?', bullets: [
        'LLM-Training und Inference wächst ~10x pro Jahr – Rechenbedarf explodiert',
        'NVIDIA GPU-Lieferzeit 6–12 Monate – strukturelle Knappheit auf Jahre',
        'Microsoft +$80B, Meta +$65B, Google +$75B CAPEX 2024 – alles in Infrastruktur',
        'AI-Anwendungsschicht überfüllt, Infrastrukturschicht noch undervalued',
      ], risk: 'Hohe Bewertungen bei Large Caps · Überinvestitionszyklen',
      stocks: [
        { ticker:'NVDA', name:'NVIDIA',    why:'Dominiert KI-Training und Inference Chips' },
        { ticker:'AMD',  name:'AMD',       why:'MI300X als NVIDIA-Alternative gewinnt Markt' },
        { ticker:'VRT',  name:'Vertiv',    why:'Kühlsysteme für Datacenter – Nischenführer' },
        { ticker:'ETN',  name:'Eaton',     why:'Strommanagement – jedes Datacenter braucht es' },
      ]},
    { name: 'Copper & Critical Minerals', score: 82, color: '#fb923c', tag: 'Rohstoffe',
      thesis: 'Die unsichtbare Engpassressource der Energiewende', bullets: [
        'Jedes EV braucht 4x mehr Kupfer als ein Verbrenner – Milliarden EVs kommen',
        'Neue Kupfermine: 15–20 Jahre von Entdeckung bis Produktion',
        'IEA: Angebotslücke von 8 Mio. Tonnen bis 2030 prognostiziert',
        'Kupfer unter ATH trotz strukturell veränderter Nachfrage',
      ], risk: 'Konjunkturabhängig · China-Nachfrage als Haupttreiber',
      stocks: [
        { ticker:'FCX',  name:'Freeport',         why:'Weltgrößter Kupferproduzent, günstig bewertet' },
        { ticker:'IVN',  name:'Ivanhoe Mines',    why:'Kamoa-Kakula: weltklasse Vorkommen' },
        { ticker:'COPX', name:'Global X Copper',  why:'Diversifizierter ETF ohne Einzelrisiko' },
        { ticker:'TECK', name:'Teck Resources',   why:'Kupfer + Zink, diversifizierter Rohstoffriese' },
      ]},
    { name: 'Bitcoin DeFi (BTCFi)', score: 79, color: '#f59e0b', tag: 'Crypto',
      thesis: '$1.3 Trillion wartet auf Yield', bullets: [
        '1.3T USD in BTC liegt unproduktiv – keine nativen Zinsen verfügbar',
        'Layer2-Protokolle (Stacks, Babylon) ermöglichen BTC-nativen Yield',
        'Ordinals & Runes: On-Chain-Aktivität auf BTC 10x gestiegen',
        'TVL auf BTC-L2 noch <$3B vs $50B+ auf Ethereum – riesiges Aufholpotenzial',
      ], risk: 'Technisch komplex · Smart Contract Risiken auf neuem Terrain',
      stocks: [
        { ticker:'MSTR', name:'MicroStrategy',  why:'Größter börsennotierter BTC-Holder, Hebel auf BTC' },
        { ticker:'COIN', name:'Coinbase',        why:'Infrastruktur für institutionelle BTC-Nutzung' },
        { ticker:'STX',  name:'Stacks',          why:'Führendes BTC-L2-Protokoll' },
        { ticker:'MARA', name:'Marathon Digital',why:'BTC Mining + BTCFi-Exposure' },
      ]},
    { name: 'Real World Assets (RWA)', score: 74, color: '#a78bfa', tag: 'Finance',
      thesis: '$16 Trillion Markt kommt On-Chain', bullets: [
        'BlackRock BUIDL Fund: $500M+ tokenisierte US-Staatsanleihen in <6 Monaten',
        'Franklin Templeton, JPMorgan, Citi bauen aktiv RWA-Produkte',
        'Regulierung wird klarer – EU MiCA schafft legales Framework',
        'Immobilien-Tokenisierung: institutionelle Assets erstmals für Retail zugänglich',
      ], risk: 'Regulatorisch · Liquiditätsrisiken bei tokenisierten Assets',
      stocks: [
        { ticker:'BLK',  name:'BlackRock',  why:'BUIDL Fund – größter institutioneller RWA-Player' },
        { ticker:'ONDO', name:'Ondo Finance',why:'Führendes RWA-Protokoll, tokenisierte T-Bills' },
        { ticker:'PYPL', name:'PayPal',     why:'PYUSD On-Chain-Payments Infrastruktur' },
        { ticker:'ICE',  name:'ICE',        why:'Digital Asset Clearing & Settlement' },
      ]},
    { name: 'Longevity / Biotech', score: 69, color: '#34d399', tag: 'Healthcare',
      thesis: 'Der unterschätzte Multi-Trillion-Markt', bullets: [
        'GLP-1 (Ozempic/Wegovy) zeigt: metabolische Eingriffe verändern alles',
        'AlphaFold2 hat Protein-Folding gelöst – AI beschleunigt Drug Discovery massiv',
        '1 Milliarde Menschen über 65 bis 2030 – größte zahlungsfähige Kohorte ever',
        'Erste echte Longevity-Compounds (Senolytics, Rapamycin) in klinischen Studien',
      ], risk: 'Langer Entwicklungshorizont · hohe klinische Misserfolgsrate',
      stocks: [
        { ticker:'NVO',  name:'Novo Nordisk',    why:'GLP-1 Marktführer – Ozempic/Wegovy Dominanz' },
        { ticker:'LLY',  name:'Eli Lilly',       why:'Mounjaro + Alzheimer – stärkste Pipeline' },
        { ticker:'ARKG', name:'ARK Genomic ETF', why:'Diversifiziert in Longevity & CRISPR Biotech' },
        { ticker:'ISRG', name:'Intuitive Surgical',why:'Robotic Surgery Marktführer' },
      ]},
  ];

  const Sec = ({ title, sub, badge, children }: any) => (
    <div style={{ marginBottom: 64 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 8, marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #1e2235' }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', margin: 0 }}>{title}</h2>
          {sub && <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>{sub}</p>}
        </div>
        {badge && <span style={{ fontSize: 10, background: '#f59e0b08', color: '#f59e0b80', padding: '3px 10px', borderRadius: 6, border: '1px solid #f59e0b15', whiteSpace: 'nowrap' }}>{badge}</span>}
      </div>
      {children}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#060810', color: '#e2e8f0', fontFamily: '"DM Sans", system-ui, -apple-system, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800;900&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        * { box-sizing: border-box; }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
        input[type=number] { -moz-appearance: textfield; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #060810; }
        ::-webkit-scrollbar-thumb { background: #1e2235; border-radius: 3px; }
      `}</style>

      {/* ── HEADER ── */}
      <header style={{ background: '#0a0c15', borderBottom: '1px solid #1e2235', padding: '0 32px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1440, margin: '0 auto', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,#f59e0b,#d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, flexShrink: 0, boxShadow: '0 0 16px #f59e0b20' }}>₿</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.3px', lineHeight: 1.2 }}>BTC Intelligence</div>
              <div style={{ fontSize: 10, color: '#3d4460', letterSpacing: '0.5px' }}>INSTITUTIONAL ANALYTICS</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {/* BTC Price */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: btc.change >= 0 ? '#22c55e' : '#ef4444', letterSpacing: '-0.5px', lineHeight: 1 }}>{fmt(btc.price)}</div>
              <div style={{ fontSize: 11, color: btc.change >= 0 ? '#22c55e' : '#ef4444', fontWeight: 600 }}>{btc.change > 0 ? '+' : ''}{btc.change?.toFixed(2)}% 24h</div>
            </div>

            <div style={{ width: 1, height: 32, background: '#1e2235' }} />

            {/* Fear & Greed */}
            {fg && (
              <div style={{ background: fgColor + '10', border: '1px solid ' + fgColor + '25', borderRadius: 9, padding: '6px 12px', textAlign: 'center', minWidth: 70 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: fgColor, lineHeight: 1 }}>{fg.value}</div>
                <div style={{ fontSize: 9, color: fgColor, fontWeight: 600, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>F&G Index</div>
              </div>
            )}

            {/* Model Score */}
            <div style={{ background: sigCol + '10', border: '1px solid ' + sigCol + '25', borderRadius: 9, padding: '6px 12px', textAlign: 'center', minWidth: 70 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: sigCol, lineHeight: 1 }}>{composite}/100</div>
              <div style={{ fontSize: 9, color: sigCol, fontWeight: 600, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{signal}</div>
            </div>

            <div style={{ width: 1, height: 32, background: '#1e2235' }} />

            {/* Stats */}
            <div style={{ fontSize: 11, color: '#3d4460', textAlign: 'right', lineHeight: 1.6 }}>
              <div>Cap ${(btc.marketCap / 1e12).toFixed(2)}T · Dom {btc.dominance?.toFixed(1)}%</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
                <span style={{ color: '#1e2235' }}>{upd || '...'}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1440, margin: '0 auto', padding: '40px 32px' }}>

        {/* RETIREMENT */}
        <Sec title="₿ Bitcoin Retirement Calculator" sub="In wie vielen Jahren kannst du von deinem BTC-Vermögen leben?">
          <RetirementCalculator />
        </Sec>

        {/* PREDICTION MODEL */}
        <Sec title="Bitcoin Prediction Model" sub="Probabilistische Szenarien – Fear & Greed, Cycle, On-Chain, Macro" badge={fg ? `Live · F&G: ${fg.value} – ${fg.label}` : 'Live'}>
          {fg && (
            <div style={{ background: fgColor + '08', border: '1px solid ' + fgColor + '20', borderRadius: 11, padding: '14px 18px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ fontSize: 42, fontWeight: 900, color: fgColor, lineHeight: 1, minWidth: 54 }}>{fg.value}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: fgColor }}>{fg.label}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  {fgv <= 25 ? 'Extreme Fear – historisch guter Akkumulationszeitpunkt. Kurzfristig aber weitere Schwäche möglich.' :
                   fgv <= 45 ? 'Fear – smarte Investoren akkumulieren oft in dieser Phase.' :
                   fgv <= 55 ? 'Neutral – kein klares direktionales Signal.' : 'Greed – Vorsicht vor Überhitzung.'}
                </div>
              </div>
              <div style={{ marginLeft: 'auto', fontSize: 10, color: '#3d4460', textAlign: 'right', whiteSpace: 'nowrap' }}>alternative.me · live</div>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(145px,1fr))', gap: 10, marginBottom: 18 }}>
            {models.map(m => {
              const c = m.score >= 65 ? '#22c55e' : m.score >= 50 ? '#f59e0b' : '#ef4444';
              return (
                <div key={m.label} style={{ background: '#0d0f18', border: '1px solid #1e2235', borderRadius: 11, padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>{m.label}</span>
                    <span style={{ fontSize: 18, fontWeight: 800, color: c }}>{m.score}</span>
                  </div>
                  <div style={{ height: 3, background: '#1e2235', borderRadius: 2, marginBottom: 7 }}>
                    <div style={{ height: '100%', width: m.score + '%', background: c, borderRadius: 2, transition: 'width 0.5s' }} />
                  </div>
                  <div style={{ fontSize: 10, color: '#3d4460', lineHeight: 1.4 }}>{m.desc}</div>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 12 }}>
            {horizons.map(h => (
              <div key={h.label} style={{ background: '#0d0f18', border: '1px solid #1e2235', borderRadius: 12, padding: 18 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#f59e0b', marginBottom: 14 }}>{h.label}</div>
                {([['Bull', '#22c55e', h.bull], ['Base', '#f59e0b', h.base], ['Bear', '#ef4444', h.bear]] as [string, string, typeof h.bull][]).map(([l, c, d]) => (
                  <div key={l} style={{ marginBottom: 11 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 11, color: c, fontWeight: 600 }}>{l} {(d.p * 100).toFixed(0)}%</span>
                      <span style={{ fontSize: 11, color: c }}>{d.ret > 0 ? '+' : ''}{d.ret}%</span>
                    </div>
                    <div style={{ height: 3, background: '#1e2235', borderRadius: 2, marginBottom: 2 }}>
                      <div style={{ height: '100%', width: (d.p * 100) + '%', background: c, borderRadius: 2 }} />
                    </div>
                    <div style={{ fontSize: 10, color: '#3d4460' }}>{fmt(d.price)}</div>
                  </div>
                ))}
                <div style={{ marginTop: 12, paddingTop: 11, borderTop: '1px solid #1e2235', fontSize: 10, color: '#3d4460' }}>
                  Expected Return: <span style={{ color: '#f59e0b', fontWeight: 700 }}>{fmt(h.bull.price * h.bull.p + h.base.price * h.base.p + h.bear.price * h.bear.p)}</span>
                </div>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 12, fontSize: 10, color: '#3d4460', padding: '8px 12px', background: '#0d0f18', borderRadius: 8, border: '1px solid #1e2235' }}>
            ⚠️ Probabilistisch · kein Versprechen · Modell: Fear & Greed, Stock-to-Flow, Power Law, Halving Cycle, M2, DXY, On-Chain
          </p>
        </Sec>

        {/* REAL ESTATE */}
        <Sec title="Real Estate valued in Bitcoin" sub="Immobilienpreise weltweit – wie viel BTC kostet ein Haus heute?" badge="Statista · NAR">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: 12 }}>
            {[
              { label: 'Ø Haus Deutschland',    usd: 440000, eur: 400000 },
              { label: 'Ø Wohnung Deutschland', usd: 275000, eur: 250000 },
              { label: 'Ø Haus USA',            usd: 430000, eur: 390000 },
              { label: 'Ø Wohnung USA',         usd: 253000, eur: 230000 },
            ].map(item => (
              <div key={item.label} style={{ background: '#0d0f18', border: '1px solid #1e2235', borderRadius: 12, padding: 18 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>{item.label}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                  {[['USD', '$' + (item.usd / 1000).toFixed(0) + 'k'], ['EUR', '€' + (item.eur / 1000).toFixed(0) + 'k']].map(([l, v]) => (
                    <div key={l} style={{ background: '#080a12', borderRadius: 7, padding: '9px 12px' }}>
                      <div style={{ fontSize: 10, color: '#3d4460' }}>{l}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background: '#f59e0b08', border: '1px solid #f59e0b20', borderRadius: 9, padding: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: '#f59e0b80', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>In Bitcoin heute</div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: '#f59e0b' }}>{(item.usd / btc.price).toFixed(2)} ₿</div>
                  <div style={{ fontSize: 10, color: '#3d4460', marginTop: 2 }}>bei {fmt(btc.price)}/BTC</div>
                </div>
              </div>
            ))}
          </div>
        </Sec>

        {/* GOLD & SILVER */}
        <Sec title="Gold & Silver valued in Bitcoin" sub={`Live Edelmetallpreise · Gold $${gold.toLocaleString()} · Silber $${silver}`} badge={mTime ? `metals.live · ${mTime}` : 'Live'}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
            {[
              { label: 'Gold / Unze',    usd: gold,         color: '#f59e0b' },
              { label: 'Gold / Kilo',    usd: gold * 32.15, color: '#f59e0b' },
              { label: 'Silber / Unze',  usd: silver,       color: '#94a3b8' },
              { label: 'Silber / Kilo',  usd: silver*32.15, color: '#94a3b8' },
            ].map(item => (
              <div key={item.label} style={{ background: '#0d0f18', border: '1px solid #1e2235', borderRadius: 11, padding: 14 }}>
                <div style={{ fontSize: 11, color: '#3d4460', marginBottom: 8 }}>{item.label}</div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 5 }}>${item.usd.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{(item.usd / btc.price).toFixed(6)} ₿</div>
              </div>
            ))}
            <div style={{ background: '#f59e0b08', border: '1px solid #f59e0b20', borderRadius: 11, padding: 14 }}>
              <div style={{ fontSize: 11, color: '#3d4460', marginBottom: 8 }}>Gold / BTC Ratio</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#f59e0b' }}>{(gold / btc.price).toFixed(5)}</div>
              <div style={{ fontSize: 10, color: '#3d4460', marginTop: 3 }}>oz Gold pro 1 BTC</div>
            </div>
            <div style={{ background: '#22c55e08', border: '1px solid #22c55e20', borderRadius: 11, padding: 14 }}>
              <div style={{ fontSize: 11, color: '#3d4460', marginBottom: 8 }}>10J Performance</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#22c55e' }}>BTC +4,200,000%</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>Gold +134% · Silber +28%</div>
            </div>
          </div>
        </Sec>

        {/* ADOPTION */}
        <Sec title="Bitcoin Adoption" sub="Bitcoin im globalen Adoptionszyklus – Vergleich Internet & Mobiltelefon">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 12, marginBottom: 16 }}>
            {[['~106 Mio', 'Holder weltweit', '#f59e0b'], ['1.31%', 'Adoption Rate', '#22c55e'], ['~2005', 'Internet-Äquiv.', '#38bdf8'], ['~2000', 'Mobil-Äquiv.', '#a78bfa']].map(([v, l, c]) => (
              <div key={l} style={{ background: '#0d0f18', border: '1px solid #1e2235', borderRadius: 11, padding: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: c }}>{v}</div>
                <div style={{ fontSize: 11, color: '#3d4460', marginTop: 5 }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ background: '#0d0f18', border: '1px solid #1e2235', borderRadius: 12, padding: 22 }}>
            {([['Bitcoin 2025', 1.31, '#f59e0b'], ['Internet 2005', 16, '#38bdf8'], ['Mobiltelefon 2000', 12, '#a78bfa'], ['Internet heute', 67, '#38bdf840'], ['Mobiltelefon heute', 86, '#a78bfa40']] as [string, number, string][]).map(([l, p, c]) => (
              <div key={l} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 12, color: '#64748b' }}>{l}</span>
                  <span style={{ fontSize: 12, color: c, fontWeight: 600 }}>{p}%</span>
                </div>
                <div style={{ height: 5, background: '#1e2235', borderRadius: 3 }}>
                  <div style={{ height: '100%', width: p + '%', background: c, borderRadius: 3, transition: 'width 0.5s' }} />
                </div>
              </div>
            ))}
            <div style={{ marginTop: 16, padding: 14, background: '#080a12', borderRadius: 9, fontSize: 12, color: '#64748b', lineHeight: 1.7, border: '1px solid #1e2235' }}>
              💡 Bitcoin entspricht heute dem Internet ~2005. Bei gleichem Adoptionspfad: <strong style={{ color: '#f59e0b' }}>50%+ Weltbevölkerung bis ~2030</strong> – noch 98% der potenziellen Nutzer nicht erreicht.
            </div>
          </div>
        </Sec>

        {/* UNDERVALUED INVESTMENTS */}
        <Sec title="Undervalued Investments – Deep Research" sub="Tief recherchierte asymmetrische Chancen mit hohem Risk/Reward-Potenzial" badge="Research · Kein Finanzrat">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(400px,1fr))', gap: 18 }}>
            {niches.map((n, i) => (
              <div key={i} style={{ background: '#0d0f18', border: '1px solid #1e2235', borderRadius: 14, padding: 22, borderTop: '3px solid ' + n.color, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>{n.name}</div>
                    <span style={{ fontSize: 10, background: n.color + '12', color: n.color, padding: '2px 9px', borderRadius: 5, border: '1px solid ' + n.color + '25', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>{n.tag}</span>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 28, fontWeight: 900, color: n.color, lineHeight: 1 }}>{n.score}</div>
                    <div style={{ fontSize: 9, color: '#3d4460', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Conviction</div>
                  </div>
                </div>

                <div style={{ fontSize: 12, fontWeight: 600, color: n.color, marginBottom: 12, fontStyle: 'italic', opacity: 0.9 }}>&quot;{n.thesis}&quot;</div>

                <div style={{ height: 2, background: '#1e2235', borderRadius: 1, marginBottom: 14 }}>
                  <div style={{ height: '100%', width: n.score + '%', background: n.color, borderRadius: 1 }} />
                </div>

                <div style={{ flex: 1, marginBottom: 14 }}>
                  {n.bullets.map((b, j) => (
                    <div key={j} style={{ display: 'flex', gap: 9, marginBottom: 8, alignItems: 'flex-start' }}>
                      <span style={{ color: n.color, fontSize: 12, flexShrink: 0, marginTop: 2 }}>▸</span>
                      <span style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>{b}</span>
                    </div>
                  ))}
                </div>

                <div style={{ borderTop: '1px solid #1e2235', paddingTop: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#3d4460', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 }}>Top börsennotierte Investments</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
                    {n.stocks.map((s, j) => (
                      <div key={j} style={{ background: '#080a12', borderRadius: 7, padding: '8px 10px', border: '1px solid #1e2235' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 3 }}>
                          <span style={{ fontSize: 12, fontWeight: 800, color: n.color }}>{s.ticker}</span>
                          <span style={{ fontSize: 10, color: '#3d4460', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                        </div>
                        <div style={{ fontSize: 10, color: '#64748b', lineHeight: 1.4 }}>{s.why}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 10, color: '#3d4460', marginTop: 10 }}>
                    <span style={{ color: '#ef444480' }}>⚠ Risiken:</span> {n.risk}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 18, padding: '12px 16px', background: '#0d0f18', borderRadius: 9, fontSize: 11, color: '#3d4460', border: '1px solid #1e2235', lineHeight: 1.7 }}>
            ⚠️ <strong style={{ color: '#94a3b8' }}>Wichtig:</strong> Keine Anlageberatung. Alle Investments sind spekulativ. Eigene Due Diligence unbedingt erforderlich. Nie mehr investieren als man bereit ist zu verlieren.
          </div>
        </Sec>

      </main>

      <footer style={{ borderTop: '1px solid #1e2235', padding: '20px 32px', background: '#0a0c15', textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: '#3d4460', marginBottom: 4 }}>BTC Intelligence Platform · Kein Finanzrat · Keine Anlageempfehlung · Nur zu Informationszwecken</div>
        <div style={{ fontSize: 10, color: '#1e2235' }}>BTC: CoinGecko alle 15s · Gold/Silber: metals.live alle 5min · Fear & Greed: alternative.me · {upd}</div>
      </footer>
    </div>
  );
}
