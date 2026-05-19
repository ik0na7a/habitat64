import { useState, useRef, useEffect, useCallback } from "react";

const BIN_ID  = "6a0b76656610dd3ae867ec11";
const BIN_KEY = "$2a$10$BQmK0hFCCUIC/YcQqnsAM.aMYK.Eacie03ylZ/N6DLuq1pdtsbfsO";
const BIN_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;
const HEADERS = { "Content-Type": "application/json", "X-Access-Key": BIN_KEY };
const LS_KEY  = "habitat64_data";

function lsSave(d) { try { localStorage.setItem(LS_KEY, JSON.stringify(d)); } catch {} }
function lsLoad() { try { const d = localStorage.getItem(LS_KEY); return d ? JSON.parse(d) : null; } catch { return null; } }
async function binSave(data) {
  const res = await fetch(BIN_URL, { method:"PUT", headers:HEADERS, body:JSON.stringify(data) });
  if (!res.ok) throw new Error(res.status);
}
async function binLoad() {
  const res = await fetch(`${BIN_URL}/latest`, { headers:HEADERS });
  if (!res.ok) throw new Error(res.status);
  return (await res.json()).record;
}

const EMOJIS = ["🍬","🥛","💧","🫙","🍚","🧃","🥤","🍫","🥚","🧀","🌽","🍎","🧴","🫧","🧹"];
const fmt = n => `${(+n||0).toFixed(2)} €`;

// ── THUMB ─────────────────────────────────────────────────────
function Thumb({ p, size=52 }) {
  const em = EMOJIS[(p.id-1)%EMOJIS.length]||"📦";
  const [err, setErr] = useState(false);
  if (p.image && !err) {
    return <img src={p.image} alt={p.name}
      onError={()=>setErr(true)}
      style={{ width:size,height:size,borderRadius:10,objectFit:"cover",flexShrink:0 }} />;
  }
  return <div style={{ width:size,height:size,borderRadius:10,background:"#1a1a24",display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.46,flexShrink:0 }}>{em}</div>;
}

function Badge({ t, children }) {
  const m = { ok:["rgba(74,222,128,0.18)","#4ade80"],low:["rgba(251,146,60,0.18)","#fb923c"],out:["rgba(248,113,113,0.18)","#f87171"],pending:["rgba(240,192,64,0.18)","#f0c040"],done:["rgba(78,205,196,0.18)","#4ecdc4"] };
  return <span style={{ background:m[t][0],color:m[t][1],padding:"4px 10px",borderRadius:20,fontSize:"0.70rem",fontWeight:700,display:"inline-block",whiteSpace:"nowrap" }}>{children}</span>;
}

function Btn({ v="pri", sm, onClick, children, style={}, full }) {
  const base = { cursor:"pointer",borderRadius:10,fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:sm?"0.80rem":"0.90rem",padding:sm?"8px 14px":"11px 20px",display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6,border:"none",width:full?"100%":"auto",...style };
  const vs = {
    pri:  { background:"#f0c040",color:"#0f0f14" },
    sec:  { background:"#1e1e2a",color:"#e8e8f0",border:"1px solid #2a2a38" },
    del:  { background:"rgba(248,113,113,0.15)",color:"#f87171",border:"1px solid rgba(248,113,113,0.3)" },
    teal: { background:"rgba(78,205,196,0.15)",color:"#4ecdc4",border:"1px solid rgba(78,205,196,0.3)" },
    edit: { background:"rgba(240,192,64,0.12)",color:"#f0c040",border:"1px solid rgba(240,192,64,0.3)" },
  };
  return <button style={{ ...base,...vs[v] }} onClick={onClick}>{children}</button>;
}

const IS = { width:"100%",background:"#1e1e2a",border:"1px solid #2a2a38",color:"#e8e8f0",borderRadius:10,padding:"12px 14px",fontFamily:"'DM Sans',sans-serif",fontSize:"0.93rem",outline:"none" };
function FG({ label, children }) {
  return <div style={{ marginBottom:14 }}><label style={{ display:"block",fontSize:"0.70rem",color:"#8888a0",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.6px" }}>{label}</label>{children}</div>;
}

function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null;
  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.80)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:200 }}>
      <div style={{ background:"#16161e",border:"1px solid #2a2a38",borderRadius:"20px 20px 0 0",padding:"24px 20px 40px",width:"100%",maxWidth:560,maxHeight:"92vh",overflowY:"auto" }}>
        <div style={{ width:40,height:4,background:"#2a2a38",borderRadius:2,margin:"0 auto 18px" }} />
        <div style={{ fontFamily:"Syne,sans-serif",fontSize:"1.05rem",fontWeight:700,marginBottom:18 }}>{title}</div>
        {children}
        {footer&&<div style={{ display:"flex",flexDirection:"column",gap:8,marginTop:20,paddingTop:16,borderTop:"1px solid #2a2a38" }}>{footer}</div>}
      </div>
    </div>
  );
}

function StatusBar({ status }) {
  const cfg = {
    saving:  { bg:"rgba(240,192,64,0.15)",  border:"rgba(240,192,64,0.4)",  color:"#f0c040", text:"💾 Запазва се..." },
    saved:   { bg:"rgba(74,222,128,0.12)",  border:"rgba(74,222,128,0.35)", color:"#4ade80", text:"✓ Запазено" },
    error:   { bg:"rgba(248,113,113,0.15)", border:"rgba(248,113,113,0.4)", color:"#f87171", text:"⚠ Запазено локално" },
    syncing: { bg:"rgba(78,205,196,0.12)",  border:"rgba(78,205,196,0.35)", color:"#4ecdc4", text:"🔄 Синхронизира..." },
  };
  if (!status||!cfg[status]) return null;
  const c = cfg[status];
  return <div style={{ position:"fixed",top:62,right:12,background:c.bg,border:`1px solid ${c.border}`,borderRadius:8,padding:"5px 12px",fontSize:"0.72rem",color:c.color,zIndex:150,fontWeight:600 }}>{c.text}</div>;
}

// ══════════════════════════════════════════════════════════════
export default function App() {
  const [ready,       setReady]       = useState(false);
  const [syncStatus,  setSyncStatus]  = useState("syncing");
  const [page,        setPage]        = useState("dashboard");
  const [products,    setProducts]    = useState([]);
  const [stores,      setStores]      = useState([]);
  const [orders,      setOrders]      = useState([]);
  const [nextId,      setNextId]      = useState(1001);

  // modals
  const [mProd,    setMProd]    = useState(false);
  const [mStore,   setMStore]   = useState(false);
  const [mOrder,   setMOrder]   = useState(false);
  const [mRestock, setMRestock] = useState(false);
  const [mEdit,    setMEdit]    = useState(null);
  const [mStoreEdit, setMStoreEdit] = useState(null);

  // forms
  const emP = { name:"",sku:"",qty:"",buy:"",sell:"",min:"10",img:"" };
  const emS = { name:"",addr:"",contact:"",phone:"",bulstat:"" };
  const [pF, setPF] = useState(emP);
  const [sF, setSF] = useState(emS);
  const [eF, setEF] = useState({ name:"",sku:"",qty:"",buy:"",sell:"",min:"",img:"" });
  const [eSF, setESF] = useState({ name:"",addr:"",contact:"",phone:"",bulstat:"" });
  const [oSid,  setOSid]  = useState("");
  const [oDate, setODate] = useState(new Date().toISOString().split("T")[0]);
  const [oQtys, setOQtys] = useState({});
  const [rQtys, setRQtys] = useState({});

  // ── LOAD ─────────────────────────────────────────────────
  function applyData(d) {
    setProducts(d.products   || []);
    setStores(d.stores       || []);
    setOrders(d.orders       || []);
    setNextId(d.nextId       || 1001);
  }

  useEffect(() => {
    (async () => {
      const local = lsLoad();
      if (local) { applyData(local); setReady(true); setSyncStatus("syncing"); }
      try {
        const remote = await binLoad();
        if (remote && remote.products !== undefined) {
          const winner = (remote?.nextId||0) >= (local?.nextId||0) ? remote : local;
          applyData(winner); lsSave(winner);
        }
        setSyncStatus("saved"); setTimeout(() => setSyncStatus(null), 2000);
      } catch(e) {
        console.warn("load failed", e);
        setSyncStatus(local ? "saved" : "error"); setTimeout(() => setSyncStatus(null), 3000);
      } finally { setReady(true); }
    })();
  }, []);

  // ── SAVE ─────────────────────────────────────────────────
  const binTimer = useRef(null);
  const persist = useCallback((p, s, o, nid) => {
    const data = { products:p, stores:s, orders:o, nextId:nid };
    lsSave(data);
    clearTimeout(binTimer.current);
    setSyncStatus("saving");
    binTimer.current = setTimeout(async () => {
      try { await binSave(data); setSyncStatus("saved"); setTimeout(() => setSyncStatus(null), 2000); }
      catch(e) { console.warn("save failed", e); setSyncStatus("error"); setTimeout(() => setSyncStatus(null), 4000); }
    }, 1000);
  }, []);

  // ── HELPERS ───────────────────────────────────────────────
  const oval   = o => o.items.reduce((s,i) => { const p = products.find(x=>x.id===i.pid); return s+(p?p.sellPrice*i.qty:0); }, 0);
  const ototal = products.reduce((s,p) => s+(oQtys[p.id]||0)*p.sellPrice, 0);

  const openOrder = sid => {
    const q={}; products.forEach(p=>q[p.id]=0);
    setOQtys(q); setOSid(sid||stores[0]?.id||"");
    setODate(new Date().toISOString().split("T")[0]);
    setMOrder(true);
  };

  // ── CRUD ──────────────────────────────────────────────────
  const addProd = () => {
    if (!pF.name.trim()) return;
    const nid = products.length ? Math.max(...products.map(p=>p.id))+1 : 1;
    const np = { id:nid, name:pF.name, sku:pF.sku||`SKU-${nid}`, qty:parseInt(pF.qty)||0, buyPrice:parseFloat(pF.buy)||0, sellPrice:parseFloat(pF.sell)||0, minLevel:parseInt(pF.min)||10, image:pF.img };
    const newP = [...products, np];
    setProducts(newP); persist(newP, stores, orders, nextId);
    setPF(emP); setMProd(false);
  };

  const openEdit = p => {
    setEF({ name:p.name, sku:p.sku, qty:String(p.qty), buy:String(p.buyPrice), sell:String(p.sellPrice), min:String(p.minLevel), img:p.image||"" });
    setMEdit(p.id);
  };
  const saveEdit = () => {
    const newP = products.map(p => p.id===mEdit ? { ...p, name:eF.name||p.name, sku:eF.sku||p.sku, qty:parseInt(eF.qty)||0, buyPrice:parseFloat(eF.buy)||0, sellPrice:parseFloat(eF.sell)||0, minLevel:parseInt(eF.min)||10, image:eF.img } : p);
    setProducts(newP); persist(newP, stores, orders, nextId);
    setMEdit(null);
  };
  const deleteProd = id => {
    const newP = products.filter(x=>x.id!==id);
    setProducts(newP); persist(newP, stores, orders, nextId);
  };

  const addStore = () => {
    if (!sF.name.trim()) return;
    const nid = stores.length ? Math.max(...stores.map(s=>s.id))+1 : 1;
    const ns = { id:nid, name:sF.name, address:sF.addr, contact:sF.contact, phone:sF.phone, bulstat:sF.bulstat };
    const newS = [...stores, ns];
    setStores(newS); persist(products, newS, orders, nextId);
    setSF(emS); setMStore(false);
  };
  const openStoreEdit = s => {
    setESF({ name:s.name, addr:s.address, contact:s.contact, phone:s.phone, bulstat:s.bulstat||"" });
    setMStoreEdit(s.id);
  };
  const saveStoreEdit = () => {
    const newS = stores.map(s => s.id===mStoreEdit ? { ...s, name:eSF.name||s.name, address:eSF.addr, contact:eSF.contact, phone:eSF.phone, bulstat:eSF.bulstat } : s);
    setStores(newS); persist(products, newS, orders, nextId);
    setMStoreEdit(null);
  };
  const deleteStore = id => {
    const newS = stores.filter(x=>x.id!==id);
    setStores(newS); persist(products, newS, orders, nextId);
  };

  const submitOrder = () => {
    const items = products.filter(p=>oQtys[p.id]>0).map(p=>({ pid:p.id, qty:oQtys[p.id] }));
    if (!items.length) return;
    const sid = parseInt(oSid);
    const no  = { id:nextId, storeId:sid, date:oDate, status:"pending", items };
    const newO   = [...orders, no];
    const newP   = products.map(p=>({ ...p, qty:Math.max(0,p.qty-(oQtys[p.id]||0)) }));
    const newNid = nextId+1;
    setOrders(newO); setProducts(newP); setNextId(newNid);
    persist(newP, stores, newO, newNid);
    setMOrder(false); setPage("orders");
  };

  const applyRestock = () => {
    const newP = products.map(p=>({ ...p, qty:p.qty+(rQtys[p.id]||0) }));
    setProducts(newP); persist(newP, stores, orders, nextId);
    setMRestock(false);
  };
  const deliverOrder = id => {
    const newO = orders.map(x=>x.id===id?{...x,status:"done"}:x);
    setOrders(newO); persist(products, stores, newO, nextId);
  };
  const deleteOrder = id => {
    const newO = orders.filter(x=>x.id!==id);
    setOrders(newO); persist(products, stores, newO, nextId);
  };

  // ── LOADING ───────────────────────────────────────────────
  if (!ready) return (
    <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100vh",background:"#0f0f14",color:"#e8e8f0",gap:20 }}>
      <style>{`@keyframes bounce{0%,80%,100%{transform:scale(0.7);opacity:0.3}40%{transform:scale(1.2);opacity:1}}`}</style>
      <div style={{ fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:"1.8rem" }}><span style={{ color:"#f0c040" }}>Хабитат</span><span>-64</span></div>
      <div style={{ display:"flex",gap:8 }}>{[0,1,2].map(i=><div key={i} style={{ width:10,height:10,borderRadius:"50%",background:"#f0c040",animation:`bounce 1.2s ${i*0.2}s infinite` }} />)}</div>
      <div style={{ fontSize:"0.82rem",color:"#8888a0" }}>Зарежда...</div>
    </div>
  );

  const card = { background:"#16161e",border:"1px solid #2a2a38",borderRadius:14 };
  const editProd  = products.find(p=>p.id===mEdit);
  const editStore = stores.find(s=>s.id===mStoreEdit);

  // ── DASHBOARD ─────────────────────────────────────────────
  const Dashboard = () => {
    const tqty = products.reduce((s,p)=>s+p.qty,0);
    const tval = products.reduce((s,p)=>s+p.qty*p.buyPrice,0);
    const alrt = products.filter(p=>p.qty<=p.minLevel);
    const pend = orders.filter(o=>o.status==="pending");
    return (
      <div style={{ display:"flex",flexDirection:"column",gap:20 }}>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
          {[
            { clr:"#f0c040",icon:"📦",lbl:"В склад",      val:tqty,                  sub:`${products.length} артикула` },
            { clr:"#4ecdc4",icon:"💰",lbl:"Стойност",     val:fmt(tval),             sub:"по покупна цена" },
            { clr:"#f87171",icon:"⚠️",lbl:"Ниски",        val:alrt.length,           sub:`${products.filter(p=>p.qty===0).length} изчерпани` },
            { clr:"#4ade80",icon:"📋",lbl:"Чакащи заявки",val:pend.length,           sub:`${stores.length} обекта` },
          ].map(s=>(
            <div key={s.lbl} style={{ ...card,padding:14,position:"relative",overflow:"hidden" }}>
              <div style={{ position:"absolute",top:0,left:0,right:0,height:3,background:s.clr }} />
              <div style={{ fontSize:"1.3rem",marginBottom:4 }}>{s.icon}</div>
              <div style={{ fontSize:"0.63rem",color:"#8888a0",textTransform:"uppercase",letterSpacing:"0.8px" }}>{s.lbl}</div>
              <div style={{ fontFamily:"Syne,sans-serif",fontSize:"1.5rem",fontWeight:800,margin:"2px 0",color:s.clr }}>{s.val}</div>
              <div style={{ fontSize:"0.66rem",color:"#8888a0" }}>{s.sub}</div>
            </div>
          ))}
        </div>

        <div>
          <div style={{ fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:"0.90rem",marginBottom:10 }}>📋 Трябва да се занесе</div>
          {pend.length===0
            ? <div style={{ ...card,padding:28,textAlign:"center",color:"#8888a0",fontSize:"0.86rem" }}>✅ Няма чакащи заявки</div>
            : pend.map(o => {
                const store = stores.find(s=>s.id===o.storeId);
                return (
                  <div key={o.id} style={{ ...card,padding:"13px 14px",marginBottom:10 }}>
                    <div style={{ display:"flex",alignItems:"center",gap:8,background:"rgba(240,192,64,0.10)",border:"1px solid rgba(240,192,64,0.28)",borderRadius:10,padding:"8px 12px",marginBottom:12 }}>
                      <span style={{ fontSize:"1.2rem" }}>🏪</span>
                      <div style={{ flex:1,minWidth:0 }}>
                        <div style={{ fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:"0.88rem",color:"#f0c040",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{store?.name}</div>
                        <div style={{ fontSize:"0.67rem",color:"#8888a0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>📍 {store?.address}</div>
                      </div>
                      <span style={{ fontSize:"0.68rem",color:"#8888a0" }}>#{o.id}</span>
                    </div>
                    <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                      {o.items.map(item => {
                        const p = products.find(x=>x.id===item.pid); if(!p)return null;
                        return (
                          <div key={item.pid} style={{ display:"flex",alignItems:"center",gap:10,background:"#1a1a24",borderRadius:10,padding:"8px 10px" }}>
                            <Thumb p={p} size={44} />
                            <div style={{ flex:1,minWidth:0 }}>
                              <div style={{ fontSize:"0.82rem",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{p.name}</div>
                            </div>
                            <div style={{ fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:"1.25rem",color:"#f0c040" }}>×{item.qty}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
          }
        </div>

        {alrt.length>0 && (
          <div>
            <div style={{ fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:"0.90rem",marginBottom:10 }}>⚠️ Ниски наличности</div>
            {alrt.map(p=>(
              <div key={p.id} style={{ ...card,display:"flex",alignItems:"center",gap:12,padding:"11px 13px",marginBottom:8 }}>
                <Thumb p={p} size={44} />
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontSize:"0.84rem",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{p.name}</div>
                  <Badge t={p.qty===0?"out":"low"}>{p.qty===0?"ИЗЧЕРПАН":"НИСЪК"}</Badge>
                </div>
                <div style={{ fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:"1.3rem",color:p.qty===0?"#f87171":"#fb923c" }}>{p.qty}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ── INVENTORY ─────────────────────────────────────────────
  const Inventory = () => (
    <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
      <div style={{ display:"flex",gap:8 }}>
        <Btn v="sec" sm style={{ flex:1 }} onClick={()=>{ const q={}; products.forEach(p=>q[p.id]=0); setRQtys(q); setMRestock(true); }}>📥 Зареди</Btn>
        <Btn sm style={{ flex:1 }} onClick={()=>setMProd(true)}>＋ Нов продукт</Btn>
      </div>
      {products.length===0 && <div style={{ ...card,padding:40,textAlign:"center",color:"#8888a0" }}>Няма продукти.</div>}
      {products.map(p => {
        const st  = p.qty===0?"out":p.qty<=p.minLevel?"low":"ok";
        const bc  = st==="ok"?"#4ade80":st==="low"?"#fb923c":"#f87171";
        const pct = p.minLevel>0?Math.min(100,Math.round(p.qty/(p.minLevel*3)*100)):100;
        return (
          <div key={p.id} style={{ ...card,overflow:"hidden" }}>
            {/* IMAGE — показва URL снимка ИЛИ emoji */}
            <div style={{ height:150,background:"#1a1a24",display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden" }}>
              {p.image
                ? <img src={p.image} alt={p.name}
                    onError={e=>{ e.target.style.display="none"; e.target.nextSibling.style.display="flex"; }}
                    style={{ width:"100%",height:"100%",objectFit:"cover" }} />
                : null
              }
              <div style={{ fontSize:"4.5rem",display:p.image?"none":"flex",alignItems:"center",justifyContent:"center",width:"100%",height:"100%",position:p.image?"absolute":"relative" }}>
                {EMOJIS[(p.id-1)%EMOJIS.length]||"📦"}
              </div>
              <div style={{ position:"absolute",top:10,right:10 }}>
                <Badge t={st}>{st==="ok"?"ОК":st==="low"?"Нисък":"Изчерпан"}</Badge>
              </div>
            </div>
            <div style={{ padding:"13px 14px" }}>
              <div style={{ fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:"0.95rem",lineHeight:1.3,marginBottom:10 }}>{p.name}</div>
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8 }}>
                <div>
                  <div style={{ fontSize:"0.63rem",color:"#8888a0",textTransform:"uppercase" }}>Налично</div>
                  <div style={{ fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:"1.8rem",color:bc,lineHeight:1 }}>{p.qty}</div>
                  <div style={{ fontSize:"0.63rem",color:"#8888a0" }}>бр.</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:"0.63rem",color:"#8888a0",textTransform:"uppercase" }}>Продажна цена</div>
                  <div style={{ fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:"1.15rem",color:"#f0c040" }}>{fmt(p.sellPrice)}</div>
                  <div style={{ fontSize:"0.63rem",color:"#8888a0" }}>купуване {fmt(p.buyPrice)}</div>
                </div>
              </div>
              <div style={{ height:5,background:"#1e1e2a",borderRadius:3,overflow:"hidden",marginBottom:10 }}>
                <div style={{ height:5,width:`${pct}%`,background:bc,borderRadius:3 }} />
              </div>
              <div style={{ display:"flex",gap:8 }}>
                <Btn v="edit" sm style={{ flex:1 }} onClick={()=>openEdit(p)}>✏️ Редактирай</Btn>
                <Btn v="del"  sm style={{ flex:1 }} onClick={()=>deleteProd(p.id)}>✕ Изтрий</Btn>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  // ── ORDERS ────────────────────────────────────────────────
  const Orders = () => (
    <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
      <Btn full onClick={()=>openOrder()}>＋ Нова заявка</Btn>
      {orders.length===0 && <div style={{ ...card,padding:50,textAlign:"center",color:"#8888a0" }}>📋 Няма заявки</div>}
      {[...orders].sort((a,b)=>b.id-a.id).map(o => {
        const store = stores.find(s=>s.id===o.storeId);
        return (
          <div key={o.id} style={{ ...card,padding:"14px 14px" }}>
            <div style={{ display:"flex",alignItems:"center",gap:8,background:o.status==="pending"?"rgba(240,192,64,0.10)":"rgba(78,205,196,0.08)",border:`1px solid ${o.status==="pending"?"rgba(240,192,64,0.3)":"rgba(78,205,196,0.22)"}`,borderRadius:10,padding:"9px 12px",marginBottom:12 }}>
              <span style={{ fontSize:"1.2rem" }}>🏪</span>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:"0.90rem",color:o.status==="pending"?"#f0c040":"#4ecdc4",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{store?.name}</div>
                <div style={{ fontSize:"0.67rem",color:"#8888a0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>📍 {store?.address}</div>
              </div>
              <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:3 }}>
                <Badge t={o.status==="pending"?"pending":"done"}>{o.status==="pending"?"Чакаща":"Доставена"}</Badge>
                <span style={{ fontSize:"0.63rem",color:"#8888a0" }}>#{o.id} · {o.date}</span>
              </div>
            </div>
            <div style={{ display:"flex",flexDirection:"column",gap:8,marginBottom:12 }}>
              {o.items.map(item => {
                const p = products.find(x=>x.id===item.pid); if(!p)return null;
                return (
                  <div key={item.pid} style={{ display:"flex",alignItems:"center",gap:10,background:"#1a1a24",borderRadius:10,padding:"8px 10px" }}>
                    <Thumb p={p} size={48} />
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ fontSize:"0.84rem",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{p.name}</div>
                      <div style={{ fontSize:"0.67rem",color:"#8888a0" }}>{fmt(p.sellPrice*item.qty)}</div>
                    </div>
                    <div style={{ fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:"1.35rem",color:"#f0c040" }}>×{item.qty}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
              <span style={{ fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:"1rem",color:"#f0c040" }}>{fmt(oval(o))}</span>
              <div style={{ display:"flex",gap:7 }}>
                {o.status==="pending" && <Btn v="teal" sm onClick={()=>deliverOrder(o.id)}>✓ Доставена</Btn>}
                <Btn v="del" sm onClick={()=>deleteOrder(o.id)}>✕</Btn>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  // ── STORES — само списък, без наличности ──────────────────
  const Stores = () => (
    <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
      <Btn full onClick={()=>setMStore(true)}>＋ Нов обект</Btn>
      {stores.length===0 && <div style={{ ...card,padding:40,textAlign:"center",color:"#8888a0" }}>Няма добавени обекти.</div>}
      {stores.map(s => {
        const pendCnt = orders.filter(o=>o.storeId===s.id&&o.status==="pending").length;
        const totalOrders = orders.filter(o=>o.storeId===s.id).length;
        return (
          <div key={s.id} style={{ ...card,padding:"16px 16px" }}>
            {/* Хедър */}
            <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:14 }}>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:"1.05rem",marginBottom:4 }}>{s.name}</div>
                {pendCnt>0 && <Badge t="pending">{pendCnt} чакащи заявки</Badge>}
              </div>
              <div style={{ display:"flex",gap:6,flexShrink:0,marginLeft:10 }}>
                <Btn v="edit" sm onClick={()=>openStoreEdit(s)}>✏️</Btn>
                <Btn v="del"  sm onClick={()=>deleteStore(s.id)}>✕</Btn>
              </div>
            </div>
            {/* Инфо редове */}
            <div style={{ display:"flex",flexDirection:"column",gap:7 }}>
              {s.address && (
                <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                  <span style={{ fontSize:"1rem",flexShrink:0 }}>📍</span>
                  <span style={{ fontSize:"0.84rem",color:"#e8e8f0" }}>{s.address}</span>
                </div>
              )}
              {s.contact && (
                <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                  <span style={{ fontSize:"1rem",flexShrink:0 }}>👤</span>
                  <span style={{ fontSize:"0.84rem",color:"#e8e8f0" }}>{s.contact}</span>
                </div>
              )}
              {s.phone && (
                <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                  <span style={{ fontSize:"1rem",flexShrink:0 }}>📞</span>
                  <span style={{ fontSize:"0.84rem",color:"#e8e8f0" }}>{s.phone}</span>
                </div>
              )}
              {s.bulstat && (
                <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                  <span style={{ fontSize:"1rem",flexShrink:0 }}>🏢</span>
                  <span style={{ fontSize:"0.84rem",color:"#8888a0" }}>Булстат: </span>
                  <span style={{ fontSize:"0.84rem",color:"#e8e8f0",fontFamily:"Syne,sans-serif",fontWeight:600 }}>{s.bulstat}</span>
                </div>
              )}
              <div style={{ display:"flex",alignItems:"center",gap:8,marginTop:2 }}>
                <span style={{ fontSize:"1rem",flexShrink:0 }}>📋</span>
                <span style={{ fontSize:"0.80rem",color:"#8888a0" }}>{totalOrders} общо заявки</span>
              </div>
            </div>
            {/* Бутон заявка */}
            <div style={{ marginTop:14 }}>
              <Btn full onClick={()=>openOrder(s.id)}>＋ Нова заявка</Btn>
            </div>
          </div>
        );
      })}
    </div>
  );

  const navItems = [
    { id:"dashboard", icon:"📊", lbl:"Табло"  },
    { id:"inventory", icon:"📦", lbl:"Склад"  },
    { id:"orders",    icon:"📋", lbl:"Заявки" },
    { id:"stores",    icon:"🏪", lbl:"Обекти" },
  ];

  const numIS = { ...IS,fontSize:"1.1rem",textAlign:"center",padding:"14px" };

  return (
    <div style={{ display:"flex",flexDirection:"column",minHeight:"100vh",background:"#0f0f14",color:"#e8e8f0",fontFamily:"'DM Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        body{-webkit-tap-highlight-color:transparent;}
        input,select{-webkit-appearance:none;}
        @keyframes bounce{0%,80%,100%{transform:scale(0.7);opacity:0.3}40%{transform:scale(1.2);opacity:1}}
      `}</style>

      <header style={{ background:"#16161e",borderBottom:"1px solid #2a2a38",padding:"0 16px",height:54,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100,flexShrink:0 }}>
        <div style={{ fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:"1.15rem" }}>
          <span style={{ color:"#f0c040" }}>Хабитат</span><span style={{ color:"#e8e8f0" }}>-64</span>
        </div>
        <div style={{ fontSize:"0.78rem",color:"#8888a0" }}>{navItems.find(n=>n.id===page)?.lbl}</div>
        <div>
          {page==="inventory" && <Btn sm onClick={()=>setMProd(true)}>＋</Btn>}
          {page==="orders"    && <Btn sm onClick={()=>openOrder()}>＋</Btn>}
          {page==="stores"    && <Btn sm onClick={()=>setMStore(true)}>＋</Btn>}
          {page==="dashboard" && <div style={{ width:42 }} />}
        </div>
      </header>

      <StatusBar status={syncStatus} />

      <main style={{ flex:1,padding:"16px 14px 90px",overflowY:"auto" }}>
        {page==="dashboard" && <Dashboard />}
        {page==="inventory" && <Inventory />}
        {page==="orders"    && <Orders />}
        {page==="stores"    && <Stores />}
      </main>

      <nav style={{ position:"fixed",bottom:0,left:0,right:0,background:"#16161e",borderTop:"1px solid #2a2a38",display:"flex",zIndex:100,paddingBottom:"env(safe-area-inset-bottom,0px)" }}>
        {navItems.map(n=>(
          <button key={n.id} onClick={()=>setPage(n.id)} style={{ flex:1,background:"none",border:"none",color:page===n.id?"#f0c040":"#8888a0",cursor:"pointer",padding:"10px 4px 12px",display:"flex",flexDirection:"column",alignItems:"center",gap:3,fontFamily:"'DM Sans',sans-serif",transition:"color 0.15s" }}>
            <span style={{ fontSize:"1.35rem",lineHeight:1 }}>{n.icon}</span>
            <span style={{ fontSize:"0.62rem",fontWeight:page===n.id?700:400 }}>{n.lbl}</span>
            {page===n.id && <div style={{ width:18,height:2,background:"#f0c040",borderRadius:1 }} />}
          </button>
        ))}
      </nav>

      {/* ═══ РЕДАКТИРАЙ ПРОДУКТ ═══ */}
      <Modal open={!!mEdit} onClose={()=>setMEdit(null)} title={`✏️ ${editProd?.name||"Редактирай"}`}
        footer={[<Btn key="s" full onClick={saveEdit}>✓ Запази</Btn>,<Btn key="c" v="sec" full onClick={()=>setMEdit(null)}>Отказ</Btn>]}>
        <FG label="URL на снимка">
          <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:8 }}>
            <div style={{ width:64,height:64,borderRadius:12,background:"#1a1a24",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.8rem",flexShrink:0,border:"1px solid #2a2a38" }}>
              {eF.img ? <img src={eF.img} style={{ width:"100%",height:"100%",objectFit:"cover" }} onError={e=>e.target.style.display="none"} /> : EMOJIS[(mEdit-1)%EMOJIS.length]||"📦"}
            </div>
            <input style={{ ...IS,flex:1 }} placeholder="https://example.com/product.jpg" value={eF.img} onChange={e=>setEF(f=>({...f,img:e.target.value}))} />
          </div>
        </FG>
        <FG label="Наименование"><input style={IS} value={eF.name} onChange={e=>setEF(f=>({...f,name:e.target.value}))} /></FG>
        <FG label="SKU / Код"><input style={IS} value={eF.sku} onChange={e=>setEF(f=>({...f,sku:e.target.value}))} /></FG>
        <FG label="Налично количество (бр.)">
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <button onClick={()=>setEF(f=>({...f,qty:String(Math.max(0,(parseInt(f.qty)||0)-1))}))} style={{ width:48,height:48,background:"#2a2a38",border:"none",color:"#e8e8f0",borderRadius:10,cursor:"pointer",fontSize:"1.4rem",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>−</button>
            <input style={{ ...numIS,flex:1 }} type="number" inputMode="numeric" pattern="[0-9]*" value={eF.qty} onChange={e=>setEF(f=>({...f,qty:e.target.value}))} />
            <button onClick={()=>setEF(f=>({...f,qty:String((parseInt(f.qty)||0)+1)}))} style={{ width:48,height:48,background:"#2a2a38",border:"none",color:"#e8e8f0",borderRadius:10,cursor:"pointer",fontSize:"1.4rem",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>+</button>
          </div>
        </FG>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
          <FG label="Цена купуване (€)"><input style={IS} type="number" step="0.01" inputMode="decimal" value={eF.buy} onChange={e=>setEF(f=>({...f,buy:e.target.value}))} /></FG>
          <FG label="Цена продажба (€)"><input style={IS} type="number" step="0.01" inputMode="decimal" value={eF.sell} onChange={e=>setEF(f=>({...f,sell:e.target.value}))} /></FG>
        </div>
        <FG label="Мин. ниво (предупреждение)"><input style={IS} type="number" inputMode="numeric" value={eF.min} onChange={e=>setEF(f=>({...f,min:e.target.value}))} /></FG>
      </Modal>

      {/* ═══ НОВ ПРОДУКТ ═══ */}
      <Modal open={mProd} onClose={()=>setMProd(false)} title="📦 Нов продукт"
        footer={[<Btn key="s" full onClick={addProd}>✓ Добави и запази</Btn>,<Btn key="c" v="sec" full onClick={()=>setMProd(false)}>Отказ</Btn>]}>
        <FG label="URL на снимка (по желание)">
          <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:8 }}>
            <div style={{ width:56,height:56,borderRadius:12,background:"#1a1a24",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.6rem",flexShrink:0,border:"1px solid #2a2a38" }}>
              {pF.img ? <img src={pF.img} style={{ width:"100%",height:"100%",objectFit:"cover" }} onError={e=>e.target.style.display="none"} /> : "📷"}
            </div>
            <input style={{ ...IS,flex:1 }} placeholder="https://example.com/product.jpg" value={pF.img} onChange={e=>setPF(f=>({...f,img:e.target.value}))} />
          </div>
        </FG>
        <FG label="Наименование"><input style={IS} placeholder="напр. Бонбони Амос" value={pF.name} onChange={e=>setPF(f=>({...f,name:e.target.value}))} /></FG>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
          <FG label="SKU"><input style={IS} placeholder="AMO-WC" value={pF.sku} onChange={e=>setPF(f=>({...f,sku:e.target.value}))} /></FG>
          <FG label="Количество"><input style={IS} type="number" inputMode="numeric" pattern="[0-9]*" placeholder="0" value={pF.qty} onChange={e=>setPF(f=>({...f,qty:e.target.value}))} /></FG>
          <FG label="Цена купуване (€)"><input style={IS} type="number" step="0.01" inputMode="decimal" placeholder="0.00" value={pF.buy} onChange={e=>setPF(f=>({...f,buy:e.target.value}))} /></FG>
          <FG label="Цена продажба (€)"><input style={IS} type="number" step="0.01" inputMode="decimal" placeholder="0.00" value={pF.sell} onChange={e=>setPF(f=>({...f,sell:e.target.value}))} /></FG>
        </div>
        <FG label="Мин. ниво"><input style={IS} type="number" inputMode="numeric" value={pF.min} onChange={e=>setPF(f=>({...f,min:e.target.value}))} /></FG>
      </Modal>

      {/* ═══ ЗАРЕДИ ═══ */}
      <Modal open={mRestock} onClose={()=>setMRestock(false)} title="📥 Зареди от производител"
        footer={[<Btn key="a" full onClick={applyRestock}>✓ Потвърди</Btn>,<Btn key="c" v="sec" full onClick={()=>setMRestock(false)}>Отказ</Btn>]}>
        {products.map(p=>(
          <div key={p.id} style={{ display:"flex",alignItems:"center",gap:12,padding:"11px 0",borderBottom:"1px solid #1e1e2a" }}>
            <Thumb p={p} size={44} />
            <div style={{ flex:1,minWidth:0 }}>
              <div style={{ fontWeight:600,fontSize:"0.86rem",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{p.name}</div>
              <div style={{ fontSize:"0.68rem",color:"#8888a0" }}>В склад: {p.qty} бр.</div>
            </div>
            <div style={{ display:"flex",alignItems:"center",gap:6 }}>
              <span style={{ fontSize:"0.68rem",color:"#8888a0" }}>+ бр.:</span>
              <input type="number" inputMode="numeric" pattern="[0-9]*" min="0" defaultValue="0"
                onChange={e=>setRQtys(q=>({...q,[p.id]:parseInt(e.target.value)||0}))}
                style={{ ...IS,width:80,textAlign:"center" }} />
            </div>
          </div>
        ))}
      </Modal>

      {/* ═══ НОВ ОБЕКТ ═══ */}
      <Modal open={mStore} onClose={()=>setMStore(false)} title="🏪 Нов обект"
        footer={[<Btn key="s" full onClick={addStore}>✓ Добави и запази</Btn>,<Btn key="c" v="sec" full onClick={()=>setMStore(false)}>Отказ</Btn>]}>
        <FG label="Наименование"><input style={IS} placeholder='Магазин "Нов"' value={sF.name} onChange={e=>setSF(f=>({...f,name:e.target.value}))} /></FG>
        <FG label="Адрес"><input style={IS} placeholder="ул. ..." value={sF.addr} onChange={e=>setSF(f=>({...f,addr:e.target.value}))} /></FG>
        <FG label="Контактно лице"><input style={IS} placeholder="Иван Иванов" value={sF.contact} onChange={e=>setSF(f=>({...f,contact:e.target.value}))} /></FG>
        <FG label="Телефон"><input style={IS} placeholder="088..." value={sF.phone} onChange={e=>setSF(f=>({...f,phone:e.target.value}))} /></FG>
        <FG label="Булстат"><input style={IS} placeholder="123456789" value={sF.bulstat} onChange={e=>setSF(f=>({...f,bulstat:e.target.value}))} /></FG>
      </Modal>

      {/* ═══ РЕДАКТИРАЙ ОБЕКТ ═══ */}
      <Modal open={!!mStoreEdit} onClose={()=>setMStoreEdit(null)} title={`✏️ ${editStore?.name||"Редактирай обект"}`}
        footer={[<Btn key="s" full onClick={saveStoreEdit}>✓ Запази</Btn>,<Btn key="c" v="sec" full onClick={()=>setMStoreEdit(null)}>Отказ</Btn>]}>
        <FG label="Наименование"><input style={IS} value={eSF.name} onChange={e=>setESF(f=>({...f,name:e.target.value}))} /></FG>
        <FG label="Адрес"><input style={IS} value={eSF.addr} onChange={e=>setESF(f=>({...f,addr:e.target.value}))} /></FG>
        <FG label="Контактно лице"><input style={IS} value={eSF.contact} onChange={e=>setESF(f=>({...f,contact:e.target.value}))} /></FG>
        <FG label="Телефон"><input style={IS} value={eSF.phone} onChange={e=>setESF(f=>({...f,phone:e.target.value}))} /></FG>
        <FG label="Булстат"><input style={IS} value={eSF.bulstat} onChange={e=>setESF(f=>({...f,bulstat:e.target.value}))} /></FG>
      </Modal>

      {/* ═══ НОВА ЗАЯВКА ═══ */}
      <Modal open={mOrder} onClose={()=>setMOrder(false)} title="📋 Нова заявка"
        footer={[<Btn key="s" full onClick={submitOrder}>✓ Изпрати — {fmt(ototal)}</Btn>,<Btn key="c" v="sec" full onClick={()=>setMOrder(false)}>Отказ</Btn>]}>
        <FG label="Обект">
          <select value={oSid} onChange={e=>setOSid(e.target.value)} style={IS}>
            {stores.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </FG>
        <FG label="Дата"><input style={IS} type="date" value={oDate} onChange={e=>setODate(e.target.value)} /></FG>
        {oSid && (() => { const s=stores.find(x=>x.id==oSid); return s?(
          <div style={{ background:"rgba(240,192,64,0.08)",border:"1px solid rgba(240,192,64,0.24)",borderRadius:10,padding:"9px 12px",marginBottom:14 }}>
            <div style={{ fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:"0.86rem" }}>{s.name}</div>
            <div style={{ fontSize:"0.68rem",color:"#8888a0" }}>📍 {s.address} · 👤 {s.contact}</div>
          </div>
        ):null; })()}
        <div style={{ fontSize:"0.68rem",color:"#8888a0",textTransform:"uppercase",letterSpacing:"0.7px",marginBottom:10 }}>Избери продукти</div>
        <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
          {products.map(p=>(
            <div key={p.id} style={{ background:"#1a1a24",borderRadius:11,padding:"10px 12px",border:`1px solid ${(oQtys[p.id]||0)>0?"rgba(240,192,64,0.45)":"transparent"}` }}>
              <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:8 }}>
                <Thumb p={p} size={42} />
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontWeight:600,fontSize:"0.84rem",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{p.name}</div>
                  <div style={{ fontSize:"0.67rem",color:"#8888a0" }}>Склад: {p.qty} бр. · {fmt(p.sellPrice)}/бр.</div>
                  {(oQtys[p.id]||0)>0&&<div style={{ fontSize:"0.72rem",color:"#f0c040",fontWeight:600 }}>= {fmt((oQtys[p.id]||0)*p.sellPrice)}</div>}
                </div>
              </div>
              <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                <button onClick={()=>setOQtys(q=>({...q,[p.id]:Math.max(0,(q[p.id]||0)-1)}))}
                  style={{ width:44,height:44,background:"#2a2a38",border:"none",color:"#e8e8f0",borderRadius:10,cursor:"pointer",fontSize:"1.3rem",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>−</button>
                <input type="number" inputMode="numeric" pattern="[0-9]*" min="0" max={p.qty}
                  value={oQtys[p.id]||0}
                  onChange={e=>setOQtys(q=>({...q,[p.id]:Math.min(p.qty,Math.max(0,parseInt(e.target.value)||0))}))}
                  style={{ flex:1,background:"#0f0f14",border:`1px solid ${(oQtys[p.id]||0)>0?"rgba(240,192,64,0.5)":"#2a2a38"}`,color:(oQtys[p.id]||0)>0?"#f0c040":"#e8e8f0",borderRadius:10,padding:"10px",fontFamily:"Syne,sans-serif",fontSize:"1.2rem",fontWeight:800,outline:"none",textAlign:"center" }} />
                <button onClick={()=>setOQtys(q=>({...q,[p.id]:Math.min(p.qty,(q[p.id]||0)+1)}))}
                  style={{ width:44,height:44,background:"#2a2a38",border:"none",color:"#e8e8f0",borderRadius:10,cursor:"pointer",fontSize:"1.3rem",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>+</button>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
