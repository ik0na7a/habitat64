import { useState, useRef, useEffect, useCallback } from "react";

// ── JSONBIN НАСТРОЙКИ ────────────────────────────────────────
const JSONBIN_ID  = "6a0b76656610dd3ae867ec11";
const JSONBIN_KEY = "$2a$10$BQmK0hFCCUIC/YcQqnsAM.aMYK.Eacie03ylZ/N6DLuq1pdtsbfsO";
const BIN_URL     = `https://api.jsonbin.io/v3/b/${JSONBIN_ID}`;
const HEADERS     = { "Content-Type": "application/json", "X-Access-Key": JSONBIN_KEY };

async function loadData() {
  const res = await fetch(`${BIN_URL}/latest`, { headers: HEADERS });
  const json = await res.json();
  return json.record;
}

async function saveData(data) {
  await fetch(BIN_URL, {
    method: "PUT",
    headers: HEADERS,
    body: JSON.stringify(data),
  });
}

// ── НАЧАЛНИ ДАННИ (само ако базата е празна) ─────────────────
const EMPTY_STATE = {
  products: [],
  stores: [],
  storeStock: {},
  orders: [],
  nextId: 1001,
};

// ── EMOJI FALLBACKS ──────────────────────────────────────────
const EMOJI_DEFAULTS = ["🍬","🥛","💧","🫙","🍚","🧃","🥤","🍫","🥚","🧀"];

// ── MINI COMPONENTS ──────────────────────────────────────────
function Thumb({ p, size = 52 }) {
  const emoji = EMOJI_DEFAULTS[(p.id - 1) % EMOJI_DEFAULTS.length] || "📦";
  if (p.image) {
    return <img src={p.image} alt={p.name}
      style={{ width: size, height: size, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />;
  }
  return (
    <div style={{ width: size, height: size, borderRadius: 10, background: "#1a1a24",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.46, flexShrink: 0 }}>
      {emoji}
    </div>
  );
}

function Badge({ t, children }) {
  const m = {
    ok:      ["rgba(74,222,128,0.18)",  "#4ade80"],
    low:     ["rgba(251,146,60,0.18)",  "#fb923c"],
    out:     ["rgba(248,113,113,0.18)", "#f87171"],
    pending: ["rgba(240,192,64,0.18)",  "#f0c040"],
    done:    ["rgba(78,205,196,0.18)",  "#4ecdc4"],
  };
  return (
    <span style={{ background: m[t][0], color: m[t][1], padding: "4px 10px",
      borderRadius: 20, fontSize: "0.70rem", fontWeight: 700,
      display: "inline-block", whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

function Btn({ v = "pri", sm, onClick, children, style = {}, full }) {
  const base = {
    cursor: "pointer", borderRadius: 10, fontFamily: "'DM Sans',sans-serif",
    fontWeight: 600, fontSize: sm ? "0.80rem" : "0.90rem",
    padding: sm ? "8px 14px" : "11px 20px",
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    gap: 6, border: "none", width: full ? "100%" : "auto", ...style,
  };
  const vs = {
    pri:  { background: "#f0c040", color: "#0f0f14" },
    sec:  { background: "#1e1e2a", color: "#e8e8f0", border: "1px solid #2a2a38" },
    del:  { background: "rgba(248,113,113,0.15)", color: "#f87171", border: "1px solid rgba(248,113,113,0.3)" },
    teal: { background: "rgba(78,205,196,0.15)", color: "#4ecdc4", border: "1px solid rgba(78,205,196,0.3)" },
  };
  return <button style={{ ...base, ...vs[v] }} onClick={onClick}>{children}</button>;
}

const IS = {
  width: "100%", background: "#1e1e2a", border: "1px solid #2a2a38",
  color: "#e8e8f0", borderRadius: 10, padding: "12px 14px",
  fontFamily: "'DM Sans',sans-serif", fontSize: "0.93rem", outline: "none",
};

function FG({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: "0.70rem", color: "#8888a0",
        marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.6px" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null;
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.80)",
        display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 200 }}>
      <div style={{ background: "#16161e", border: "1px solid #2a2a38",
        borderRadius: "20px 20px 0 0", padding: "24px 20px 40px",
        width: "100%", maxWidth: 560, maxHeight: "92vh", overflowY: "auto" }}>
        <div style={{ width: 40, height: 4, background: "#2a2a38",
          borderRadius: 2, margin: "0 auto 18px" }} />
        <div style={{ fontFamily: "Syne,sans-serif", fontSize: "1.05rem",
          fontWeight: 700, marginBottom: 18 }}>{title}</div>
        {children}
        {footer && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8,
            marginTop: 20, paddingTop: 16, borderTop: "1px solid #2a2a38" }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

function ImgUpload({ val, onChange }) {
  const ref = useRef();
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
        <div style={{ width: 72, height: 72, borderRadius: 14, background: "#1a1a24",
          overflow: "hidden", display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: "2rem", flexShrink: 0,
          border: "1px solid #2a2a38" }}>
          {val ? <img src={val} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "📷"}
        </div>
        <Btn v="sec" style={{ flex: 1 }} onClick={() => ref.current.click()}>
          📁 Качи снимка от телефона
        </Btn>
      </div>
      <input style={IS} placeholder="или постави URL на снимка (https://...)"
        value={val} onChange={e => onChange(e.target.value)} />
      <input ref={ref} type="file" accept="image/*" style={{ display: "none" }}
        onChange={e => {
          const f = e.target.files[0]; if (!f) return;
          const r = new FileReader();
          r.onload = ev => onChange(ev.target.result);
          r.readAsDataURL(f);
        }} />
    </div>
  );
}

// ── СТАТУС БАР ───────────────────────────────────────────────
function StatusBar({ status }) {
  const cfg = {
    saving:  { bg: "rgba(240,192,64,0.15)",  border: "rgba(240,192,64,0.35)",  color: "#f0c040", text: "💾 Запазва се..." },
    saved:   { bg: "rgba(74,222,128,0.12)",  border: "rgba(74,222,128,0.30)",  color: "#4ade80", text: "✓ Запазено"       },
    error:   { bg: "rgba(248,113,113,0.15)", border: "rgba(248,113,113,0.35)", color: "#f87171", text: "⚠ Грешка при запис" },
    loading: { bg: "rgba(78,205,196,0.12)",  border: "rgba(78,205,196,0.30)",  color: "#4ecdc4", text: "⏳ Зарежда..."     },
  };
  if (!status || !cfg[status]) return null;
  const c = cfg[status];
  return (
    <div style={{ position: "fixed", top: 62, right: 12,
      background: c.bg, border: `1px solid ${c.border}`,
      borderRadius: 8, padding: "5px 12px", fontSize: "0.72rem",
      color: c.color, zIndex: 150, fontWeight: 600 }}>
      {c.text}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  ГЛАВЕН КОМПОНЕНТ
// ══════════════════════════════════════════════════════════════
export default function App() {
  const [ready,      setReady]      = useState(false);
  const [syncStatus, setSyncStatus] = useState("loading");
  const [page,       setPage]       = useState("dashboard");

  // ДАННИ
  const [products,   setProducts]   = useState([]);
  const [stores,     setStores]     = useState([]);
  const [storeStock, setStoreStock] = useState({});
  const [orders,     setOrders]     = useState([]);
  const [nextId,     setNextId]     = useState(1001);

  // МОДАЛНИ ПРОЗОРЦИ
  const [mProd,    setMProd]    = useState(false);
  const [mStore,   setMStore]   = useState(false);
  const [mOrder,   setMOrder]   = useState(false);
  const [mRestock, setMRestock] = useState(false);
  const [mSD,      setMSD]      = useState(null);

  // ФОРМИ
  const emP = { name: "", sku: "", qty: "", buy: "", sell: "", min: "10", img: "" };
  const emS = { name: "", addr: "", contact: "", phone: "" };
  const [pF,    setPF]    = useState(emP);
  const [sF,    setSF]    = useState(emS);
  const [oSid,  setOSid]  = useState("");
  const [oDate, setODate] = useState(new Date().toISOString().split("T")[0]);
  const [oQtys, setOQtys] = useState({});
  const [rQtys, setRQtys] = useState({});

  // ── ЗАРЕЖДАНЕ ПРИ СТАРТИРАНЕ ─────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const data = await loadData();
        const d = { ...EMPTY_STATE, ...data };
        setProducts(d.products   || []);
        setStores(d.stores       || []);
        setStoreStock(d.storeStock || {});
        setOrders(d.orders       || []);
        setNextId(d.nextId       || 1001);
        setSyncStatus("saved");
        setTimeout(() => setSyncStatus(null), 1500);
      } catch (e) {
        console.error(e);
        setSyncStatus("error");
      } finally {
        setReady(true);
      }
    })();
  }, []);

  // ── ЗАПАЗВАНЕ В JSONBIN ──────────────────────────────────
  const saveTimer = useRef(null);

  const persist = useCallback((p, s, ss, o, nid) => {
    clearTimeout(saveTimer.current);
    setSyncStatus("saving");
    saveTimer.current = setTimeout(async () => {
      try {
        await saveData({ products: p, stores: s, storeStock: ss, orders: o, nextId: nid });
        setSyncStatus("saved");
        setTimeout(() => setSyncStatus(null), 2000);
      } catch {
        setSyncStatus("error");
      }
    }, 800);
  }, []);

  // ── ПОМОЩНИ ФУНКЦИИ ──────────────────────────────────────
  const oval   = o => o.items.reduce((s, i) => {
    const p = products.find(x => x.id === i.pid);
    return s + (p ? p.sellPrice * i.qty : 0);
  }, 0);
  const ototal = products.reduce((s, p) => s + (oQtys[p.id] || 0) * p.sellPrice, 0);

  const openOrder = sid => {
    const q = {}; products.forEach(p => q[p.id] = 0);
    setOQtys(q);
    setOSid(sid || stores[0]?.id || "");
    setODate(new Date().toISOString().split("T")[0]);
    setMOrder(true);
  };

  // ── CRUD ОПЕРАЦИИ ────────────────────────────────────────
  const addProd = () => {
    if (!pF.name.trim()) return;
    const nid = products.length ? Math.max(...products.map(p => p.id)) + 1 : 1;
    const np = { id: nid, name: pF.name, sku: pF.sku || `SKU-${nid}`,
      qty: parseInt(pF.qty) || 0, buyPrice: parseFloat(pF.buy) || 0,
      sellPrice: parseFloat(pF.sell) || 0, minLevel: parseInt(pF.min) || 10, image: pF.img };
    const newP = [...products, np];
    const newSS = { ...storeStock };
    stores.forEach(s => { if (!newSS[s.id]) newSS[s.id] = {}; newSS[s.id][nid] = 0; });
    setProducts(newP); setStoreStock(newSS);
    persist(newP, stores, newSS, orders, nextId);
    setPF(emP); setMProd(false);
  };

  const addStore = () => {
    if (!sF.name.trim()) return;
    const nid = stores.length ? Math.max(...stores.map(s => s.id)) + 1 : 1;
    const ns = { id: nid, name: sF.name, address: sF.addr, contact: sF.contact, phone: sF.phone };
    const newS = [...stores, ns];
    const newSS = { ...storeStock, [nid]: {} };
    products.forEach(p => newSS[nid][p.id] = 0);
    setStores(newS); setStoreStock(newSS);
    persist(products, newS, newSS, orders, nextId);
    setSF(emS); setMStore(false);
  };

  const submitOrder = () => {
    const items = products.filter(p => oQtys[p.id] > 0).map(p => ({ pid: p.id, qty: oQtys[p.id] }));
    if (!items.length) return;
    const sid = parseInt(oSid);
    const no  = { id: nextId, storeId: sid, date: oDate, status: "pending", items };
    const newOrders   = [...orders, no];
    const newProducts = products.map(p => ({ ...p, qty: Math.max(0, p.qty - (oQtys[p.id] || 0)) }));
    const newSS = { ...storeStock };
    if (!newSS[sid]) newSS[sid] = {};
    items.forEach(i => newSS[sid][i.pid] = (newSS[sid][i.pid] || 0) + i.qty);
    const newNid = nextId + 1;
    setOrders(newOrders); setProducts(newProducts); setStoreStock(newSS); setNextId(newNid);
    persist(newProducts, stores, newSS, newOrders, newNid);
    setMOrder(false); setPage("orders");
  };

  const applyRestock = () => {
    const newP = products.map(p => ({ ...p, qty: p.qty + (rQtys[p.id] || 0) }));
    setProducts(newP);
    persist(newP, stores, storeStock, orders, nextId);
    setMRestock(false);
  };

  const deliverOrder = id => {
    const newO = orders.map(x => x.id === id ? { ...x, status: "done" } : x);
    setOrders(newO); persist(products, stores, storeStock, newO, nextId);
  };

  const deleteOrder = id => {
    const newO = orders.filter(x => x.id !== id);
    setOrders(newO); persist(products, stores, storeStock, newO, nextId);
  };

  const deleteProd = id => {
    const newP = products.filter(x => x.id !== id);
    setProducts(newP); persist(newP, stores, storeStock, orders, nextId);
  };

  const updateStock = (storeId, productId, val) => {
    const newSS = { ...storeStock, [storeId]: { ...storeStock[storeId], [productId]: val } };
    setStoreStock(newSS); persist(products, stores, newSS, orders, nextId);
  };

  // ── LOADING ЕКРАН ────────────────────────────────────────
  if (!ready) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", height: "100vh", background: "#0f0f14",
      color: "#e8e8f0", gap: 20 }}>
      <style>{`@keyframes bounce{0%,80%,100%{transform:scale(0.7);opacity:0.3}40%{transform:scale(1.2);opacity:1}}`}</style>
      <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: "1.8rem" }}>
        <span style={{ color: "#f0c040" }}>Хабитат</span>
        <span style={{ color: "#e8e8f0" }}>-64</span>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ width: 10, height: 10, borderRadius: "50%",
            background: "#f0c040", animation: `bounce 1.2s ${i * 0.2}s infinite` }} />
        ))}
      </div>
      <div style={{ fontSize: "0.82rem", color: "#8888a0" }}>Зарежда данните от сървъра...</div>
    </div>
  );

  const card = { background: "#16161e", border: "1px solid #2a2a38", borderRadius: 14 };
  const detStore = stores.find(s => s.id === mSD);

  // ── СТРАНИЦА: ТАБЛО ──────────────────────────────────────
  const Dashboard = () => {
    const tqty = products.reduce((s, p) => s + p.qty, 0);
    const tval = products.reduce((s, p) => s + p.qty * p.buyPrice, 0);
    const alrt = products.filter(p => p.qty <= p.minLevel);
    const pend = orders.filter(o => o.status === "pending");

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* СТАТИСТИКИ */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { clr: "#f0c040", icon: "📦", lbl: "В склад",       val: tqty,                   sub: `${products.length} артикула` },
            { clr: "#4ecdc4", icon: "💰", lbl: "Стойност",      val: `${tval.toFixed(0)} лв`, sub: "по покупна цена" },
            { clr: "#f87171", icon: "⚠️", lbl: "Ниски",         val: alrt.length,             sub: `${products.filter(p=>p.qty===0).length} изчерпани` },
            { clr: "#4ade80", icon: "📋", lbl: "Чакащи заявки", val: pend.length,             sub: `${stores.length} обекта` },
          ].map(s => (
            <div key={s.lbl} style={{ ...card, padding: 14, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: s.clr }} />
              <div style={{ fontSize: "1.3rem", marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontSize: "0.63rem", color: "#8888a0", textTransform: "uppercase", letterSpacing: "0.8px" }}>{s.lbl}</div>
              <div style={{ fontFamily: "Syne,sans-serif", fontSize: "1.5rem", fontWeight: 800, margin: "2px 0", color: s.clr }}>{s.val}</div>
              <div style={{ fontSize: "0.66rem", color: "#8888a0" }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* ЧАКАЩИ ЗАЯВКИ */}
        <div>
          <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: "0.90rem", marginBottom: 10 }}>
            📋 Трябва да се занесе
          </div>
          {pend.length === 0
            ? <div style={{ ...card, padding: 28, textAlign: "center", color: "#8888a0", fontSize: "0.86rem" }}>
                ✅ Няма чакащи заявки
              </div>
            : pend.map(o => {
                const store = stores.find(s => s.id === o.storeId);
                return (
                  <div key={o.id} style={{ ...card, padding: "13px 14px", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8,
                      background: "rgba(240,192,64,0.10)", border: "1px solid rgba(240,192,64,0.28)",
                      borderRadius: 10, padding: "8px 12px", marginBottom: 12 }}>
                      <span style={{ fontSize: "1.2rem" }}>🏪</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 700,
                          fontSize: "0.88rem", color: "#f0c040",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {store?.name}
                        </div>
                        <div style={{ fontSize: "0.67rem", color: "#8888a0",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          📍 {store?.address}
                        </div>
                      </div>
                      <span style={{ fontSize: "0.68rem", color: "#8888a0" }}>#{o.id}</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {o.items.map(item => {
                        const p = products.find(x => x.id === item.pid);
                        if (!p) return null;
                        return (
                          <div key={item.pid} style={{ display: "flex", alignItems: "center",
                            gap: 10, background: "#1a1a24", borderRadius: 10, padding: "8px 10px" }}>
                            <Thumb p={p} size={44} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: "0.82rem", fontWeight: 600, lineHeight: 1.25,
                                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {p.name}
                              </div>
                            </div>
                            <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 800,
                              fontSize: "1.25rem", color: "#f0c040" }}>×{item.qty}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
          }
        </div>

        {/* НИСКИ НАЛИЧНОСТИ */}
        {alrt.length > 0 && (
          <div>
            <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 700,
              fontSize: "0.90rem", marginBottom: 10 }}>⚠️ Ниски наличности</div>
            {alrt.map(p => (
              <div key={p.id} style={{ ...card, display: "flex", alignItems: "center",
                gap: 12, padding: "11px 13px", marginBottom: 8 }}>
                <Thumb p={p} size={44} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.84rem", fontWeight: 600,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                  <Badge t={p.qty === 0 ? "out" : "low"}>{p.qty === 0 ? "ИЗЧЕРПАН" : "НИСЪК"}</Badge>
                </div>
                <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 800,
                  fontSize: "1.3rem", color: p.qty === 0 ? "#f87171" : "#fb923c" }}>{p.qty}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ── СТРАНИЦА: СКЛАД ──────────────────────────────────────
  const Inventory = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <Btn v="sec" sm style={{ flex: 1 }} onClick={() => {
          const q = {}; products.forEach(p => q[p.id] = 0); setRQtys(q); setMRestock(true);
        }}>📥 Зареди</Btn>
        <Btn sm style={{ flex: 1 }} onClick={() => setMProd(true)}>＋ Нов продукт</Btn>
      </div>

      {products.length === 0 && (
        <div style={{ ...card, padding: 40, textAlign: "center", color: "#8888a0" }}>
          Няма добавени продукти.<br />
          <span style={{ fontSize: "0.80rem" }}>Натисни „+ Нов продукт" за начало.</span>
        </div>
      )}

      {products.map(p => {
        const st  = p.qty === 0 ? "out" : p.qty <= p.minLevel ? "low" : "ok";
        const bc  = st === "ok" ? "#4ade80" : st === "low" ? "#fb923c" : "#f87171";
        const pct = p.minLevel > 0 ? Math.min(100, Math.round(p.qty / (p.minLevel * 3) * 100)) : 100;
        return (
          <div key={p.id} style={{ ...card, overflow: "hidden" }}>
            <div style={{ height: 160, background: "#1a1a24", display: "flex",
              alignItems: "center", justifyContent: "center",
              position: "relative", overflow: "hidden" }}>
              {p.image
                ? <img src={p.image} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ fontSize: "5rem" }}>{EMOJI_DEFAULTS[(p.id-1)%EMOJI_DEFAULTS.length]||"📦"}</div>
              }
              <div style={{ position: "absolute", top: 10, right: 10 }}>
                <Badge t={st}>{st==="ok"?"ОК":st==="low"?"Нисък":"Изчерпан"}</Badge>
              </div>
            </div>
            <div style={{ padding: "13px 14px" }}>
              <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 700,
                fontSize: "0.95rem", lineHeight: 1.3, marginBottom: 12 }}>{p.name}</div>
              <div style={{ display: "flex", alignItems: "center",
                justifyContent: "space-between", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: "0.63rem", color: "#8888a0", textTransform: "uppercase" }}>Налично</div>
                  <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 800,
                    fontSize: "1.8rem", color: bc, lineHeight: 1 }}>{p.qty}</div>
                  <div style={{ fontSize: "0.63rem", color: "#8888a0" }}>бр.</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.63rem", color: "#8888a0", textTransform: "uppercase" }}>Продажна цена</div>
                  <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 700,
                    fontSize: "1.15rem", color: "#f0c040" }}>{p.sellPrice.toFixed(2)} лв.</div>
                  <div style={{ fontSize: "0.63rem", color: "#8888a0" }}>купуване {p.buyPrice.toFixed(2)} лв.</div>
                </div>
              </div>
              <div style={{ height: 5, background: "#1e1e2a", borderRadius: 3, overflow: "hidden", marginBottom: 5 }}>
                <div style={{ height: 5, width: `${pct}%`, background: bc, borderRadius: 3, transition: "width 0.4s" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: "0.63rem", color: "#8888a0" }}>Мин. {p.minLevel} бр. · {p.sku}</div>
                <Btn v="del" sm onClick={() => deleteProd(p.id)}>✕ Изтрий</Btn>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  // ── СТРАНИЦА: ЗАЯВКИ ─────────────────────────────────────
  const Orders = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Btn full onClick={() => openOrder()}>＋ Нова заявка</Btn>

      {orders.length === 0 && (
        <div style={{ ...card, padding: 50, textAlign: "center", color: "#8888a0" }}>📋 Няма заявки</div>
      )}

      {[...orders].sort((a, b) => b.id - a.id).map(o => {
        const store = stores.find(s => s.id === o.storeId);
        return (
          <div key={o.id} style={{ ...card, padding: "14px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8,
              background: o.status==="pending" ? "rgba(240,192,64,0.10)" : "rgba(78,205,196,0.08)",
              border: `1px solid ${o.status==="pending" ? "rgba(240,192,64,0.3)" : "rgba(78,205,196,0.22)"}`,
              borderRadius: 10, padding: "9px 12px", marginBottom: 12 }}>
              <span style={{ fontSize: "1.2rem" }}>🏪</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: "0.90rem",
                  color: o.status==="pending" ? "#f0c040" : "#4ecdc4",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {store?.name}
                </div>
                <div style={{ fontSize: "0.67rem", color: "#8888a0",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  📍 {store?.address}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                <Badge t={o.status==="pending" ? "pending" : "done"}>
                  {o.status==="pending" ? "Чакаща" : "Доставена"}
                </Badge>
                <span style={{ fontSize: "0.63rem", color: "#8888a0" }}>#{o.id} · {o.date}</span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
              {o.items.map(item => {
                const p = products.find(x => x.id === item.pid);
                if (!p) return null;
                return (
                  <div key={item.pid} style={{ display: "flex", alignItems: "center",
                    gap: 10, background: "#1a1a24", borderRadius: 10, padding: "8px 10px" }}>
                    <Thumb p={p} size={48} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.84rem", fontWeight: 600, lineHeight: 1.3,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                      <div style={{ fontSize: "0.67rem", color: "#8888a0" }}>
                        {(p.sellPrice * item.qty).toFixed(2)} лв.
                      </div>
                    </div>
                    <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 800,
                      fontSize: "1.35rem", color: "#f0c040" }}>×{item.qty}</div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontFamily: "Syne,sans-serif", fontWeight: 700,
                fontSize: "1rem", color: "#f0c040" }}>{oval(o).toFixed(2)} лв.</span>
              <div style={{ display: "flex", gap: 7 }}>
                {o.status==="pending" && (
                  <Btn v="teal" sm onClick={() => deliverOrder(o.id)}>✓ Доставена</Btn>
                )}
                <Btn v="del" sm onClick={() => deleteOrder(o.id)}>✕</Btn>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  // ── СТРАНИЦА: ОБЕКТИ ─────────────────────────────────────
  const Stores = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Btn full onClick={() => setMStore(true)}>＋ Нов обект</Btn>

      {stores.length === 0 && (
        <div style={{ ...card, padding: 40, textAlign: "center", color: "#8888a0" }}>
          Няма добавени обекти.
        </div>
      )}

      {stores.map(s => {
        const stk     = storeStock[s.id] || {};
        const pendCnt = orders.filter(o => o.storeId === s.id && o.status === "pending").length;
        return (
          <div key={s.id} style={{ ...card, padding: "14px 14px" }}>
            <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 700,
              fontSize: "0.98rem", marginBottom: 3 }}>{s.name}</div>
            <div style={{ fontSize: "0.76rem", color: "#8888a0", marginBottom: 10 }}>
              📍 {s.address}
            </div>
            {pendCnt > 0 && (
              <div style={{ marginBottom: 10 }}>
                <Badge t="pending">{pendCnt} чакащи заявки</Badge>
              </div>
            )}
            <div style={{ fontSize: "0.63rem", color: "#8888a0",
              textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 9 }}>
              Наличност при обекта
            </div>
            {products.map(p => {
              const q = stk[p.id] || 0;
              const c = q === 0 ? "#f87171" : q < 10 ? "#fb923c" : "#4ade80";
              return (
                <div key={p.id} style={{ display: "flex", alignItems: "center",
                  gap: 9, marginBottom: 8 }}>
                  <Thumb p={p} size={32} />
                  <div style={{ flex: 1, fontSize: "0.78rem",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                  <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 700,
                    color: c, fontSize: "0.90rem", minWidth: 28, textAlign: "right" }}>{q}</div>
                </div>
              );
            })}
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <Btn v="sec" sm style={{ flex: 1 }} onClick={() => setMSD(s.id)}>📋 Детайли</Btn>
              <Btn sm style={{ flex: 1 }} onClick={() => openOrder(s.id)}>＋ Заявка</Btn>
            </div>
          </div>
        );
      })}
    </div>
  );

  // ── НАВИГАЦИЯ ────────────────────────────────────────────
  const navItems = [
    { id: "dashboard", icon: "📊", lbl: "Табло"  },
    { id: "inventory", icon: "📦", lbl: "Склад"  },
    { id: "orders",    icon: "📋", lbl: "Заявки" },
    { id: "stores",    icon: "🏪", lbl: "Обекти" },
  ];

  // ── РЕНДЕР ───────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh",
      background: "#0f0f14", color: "#e8e8f0", fontFamily: "'DM Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { -webkit-tap-highlight-color: transparent; }
        input, select { -webkit-appearance: none; }
      `}</style>

      {/* ХЕДЪР */}
      <header style={{ background: "#16161e", borderBottom: "1px solid #2a2a38",
        padding: "0 16px", height: 54, display: "flex", alignItems: "center",
        justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, flexShrink: 0 }}>
        <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: "1.15rem" }}>
          <span style={{ color: "#f0c040" }}>Хабитат</span>
          <span style={{ color: "#e8e8f0" }}>-64</span>
        </div>
        <div style={{ fontSize: "0.78rem", color: "#8888a0" }}>
          {navItems.find(n => n.id === page)?.lbl}
        </div>
        <div>
          {page === "inventory" && <Btn sm onClick={() => setMProd(true)}>＋</Btn>}
          {page === "orders"    && <Btn sm onClick={() => openOrder()}>＋</Btn>}
          {page === "stores"    && <Btn sm onClick={() => setMStore(true)}>＋</Btn>}
          {page === "dashboard" && <div style={{ width: 42 }} />}
        </div>
      </header>

      <StatusBar status={syncStatus} />

      {/* СЪДЪРЖАНИЕ */}
      <main style={{ flex: 1, padding: "16px 14px 90px", overflowY: "auto" }}>
        {page === "dashboard" && <Dashboard />}
        {page === "inventory" && <Inventory />}
        {page === "orders"    && <Orders />}
        {page === "stores"    && <Stores />}
      </main>

      {/* ДОЛНА НАВИГАЦИЯ */}
      <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0,
        background: "#16161e", borderTop: "1px solid #2a2a38",
        display: "flex", zIndex: 100,
        paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        {navItems.map(n => (
          <button key={n.id} onClick={() => setPage(n.id)}
            style={{ flex: 1, background: "none", border: "none",
              color: page === n.id ? "#f0c040" : "#8888a0",
              cursor: "pointer", padding: "10px 4px 12px",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              fontFamily: "'DM Sans',sans-serif", transition: "color 0.15s" }}>
            <span style={{ fontSize: "1.35rem", lineHeight: 1 }}>{n.icon}</span>
            <span style={{ fontSize: "0.62rem", fontWeight: page === n.id ? 700 : 400 }}>{n.lbl}</span>
            {page === n.id && (
              <div style={{ width: 18, height: 2, background: "#f0c040", borderRadius: 1 }} />
            )}
          </button>
        ))}
      </nav>

      {/* ═══ МОДАЛИ ═══ */}

      {/* НОВ ПРОДУКТ */}
      <Modal open={mProd} onClose={() => setMProd(false)} title="📦 Нов продукт"
        footer={[
          <Btn key="s" full onClick={addProd}>✓ Добави и запази</Btn>,
          <Btn key="c" v="sec" full onClick={() => setMProd(false)}>Отказ</Btn>,
        ]}>
        <FG label="Снимка"><ImgUpload val={pF.img} onChange={v => setPF(f => ({ ...f, img: v }))} /></FG>
        <FG label="Наименование">
          <input style={IS} placeholder="напр. Бонбони Амос" value={pF.name}
            onChange={e => setPF(f => ({ ...f, name: e.target.value }))} />
        </FG>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <FG label="SKU">
            <input style={IS} placeholder="AMO-WC" value={pF.sku}
              onChange={e => setPF(f => ({ ...f, sku: e.target.value }))} />
          </FG>
          <FG label="Количество">
            <input style={IS} type="number" min="0" placeholder="0" value={pF.qty}
              onChange={e => setPF(f => ({ ...f, qty: e.target.value }))} />
          </FG>
          <FG label="Цена купуване">
            <input style={IS} type="number" step="0.01" placeholder="0.00" value={pF.buy}
              onChange={e => setPF(f => ({ ...f, buy: e.target.value }))} />
          </FG>
          <FG label="Цена продажба">
            <input style={IS} type="number" step="0.01" placeholder="0.00" value={pF.sell}
              onChange={e => setPF(f => ({ ...f, sell: e.target.value }))} />
          </FG>
        </div>
        <FG label="Мин. ниво (предупреждение)">
          <input style={IS} type="number" min="0" value={pF.min}
            onChange={e => setPF(f => ({ ...f, min: e.target.value }))} />
        </FG>
      </Modal>

      {/* ЗАРЕЖДАНЕ */}
      <Modal open={mRestock} onClose={() => setMRestock(false)} title="📥 Зареди от производител"
        footer={[
          <Btn key="a" full onClick={applyRestock}>✓ Потвърди зареждане</Btn>,
          <Btn key="c" v="sec" full onClick={() => setMRestock(false)}>Отказ</Btn>,
        ]}>
        {products.map(p => (
          <div key={p.id} style={{ display: "flex", alignItems: "center",
            gap: 12, padding: "11px 0", borderBottom: "1px solid #1e1e2a" }}>
            <Thumb p={p} size={44} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: "0.86rem",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
              <div style={{ fontSize: "0.68rem", color: "#8888a0" }}>В склад: {p.qty} бр.</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: "0.68rem", color: "#8888a0" }}>+ бр.:</span>
              <input type="number" min="0" defaultValue="0"
                onChange={e => setRQtys(q => ({ ...q, [p.id]: parseInt(e.target.value) || 0 }))}
                style={{ ...IS, width: 72 }} />
            </div>
          </div>
        ))}
      </Modal>

      {/* НОВ ОБЕКТ */}
      <Modal open={mStore} onClose={() => setMStore(false)} title="🏪 Нов обект"
        footer={[
          <Btn key="s" full onClick={addStore}>✓ Добави и запази</Btn>,
          <Btn key="c" v="sec" full onClick={() => setMStore(false)}>Отказ</Btn>,
        ]}>
        <FG label="Наименование">
          <input style={IS} placeholder='Магазин "Нов"' value={sF.name}
            onChange={e => setSF(f => ({ ...f, name: e.target.value }))} />
        </FG>
        <FG label="Адрес">
          <input style={IS} placeholder="ул. ..." value={sF.addr}
            onChange={e => setSF(f => ({ ...f, addr: e.target.value }))} />
        </FG>
        <FG label="Контактно лице">
          <input style={IS} placeholder="Иван Иванов" value={sF.contact}
            onChange={e => setSF(f => ({ ...f, contact: e.target.value }))} />
        </FG>
        <FG label="Телефон">
          <input style={IS} placeholder="088..." value={sF.phone}
            onChange={e => setSF(f => ({ ...f, phone: e.target.value }))} />
        </FG>
      </Modal>

      {/* НОВА ЗАЯВКА */}
      <Modal open={mOrder} onClose={() => setMOrder(false)} title="📋 Нова заявка"
        footer={[
          <Btn key="s" full onClick={submitOrder}>✓ Изпрати — {ototal.toFixed(2)} лв.</Btn>,
          <Btn key="c" v="sec" full onClick={() => setMOrder(false)}>Отказ</Btn>,
        ]}>
        <FG label="Обект">
          <select value={oSid} onChange={e => setOSid(e.target.value)} style={IS}>
            {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </FG>
        <FG label="Дата">
          <input style={IS} type="date" value={oDate} onChange={e => setODate(e.target.value)} />
        </FG>
        {oSid && (() => {
          const s = stores.find(x => x.id == oSid);
          return s ? (
            <div style={{ background: "rgba(240,192,64,0.08)", border: "1px solid rgba(240,192,64,0.24)",
              borderRadius: 10, padding: "9px 12px", marginBottom: 14 }}>
              <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: "0.86rem" }}>{s.name}</div>
              <div style={{ fontSize: "0.68rem", color: "#8888a0" }}>📍 {s.address} · 👤 {s.contact}</div>
            </div>
          ) : null;
        })()}
        <div style={{ fontSize: "0.68rem", color: "#8888a0",
          textTransform: "uppercase", letterSpacing: "0.7px", marginBottom: 10 }}>
          Избери продукти
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {products.map(p => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10,
              background: "#1a1a24", borderRadius: 11, padding: "9px 11px",
              border: `1px solid ${(oQtys[p.id]||0) > 0 ? "rgba(240,192,64,0.45)" : "transparent"}` }}>
              <Thumb p={p} size={46} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: "0.84rem",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                <div style={{ fontSize: "0.67rem", color: "#8888a0" }}>
                  Склад: {p.qty} · {p.sellPrice.toFixed(2)} лв.
                </div>
                {(oQtys[p.id]||0) > 0 && (
                  <div style={{ fontSize: "0.70rem", color: "#f0c040" }}>
                    {((oQtys[p.id]||0) * p.sellPrice).toFixed(2)} лв.
                  </div>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <button onClick={() => setOQtys(q => ({ ...q, [p.id]: Math.max(0, (q[p.id]||0)-1) }))}
                  style={{ width:32, height:32, background:"#2a2a38", border:"none", color:"#e8e8f0",
                    borderRadius:8, cursor:"pointer", fontSize:"1.2rem",
                    display:"flex", alignItems:"center", justifyContent:"center" }}>−</button>
                <div style={{ fontFamily:"Syne,sans-serif", fontWeight:800, fontSize:"1.1rem",
                  minWidth:30, textAlign:"center", color:(oQtys[p.id]||0)>0?"#f0c040":"#e8e8f0" }}>
                  {oQtys[p.id]||0}
                </div>
                <button onClick={() => setOQtys(q => ({ ...q, [p.id]: Math.min(p.qty, (q[p.id]||0)+1) }))}
                  style={{ width:32, height:32, background:"#2a2a38", border:"none", color:"#e8e8f0",
                    borderRadius:8, cursor:"pointer", fontSize:"1.2rem",
                    display:"flex", alignItems:"center", justifyContent:"center" }}>+</button>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {/* ДЕТАЙЛИ НА ОБЕКТ */}
      <Modal open={!!mSD} onClose={() => setMSD(null)} title={detStore?.name || ""}
        footer={[
          <Btn key="o" full onClick={() => { setMSD(null); openOrder(mSD); }}>＋ Нова заявка</Btn>,
          <Btn key="c" v="sec" full onClick={() => setMSD(null)}>Затвори</Btn>,
        ]}>
        {detStore && <>
          <div style={{ ...card, padding: "10px 13px", marginBottom: 14 }}>
            <div style={{ fontSize: "0.80rem", marginBottom: 4 }}>👤 {detStore.contact}</div>
            <div style={{ fontSize: "0.76rem", color: "#8888a0", marginBottom: 2 }}>📍 {detStore.address}</div>
            <div style={{ fontSize: "0.76rem", color: "#8888a0" }}>📞 {detStore.phone}</div>
          </div>
          <div style={{ fontSize: "0.68rem", color: "#8888a0",
            textTransform: "uppercase", letterSpacing: "0.7px", marginBottom: 10 }}>
            Налично при обекта (редактируемо)
          </div>
          {products.map(p => {
            const q = (storeStock[mSD] || {})[p.id] || 0;
            const c = q === 0 ? "#f87171" : q < 10 ? "#fb923c" : "#4ade80";
            return (
              <div key={p.id} style={{ display: "flex", alignItems: "center",
                gap: 11, padding: "10px 0", borderBottom: "1px solid #1e1e2a" }}>
                <Thumb p={p} size={44} />
                <div style={{ flex: 1, minWidth: 0, fontSize: "0.84rem", fontWeight: 500,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 700,
                  color: c, fontSize: "1rem", minWidth: 28, textAlign: "right" }}>{q}</div>
                <input type="number" min="0" defaultValue={q}
                  onChange={e => updateStock(mSD, p.id, parseInt(e.target.value) || 0)}
                  style={{ ...IS, width: 72 }} />
              </div>
            );
          })}
        </>}
      </Modal>
    </div>
  );
}
