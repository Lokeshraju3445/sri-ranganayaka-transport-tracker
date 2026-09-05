"use client";

import { useEffect, useMemo, useState } from "react";

type Load = {
  id: string;
  date: string;
  vehicle: string;
  from: string;
  to: string;
  amount: number;
  advance: number;
  diesel: number;
  toll: number;
  driverSalary: number;
  status: "Planned" | "In Transit" | "Delivered";
  driver: string;
  customer: string;
};

type Vehicle = { id: string; number: string; type: string; driver: string; active: boolean };
type Driver = { id: string; name: string; phone: string; vehicle: string; active: boolean };
type Customer = { id: string; name: string; phone: string; loads: number; revenue: number };

const today = new Date().toISOString().slice(0,10);

const seedLoads: Load[] = [
  {id:"L001",date:today,vehicle:"AP40AN4041",from:"Hyderabad",to:"Venkatagiri",amount:92000,advance:30000,diesel:26000,toll:8500,driverSalary:6500,status:"Planned",driver:"Rajesh",customer:"Sri Lakshmi Traders"},
  {id:"L002",date:today,vehicle:"AP40FV8660",from:"Chennai",to:"Hyderabad",amount:85000,advance:25000,diesel:35000,toll:8500,driverSalary:5500,status:"In Transit",driver:"Vishnu",customer:"ABC Logistics"},
  {id:"L003",date:"2026-09-03",vehicle:"AP28ZZ7788",from:"Hyderabad",to:"Mumbai",amount:60000,advance:20000,diesel:21000,toll:6500,driverSalary:5000,status:"Delivered",driver:"Ravi",customer:"Metro Distributors"},
  {id:"L004",date:"2026-09-02",vehicle:"KA01CD9012",from:"Chennai",to:"Vijayawada",amount:52000,advance:18000,diesel:15000,toll:4500,driverSalary:4500,status:"Delivered",driver:"Suresh",customer:"Vijay Traders"},
  {id:"L005",date:"2026-09-01",vehicle:"TS07AB5678",from:"Bengaluru",to:"Chennai",amount:38000,advance:12000,diesel:12000,toll:3500,driverSalary:3500,status:"Delivered",driver:"Mahesh",customer:"South Freight"},
  {id:"L006",date:"2026-08-30",vehicle:"AP16BB6677",from:"Vijayawada",to:"Delhi",amount:95000,advance:40000,diesel:32000,toll:10000,driverSalary:6000,status:"Delivered",driver:"Ramesh",customer:"National Cargo"}
];

const seedVehicles: Vehicle[] = [
  {id:"V1",number:"AP40AN4041",type:"10-Wheeler",driver:"Rajesh",active:true},
  {id:"V2",number:"AP40FV8660",type:"12-Wheeler",driver:"Vishnu",active:true},
  {id:"V3",number:"AP28ZZ7788",type:"10-Wheeler",driver:"Ravi",active:true},
  {id:"V4",number:"KA01CD9012",type:"Container",driver:"Suresh",active:true}
];

const seedDrivers: Driver[] = [
  {id:"D1",name:"Rajesh",phone:"98765 43210",vehicle:"AP40AN4041",active:true},
  {id:"D2",name:"Vishnu",phone:"98765 43211",vehicle:"AP40FV8660",active:true},
  {id:"D3",name:"Ravi",phone:"98765 43212",vehicle:"AP28ZZ7788",active:true},
  {id:"D4",name:"Suresh",phone:"98765 43213",vehicle:"KA01CD9012",active:true}
];

const seedCustomers: Customer[] = [
  {id:"C1",name:"Sri Lakshmi Traders",phone:"98480 11111",loads:1,revenue:92000},
  {id:"C2",name:"ABC Logistics",phone:"98480 22222",loads:1,revenue:85000},
  {id:"C3",name:"Metro Distributors",phone:"98480 33333",loads:1,revenue:60000},
  {id:"C4",name:"Vijay Traders",phone:"98480 44444",loads:1,revenue:52000}
];

const money = (n:number) => "₹" + Math.round(n).toLocaleString("en-IN");
const profit = (l:Load) => l.amount - l.diesel - l.toll - l.driverSalary;
const expenses = (l:Load) => l.diesel + l.toll + l.driverSalary;

function Icon({name, size=18}:{name:string,size?:number}) {
  const common = {width:size,height:size,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:1.8,strokeLinecap:"round" as const,strokeLinejoin:"round" as const};
  const paths: Record<string, React.ReactNode> = {
    grid:<><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>,
    truck:<><rect x="2" y="5" width="13" height="11" rx="1"/><path d="M15 9h4l3 3v4h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></>,
    chart:<><path d="M4 19V5"/><path d="M4 19h17"/><path d="m7 15 3-4 3 2 5-7"/></>,
    car:<><path d="M5 16l1-5 2-4h8l2 4 1 5"/><path d="M4 16h16v3H4z"/><circle cx="7" cy="19" r="1"/><circle cx="17" cy="19" r="1"/></>,
    user:<><circle cx="12" cy="7" r="4"/><path d="M4 21c.8-4 3.4-6 8-6s7.2 2 8 6"/></>,
    users:<><circle cx="9" cy="8" r="3"/><path d="M3 20c.7-3.3 2.7-5 6-5s5.3 1.7 6 5"/><path d="M16 5.5a3 3 0 0 1 0 5.8M18 15c1.9.7 3 2.1 3.5 4"/></>,
    wallet:<><path d="M3 7h17a1 1 0 0 1 1 1v11H4a1 1 0 0 1-1-1z"/><path d="M3 7V5a1 1 0 0 1 1-1h14"/><path d="M17 13h4"/></>,
    settings:<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.7 1.7-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.2h-2.4v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-1.7-1.7.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H7v-2.4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1L10 5l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5v-.2h2.4v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1L20 6.7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.2v2.4h-.2a1.7 1.7 0 0 0-1.7 2.9z"/></>,
    logout:<><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M21 3v18H11"/></>,
    plus:<><path d="M12 5v14M5 12h14"/></>,
    search:<><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    filter:<><path d="M4 5h16l-6 7v6l-4 2v-8z"/></>,
    calendar:<><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 9h18"/></>,
    eye:<><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="2.5"/></>,
    edit:<><path d="m4 20 4-.8L19 8.2a2 2 0 0 0-3-3L5 16.2z"/><path d="m14.5 6.5 3 3"/></>,
    trash:<><path d="M4 7h16M10 11v6M14 11v6"/><path d="M6 7l1 14h10l1-14M9 7V4h6v3"/></>,
    download:<><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M4 21h16"/></>,
    menu:<><path d="M4 6h16M4 12h16M4 18h16"/></>,
    arrow:<><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
    back:<><path d="m15 18-6-6 6-6"/></>,
    check:<><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></>,
    fuel:<><path d="M5 21V4a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v17"/><path d="M5 8h11M9 5h4"/><path d="M16 7h2l3 3v8a2 2 0 0 1-2 2h-1"/></>,
    close:<><path d="M6 6l12 12M18 6 6 18"/></>,
    print:<><path d="M6 9V3h12v6"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v7H6z"/></>
  };
  return <svg {...common}>{paths[name] || paths.grid}</svg>;
}

const nav = [
  ["dashboard","Dashboard","grid"],["loads","Loads","truck"],["reports","Reports","chart"],
  ["vehicles","Vehicles","car"],["drivers","Drivers","user"],["customers","Customers","users"],
  ["expenses","Expenses","wallet"],["settings","Settings","settings"]
];

export default function TransportApp() {
  const [authed,setAuthed] = useState(false);
  const [authMode,setAuthMode] = useState<"login"|"signup">("login");
  const [page,setPage] = useState("dashboard");
  const [loads,setLoads] = useState<Load[]>(seedLoads);
  const [vehicles,setVehicles] = useState<Vehicle[]>(seedVehicles);
  const [drivers,setDrivers] = useState<Driver[]>(seedDrivers);
  const [customers,setCustomers] = useState<Customer[]>(seedCustomers);
  const [selected,setSelected] = useState<Load|null>(null);
  const [toast,setToast] = useState("");
  const [mobileNav,setMobileNav] = useState(false);
  const [profile,setProfile] = useState({name:"Lokesh Raju",business:"Sri Ranganayaka Transport",currency:"Indian Rupee (₹)",format:"English (India)"});

  useEffect(()=>{
    try {
      const raw=localStorage.getItem("transport-tracker-data");
      if(raw){ const d=JSON.parse(raw); setLoads(d.loads||seedLoads); setVehicles(d.vehicles||seedVehicles); setDrivers(d.drivers||seedDrivers); setCustomers(d.customers||seedCustomers); setProfile(d.profile||profile); }
      setAuthed(localStorage.getItem("transport-tracker-auth")==="1");
    } catch {}
  },[]);

  useEffect(()=>{
    if(authed) localStorage.setItem("transport-tracker-auth","1");
  },[authed]);

  useEffect(()=>{
    try { localStorage.setItem("transport-tracker-data",JSON.stringify({loads,vehicles,drivers,customers,profile})); } catch {}
  },[loads,vehicles,drivers,customers,profile]);

  useEffect(()=>{ if(toast){const t=setTimeout(()=>setToast(""),2500); return ()=>clearTimeout(t)} },[toast]);

  const go=(p:string)=>{setPage(p);setSelected(null);setMobileNav(false);};
  const totalRevenue=loads.reduce((s,l)=>s+l.amount,0);
  const totalExpenses=loads.reduce((s,l)=>s+expenses(l),0);
  const totalProfit=loads.reduce((s,l)=>s+profit(l),0);
  const totalAdvance=loads.reduce((s,l)=>s+l.advance,0);
  const recent=loads.slice(0,5);

  function saveLoad(data: Omit<Load,"id">){
    const id="L"+String(Date.now()).slice(-6);
    setLoads(prev=>[{...data,id},...prev]);
    setToast("Load saved successfully");
    setPage("loads");
  }
  function deleteLoad(id:string){ setLoads(prev=>prev.filter(l=>l.id!==id)); setSelected(null); setToast("Load deleted"); }
  function logout(){localStorage.removeItem("transport-tracker-auth");setAuthed(false);}
  function resetData(){setLoads(seedLoads);setVehicles(seedVehicles);setDrivers(seedDrivers);setCustomers(seedCustomers);setToast("Demo data restored");}

  if(!authed) return <Auth mode={authMode} setMode={setAuthMode} onLogin={()=>setAuthed(true)} profile={profile} setProfile={setProfile}/>;

  return <div className="app-shell">
    <aside className={"sidebar "+(mobileNav?"mobile-open":"")}>
      <div className="brand" onClick={()=>go("dashboard")}>
        <div className="brand-icon"><Icon name="truck" size={22}/></div>
        <div><b>{profile.business}</b><span>Transport</span></div>
      </div>
      <nav>{nav.map(([key,label,icon])=><button key={key} className={page===key?"active":""} onClick={()=>go(key)}><Icon name={icon}/><span>{label}</span></button>)}</nav>
      <button className="signout" onClick={logout}><Icon name="logout"/><span>Sign out</span></button>
    </aside>
    {mobileNav && <div className="scrim" onClick={()=>setMobileNav(false)}/>}
    <main className="main">
      <header className="topbar">
        <button className="mobile-menu" onClick={()=>setMobileNav(!mobileNav)}><Icon name="menu"/></button>
        <div className="page-title">
          <h1>{pageTitle(page)}</h1><p>{pageSubtitle(page)}</p>
        </div>
        <div className="top-actions">
          {["dashboard","loads","reports"].includes(page) && <button className="primary" onClick={()=>go("add-load")}><Icon name="plus"/> Add New Load</button>}
          <div className="user-chip"><span>{profile.name.split(" ").map(x=>x[0]).join("").slice(0,2)}</span><div><b>{profile.name}</b><small>Business Owner</small></div></div>
        </div>
      </header>

      <div className="content">
        {page==="dashboard" && <Dashboard loads={loads} revenue={totalRevenue} expenses={totalExpenses} profit={totalProfit} onViewAll={()=>go("loads")} onAdd={()=>go("add-load")} onSelect={setSelected}/>}
        {page==="add-load" && <AddLoad vehicles={vehicles} drivers={drivers} customers={customers} onSave={saveLoad} onCancel={()=>go("loads")}/>}
        {page==="loads" && <LoadsPage loads={loads} onAdd={()=>go("add-load")} onSelect={setSelected}/>}
        {page==="reports" && <Reports loads={loads} revenue={totalRevenue} expenses={totalExpenses} profit={totalProfit}/>}
        {page==="vehicles" && <VehiclesPage vehicles={vehicles} loads={loads} setVehicles={setVehicles}/>}
        {page==="drivers" && <DriversPage drivers={drivers} loads={loads} setDrivers={setDrivers}/>}
        {page==="customers" && <CustomersPage customers={customers} setCustomers={setCustomers}/>}
        {page==="expenses" && <ExpensesPage loads={loads}/>}
        {page==="settings" && <SettingsPage profile={profile} setProfile={setProfile} resetData={resetData} onToast={setToast}/>}
      </div>
    </main>
    {selected && <LoadModal load={selected} onClose={()=>setSelected(null)} onDelete={deleteLoad}/>}
    {toast && <div className="toast"><Icon name="check" size={18}/>{toast}</div>}
  </div>;
}

function pageTitle(p:string){return p==="add-load"?"Add New Load":p.charAt(0).toUpperCase()+p.slice(1)}
function pageSubtitle(p:string){
  const m:any={dashboard:"Overview of your transport business",loads:"Manage all your transport loads",reports:"Revenue, expenses and profit analysis",vehicles:"Performance by vehicle",drivers:"Performance by driver",customers:"Revenue by customer",expenses:"Where the money goes",settings:"Profile, preferences and data"};
  return m[p]||"";
}

function Auth({mode,setMode,onLogin,profile,setProfile}:{mode:"login"|"signup";setMode:(m:"login"|"signup")=>void;onLogin:()=>void;profile:any;setProfile:(x:any)=>void}){
  const [name,setName]=useState(profile.name);
  const [business,setBusiness]=useState(profile.business);
  const [email,setEmail]=useState("owner@example.com");
  const [password,setPassword]=useState("");
  const submit=(e:React.FormEvent)=>{e.preventDefault(); if(mode==="signup")setProfile({...profile,name,business}); onLogin();};
  return <div className="auth">
    <section className="auth-hero">
      <div className="auth-brand"><div className="brand-icon big"><Icon name="truck" size={30}/></div><h1>{business||"Sri Ranganayaka Transport"}</h1><div>TRACK · MANAGE · GROW</div><p>Your Transport Business Made Simple</p></div>
    </section>
    <section className="auth-panel">
      <form onSubmit={submit} className="auth-form">
        <h2>{mode==="login"?"Welcome back":"Create your account"}</h2>
        <p className="muted">{mode==="login"?"Sign in to continue to your ledger.":"Set up your account for this device."}</p>
        {mode==="signup" && <><label>Your name<input value={name} onChange={e=>setName(e.target.value)} required/></label><label>Business name<input value={business} onChange={e=>setBusiness(e.target.value)} required/></label></>}
        <label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label>
        <label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required placeholder={mode==="signup"?"At least 8 characters":""}/></label>
        <button className="primary wide">{mode==="login"?"Login":"Create Account"}</button>
        <div className="switch-auth">{mode==="login"?"New here?":"Already have an account?"} <button type="button" onClick={()=>setMode(mode==="login"?"signup":"login")}>{mode==="login"?"Create Account":"Login"}</button></div>
      </form>
    </section>
  </div>;
}

function StatCard({label,value,icon,tone}:{label:string,value:string,icon:string,tone:string}){
  return <div className={"stat "+tone}><div className="stat-icon"><Icon name={icon}/></div><div><b>{value}</b><span>{label}</span></div></div>
}

function Dashboard({loads,revenue,expenses:exp,profit:pro,onViewAll,onAdd,onSelect}:{loads:Load[];revenue:number;expenses:number;profit:number;onViewAll:()=>void;onAdd:()=>void;onSelect:(l:Load)=>void}){
  const month=Array.from({length:9},(_,i)=>loads.filter(l=>new Date(l.date).getMonth()===i).reduce((s,l)=>s+profit(l),0));
  const max=Math.max(...month,1);
  return <div>
    <div className="toolbar"><div className="date-range"><Icon name="calendar"/> 01/09/2026 <span>—</span> {new Date().toLocaleDateString("en-GB")}</div><button className="primary" onClick={onAdd}><Icon name="plus"/> Add New Load</button></div>
    <div className="stats-grid">
      <StatCard label="Total Revenue" value={money(revenue)} icon="chart" tone="green"/>
      <StatCard label="Total Expenses" value={money(exp)} icon="wallet" tone="red"/>
      <StatCard label="Total Profit" value={money(pro)} icon="chart" tone="blue"/>
      <StatCard label="Total Trips" value={String(loads.length)} icon="truck" tone="purple"/>
    </div>
    <div className="two-col">
      <section className="card chart-card"><div className="section-head"><div><h3>Profit Trend</h3><span>Monthly performance</span></div><select><option>2026</option></select></div><div className="chart"><div className="ylabels"><span>{money(max)}</span><span>{money(max/2)}</span><span>₹0</span></div><div className="bars">{month.map((v,i)=><div className="bar-wrap" key={i}><div className="bar" style={{height:`${Math.max(4,(v/max)*150)}px`}} title={money(v)}/><small>{["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep"][i]}</small></div>)}</div></div></section>
      <section className="card chart-card"><div className="section-head"><div><h3>Expense Breakdown</h3><span>{money(exp)} total</span></div></div><div className="donut-area"><div className="donut"><div>{money(exp)}<small>Total</small></div></div><div className="legend"><span><i className="dot diesel"/>Diesel <b>{money(loads.reduce((s,l)=>s+l.diesel,0))}</b></span><span><i className="dot toll"/>Toll <b>{money(loads.reduce((s,l)=>s+l.toll,0))}</b></span><span><i className="dot driver"/>Driver Salary <b>{money(loads.reduce((s,l)=>s+l.driverSalary,0))}</b></span></div></div></section>
    </div>
    <section className="card table-card"><div className="section-head"><div><h3>Today's Loads</h3><span>{loads.filter(l=>l.date===today).length} loads recorded</span></div><button className="link-btn" onClick={onViewAll}>View All <Icon name="arrow" size={14}/></button></div>
      <div className="load-list">{loads.filter(l=>l.date===today).slice(0,5).map(l=><button className="load-row" key={l.id} onClick={()=>onSelect(l)}><div><b>{l.vehicle}</b><span>{l.from} → {l.to}</span></div><div><strong>{money(l.amount)}</strong><em className={statusClass(l.status)}>{l.status}</em></div><Icon name="arrow" size={16}/></button>)}</div>
      {!loads.some(l=>l.date===today)&&<Empty text="No loads recorded for today."/>}
    </section>
  </div>;
}

function AddLoad({vehicles,drivers,customers,onSave,onCancel}:{vehicles:Vehicle[];drivers:Driver[];customers:Customer[];onSave:(d:Omit<Load,"id">)=>void;onCancel:()=>void}){
  const [date,setDate]=useState(today),[vehicle,setVehicle]=useState(""),[from,setFrom]=useState(""),[to,setTo]=useState(""),[amount,setAmount]=useState(""),[advance,setAdvance]=useState(""),[diesel,setDiesel]=useState(""),[toll,setToll]=useState(""),[driverSalary,setDriverSalary]=useState(""),[driver,setDriver]=useState(""),[customer,setCustomer]=useState(""),[status,setStatus]=useState<Load["status"]>("Planned");
  const total=Number(diesel||0)+Number(toll||0)+Number(driverSalary||0), pl=Number(amount||0)-total;
  const submit=(e:React.FormEvent)=>{e.preventDefault();if(!vehicle||!from||!to||!amount)return;onSave({date,vehicle,from,to,amount:Number(amount),advance:Number(advance||0),diesel:Number(diesel||0),toll:Number(toll||0),driverSalary:Number(driverSalary||0),driver,status,customer});};
  return <form className="form-page" onSubmit={submit}>
    <div className="form-grid">
      <section className="card form-section"><h3>Trip Information</h3><div className="field-grid">
        <label>Load Date<input type="date" value={date} onChange={e=>setDate(e.target.value)} required/></label>
        <label>Vehicle Number<select value={vehicle} onChange={e=>setVehicle(e.target.value)} required><option value="">Select vehicle</option>{vehicles.map(v=><option key={v.id}>{v.number}</option>)}</select></label>
        <label>From (Loading Point)<input value={from} onChange={e=>setFrom(e.target.value)} placeholder="e.g. Hyderabad" required/></label>
        <label>To (Unloading Point)<input value={to} onChange={e=>setTo(e.target.value)} placeholder="e.g. Chennai" required/></label>
        <label>Driver<select value={driver} onChange={e=>setDriver(e.target.value)}><option value="">Select driver</option>{drivers.map(d=><option key={d.id}>{d.name}</option>)}</select></label>
        <label>Customer<select value={customer} onChange={e=>setCustomer(e.target.value)}><option value="">Select customer</option>{customers.map(c=><option key={c.id}>{c.name}</option>)}</select></label>
        <label>Status<select value={status} onChange={e=>setStatus(e.target.value as Load["status"])}><option>Planned</option><option>In Transit</option><option>Delivered</option></select></label>
      </div></section>
      <section className="card form-section"><h3>Payment Details</h3><div className="field-grid single"><label>Total Amount (₹)<input type="number" min="0" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="e.g. 45000" required/></label><label>Advance Received (₹)<input type="number" min="0" value={advance} onChange={e=>setAdvance(e.target.value)} placeholder="e.g. 15000"/></label></div><div className="balance-box"><span>Balance Receivable</span><b>{money(Math.max(0,Number(amount||0)-Number(advance||0)))}</b></div></section>
      <section className="card form-section"><h3>Expenditures</h3><div className="field-grid single"><label>Diesel (₹)<input type="number" min="0" value={diesel} onChange={e=>setDiesel(e.target.value)} placeholder="e.g. 12000"/></label><label>Toll (₹)<input type="number" min="0" value={toll} onChange={e=>setToll(e.target.value)} placeholder="e.g. 2500"/></label><label>Driver Salary (₹)<input type="number" min="0" value={driverSalary} onChange={e=>setDriverSalary(e.target.value)} placeholder="e.g. 5000"/></label></div></section>
      <section className={"profit-box "+(pl>=0?"positive":"negative")}><div><span>Total Profit / Loss</span><b>{money(pl)}</b></div><Icon name="chart" size={30}/></section>
    </div>
    <div className="form-actions"><button type="button" className="secondary" onClick={onCancel}>Cancel</button><button className="primary"><Icon name="check"/> Save Load</button></div>
  </form>;
}

function LoadsPage({loads,onAdd,onSelect}:{loads:Load[];onAdd:()=>void;onSelect:(l:Load)=>void}){
  const [q,setQ]=useState(""),[status,setStatus]=useState("All Status"),[vehicle,setVehicle]=useState("All Vehicles");
  const vehicles=Array.from(new Set(loads.map(l=>l.vehicle)));
  const rows=loads.filter(l=>(status==="All Status"||l.status===status)&&(vehicle==="All Vehicles"||l.vehicle===vehicle)&&`${l.vehicle} ${l.from} ${l.to} ${l.customer}`.toLowerCase().includes(q.toLowerCase()));
  return <section className="card table-card large"><div className="filters"><div className="date-range"><Icon name="calendar"/> 01/09/2026 <span>—</span> {new Date().toLocaleDateString("en-GB")}</div><select value={vehicle} onChange={e=>setVehicle(e.target.value)}><option>All Vehicles</option>{vehicles.map(v=><option key={v}>{v}</option>)}</select><select value={status} onChange={e=>setStatus(e.target.value)}><option>All Status</option><option>Planned</option><option>In Transit</option><option>Delivered</option></select><div className="search"><Icon name="search" size={16}/><input placeholder="Search by vehicle, route..." value={q} onChange={e=>setQ(e.target.value)}/></div><button className="secondary print" onClick={()=>window.print()}><Icon name="print"/> Print PDF</button><button className="primary" onClick={onAdd}><Icon name="plus"/> Add New Load</button></div>
  <div className="responsive-table"><table><thead><tr><th>Date</th><th>Vehicle Number</th><th>From</th><th>To</th><th>Amount</th><th>Expenses</th><th>Profit/Loss</th><th>Status</th><th>Actions</th></tr></thead><tbody>{rows.map(l=><tr key={l.id}><td>{formatDate(l.date)}</td><td><b>{l.vehicle}</b></td><td>{l.from}</td><td>{l.to}</td><td>{money(l.amount)}</td><td>{money(expenses(l))}</td><td className={profit(l)>=0?"profit":"loss"}>{money(profit(l))}</td><td><em className={statusClass(l.status)}>{l.status}</em></td><td><button className="icon-btn" onClick={()=>onSelect(l)}><Icon name="eye" size={16}/></button></td></tr>)}</tbody></table></div><div className="table-foot">Showing {rows.length} of {loads.length} entries</div></section>;
}

function Reports({loads,revenue,expenses:exp,profit:pro}:{loads:Load[];revenue:number;expenses:number;profit:number}){
  const cats={Diesel:loads.reduce((s,l)=>s+l.diesel,0),Toll:loads.reduce((s,l)=>s+l.toll,0),"Driver Salary":loads.reduce((s,l)=>s+l.driverSalary,0)};
  return <div><div className="report-head"><div><h2>September 2026</h2><p>{loads.length} loads · balance receivable {money(loads.reduce((s,l)=>s+l.amount-l.advance,0))}</p></div><button className="secondary" onClick={()=>window.print()}><Icon name="print"/> Print PDF</button></div>
    <div className="stats-grid"><StatCard label="Total Revenue" value={money(revenue)} icon="chart" tone="green"/><StatCard label="Total Expenses" value={money(exp)} icon="wallet" tone="red"/><StatCard label="Total Profit" value={money(pro)} icon="chart" tone="blue"/><StatCard label="Total Trips" value={String(loads.length)} icon="truck" tone="purple"/></div>
    <div className="two-col"><section className="card chart-card"><h3>Profit Trend 2026</h3><div className="trend"><svg viewBox="0 0 600 180" preserveAspectRatio="none"><polyline points={loads.slice(0,12).map((l,i)=>`${i*(560/Math.max(loads.length-1,1))+20},${160-(Math.max(0,profit(l))/(Math.max(...loads.map(profit),1))*135)}`).join(" ")} /></svg></div></section><section className="card chart-card"><h3>Expense Breakdown</h3><div className="donut-area"><div className="donut"><div>{money(exp)}<small>Total</small></div></div><div className="legend">{Object.entries(cats).map(([k,v])=><span key={k}><i className={"dot "+k.toLowerCase().replace(" ","")}/>{k}<b>{money(v)}</b></span>)}</div></div></section></div>
    <section className="card table-card"><div className="section-head"><div><h3>Month by month · 2026</h3><span>Revenue and profitability summary</span></div></div><div className="responsive-table"><table><thead><tr><th>Month</th><th>Trips</th><th>Revenue</th><th>Expenses</th><th>Profit / Loss</th><th>Margin</th></tr></thead><tbody>{["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m,i)=>{const ls=loads.filter(l=>new Date(l.date).getMonth()===i);const r=ls.reduce((s,l)=>s+l.amount,0),e=ls.reduce((s,l)=>s+expenses(l),0),p=r-e;return <tr key={m}><td>{m}</td><td>{ls.length}</td><td>{money(r)}</td><td>{money(e)}</td><td className={p>=0?"profit":"loss"}>{money(p)}</td><td>{r?Math.round(p/r*100):0}%</td></tr>})}</tbody></table></div></section>
  </div>;
}

function VehiclesPage({vehicles,loads,setVehicles}:{vehicles:Vehicle[];loads:Load[];setVehicles:(v:Vehicle[])=>void}){
  const add=()=>{const number=prompt("Vehicle number"); if(!number)return;setVehicles([...vehicles,{id:"V"+Date.now(),number,type:"Truck",driver:"",active:true}]);};
  return <div><div className="page-action"><p>Track revenue and profit by vehicle.</p><button className="primary" onClick={add}><Icon name="plus"/> Add Vehicle</button></div><div className="entity-grid">{vehicles.map(v=>{const ls=loads.filter(l=>l.vehicle===v.number);const rev=ls.reduce((s,l)=>s+l.amount,0),pro=ls.reduce((s,l)=>s+profit(l),0);return <div className="entity-card card" key={v.id}><div className="entity-top"><div className="avatar">{v.number.slice(0,2)}</div><div><b>{v.number}</b><span>{v.type}</span></div><em className="status-active">Active</em></div><div className="mini-stats"><span>Trips<b>{ls.length}</b></span><span>Revenue<b>{money(rev)}</b></span><span>Profit<b className="profit">{money(pro)}</b></span></div><div className="entity-foot"><span>Driver: {v.driver||"Unassigned"}</span><button className="icon-btn" onClick={()=>setVehicles(vehicles.filter(x=>x.id!==v.id))}><Icon name="trash" size={15}/></button></div></div>})}</div></div>;
}

function DriversPage({drivers,loads,setDrivers}:{drivers:Driver[];loads:Load[];setDrivers:(d:Driver[])=>void}){
  const add=()=>{const name=prompt("Driver name");if(!name)return;setDrivers([...drivers,{id:"D"+Date.now(),name,phone:"",vehicle:"",active:true}]);};
  return <div><div className="page-action"><p>Monitor driver trips and earnings.</p><button className="primary" onClick={add}><Icon name="plus"/> Add Driver</button></div><div className="entity-grid">{drivers.map(d=>{const ls=loads.filter(l=>l.driver===d.name);return <div className="entity-card card" key={d.id}><div className="entity-top"><div className="avatar">{d.name[0]}</div><div><b>{d.name}</b><span>{d.phone||"No phone added"}</span></div><em className="status-active">Active</em></div><div className="mini-stats"><span>Trips<b>{ls.length}</b></span><span>Revenue<b>{money(ls.reduce((s,l)=>s+l.amount,0))}</b></span><span>Profit<b className="profit">{money(ls.reduce((s,l)=>s+profit(l),0))}</b></span></div><div className="entity-foot"><span>{d.vehicle||"No vehicle assigned"}</span><button className="icon-btn" onClick={()=>setDrivers(drivers.filter(x=>x.id!==d.id))}><Icon name="trash" size={15}/></button></div></div>})}</div></div>;
}

function CustomersPage({customers,setCustomers}:{customers:Customer[];setCustomers:(c:Customer[])=>void}){
  const add=()=>{const name=prompt("Customer name");if(!name)return;setCustomers([...customers,{id:"C"+Date.now(),name,phone:"",loads:0,revenue:0}]);};
  return <div><div className="page-action"><p>Customer-wise revenue and load history.</p><button className="primary" onClick={add}><Icon name="plus"/> Add Customer</button></div>{customers.length?<div className="entity-grid">{customers.map(c=><div className="entity-card card" key={c.id}><div className="entity-top"><div className="avatar"><Icon name="users" size={18}/></div><div><b>{c.name}</b><span>{c.phone||"No phone added"}</span></div></div><div className="mini-stats"><span>Loads<b>{c.loads}</b></span><span>Revenue<b>{money(c.revenue)}</b></span></div><div className="entity-foot"><span>Customer</span><button className="icon-btn" onClick={()=>setCustomers(customers.filter(x=>x.id!==c.id))}><Icon name="trash" size={15}/></button></div></div>)}</div>:<Empty text="No customers yet. Add a customer to start tracking revenue."/>}</div>;
}

function ExpensesPage({loads}:{loads:Load[]}) {
  const cats=[["Diesel",loads.reduce((s,l)=>s+l.diesel,0),"diesel"],["Toll",loads.reduce((s,l)=>s+l.toll,0),"toll"],["Driver Salary",loads.reduce((s,l)=>s+l.driverSalary,0),"driver"]];
  const total =
  loads.reduce((s, l) => s + l.diesel + l.toll + l.driverSalary, 0);
  return <div><section className="card summary"><div><h3>Expense summary</h3><p>{loads.length} loads · {money(total)} spent against {money(loads.reduce((s,l)=>s+l.amount,0))} revenue.</p></div></section><div className="stats-grid expense-stats">{cats.map(([name,val,tone])=><StatCard key={String(name)} label={String(name)} value={money(Number(val))} icon={name==="Diesel"?"fuel":name==="Toll"?"wallet":"user"} tone={tone==="diesel"?"green":tone==="toll"?"red":"blue"}/>)}</div><section className="card table-card"><div className="section-head"><div><h3>Expenses by load</h3><span>Detailed trip expenditure</span></div></div><div className="responsive-table"><table><thead><tr><th>Date</th><th>Vehicle</th><th>Route</th><th>Diesel</th><th>Toll</th><th>Driver Salary</th><th>Total</th></tr></thead><tbody>{loads.map(l=><tr key={l.id}><td>{formatDate(l.date)}</td><td>{l.vehicle}</td><td>{l.from} → {l.to}</td><td>{money(l.diesel)}</td><td>{money(l.toll)}</td><td>{money(l.driverSalary)}</td><td><b>{money(expenses(l))}</b></td></tr>)}</tbody></table></div></section></div>;
}

function SettingsPage({profile,setProfile,resetData,onToast}:{profile:any;setProfile:(p:any)=>void;resetData:()=>void;onToast:(x:string)=>void}){
  const [draft,setDraft]=useState(profile);
  return <div className="settings-stack"><section className="card settings-section"><h3>Profile</h3><p className="muted">Business owner and business information.</p><div className="field-grid"><label>Your name<input value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})}/></label><label>Business name<input value={draft.business} onChange={e=>setDraft({...draft,business:e.target.value})}/></label></div><button className="primary" onClick={()=>{setProfile(draft);onToast("Profile saved")}}><Icon name="check"/> Save profile</button></section><section className="card settings-section"><h3>Regional preferences</h3><p className="muted">Controls how amounts and dates are displayed.</p><div className="field-grid"><label>Currency<select value={draft.currency} onChange={e=>setDraft({...draft,currency:e.target.value})}><option>Indian Rupee (₹)</option><option>US Dollar ($)</option></select></label><label>Number & date format<select value={draft.format} onChange={e=>setDraft({...draft,format:e.target.value})}><option>English (India)</option><option>English (US)</option></select></label></div><button className="secondary" onClick={()=>onToast("Preferences saved")}>Save preferences</button></section><section className="card settings-section"><h3>Data</h3><p className="muted">Data is stored in this browser only. Keep a backup before clearing site data.</p><div className="data-actions"><button className="secondary" onClick={()=>{const blob=new Blob([localStorage.getItem("transport-tracker-data")||"{}"],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="transport-tracker-backup.json";a.click()}}><Icon name="download"/> Export backup</button><button className="danger" onClick={resetData}><Icon name="check"/> Restore demo data</button></div></section></div>;
}

function LoadModal({load,onClose,onDelete}:{load:Load;onClose:()=>void;onDelete:(id:string)=>void}){
  return <div className="modal-wrap" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><div className="modal card"><div className="modal-head"><div><h2>Load Details</h2><span>{formatDate(load.date)} · {load.vehicle}</span></div><button className="icon-btn" onClick={onClose}><Icon name="close"/></button></div><div className="success-banner"><Icon name="check"/><div><b>{load.status}</b><span>Load record</span></div></div><div className="detail-section"><h3>Trip Information</h3><p><span>Date</span><b>{formatDate(load.date)}</b></p><p><span>Vehicle Number</span><b>{load.vehicle}</b></p><p><span>From</span><b>{load.from}</b></p><p><span>To</span><b>{load.to}</b></p><p><span>Driver</span><b>{load.driver||"—"}</b></p></div><div className="detail-section"><h3>Payment Details</h3><p><span>Total Amount</span><b>{money(load.amount)}</b></p><p><span>Advance Received</span><b>{money(load.advance)}</b></p><p className="highlight"><span>Balance Receivable</span><b>{money(load.amount-load.advance)}</b></p></div><div className="detail-section"><h3>Expenditures</h3><p><span>Diesel</span><b>{money(load.diesel)}</b></p><p><span>Toll</span><b>{money(load.toll)}</b></p><p><span>Driver Salary</span><b>{money(load.driverSalary)}</b></p><p className="expense-total"><span>Total Expenses</span><b>{money(expenses(load))}</b></p></div><div className={"modal-profit "+(profit(load)>=0?"positive":"negative")}><span>Profit / Loss</span><b>{money(profit(load))}</b></div><div className="modal-actions"><button className="danger" onClick={()=>onDelete(load.id)}><Icon name="trash"/> Delete</button><button className="primary" onClick={onClose}>Close</button></div></div></div>;
}

function Empty({text}:{text:string}){return <div className="empty"><div className="empty-icon"><Icon name="users"/></div><b>{text}</b></div>}
function formatDate(s:string){return new Date(s+"T00:00:00").toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}
function statusClass(s:string){return "status "+s.toLowerCase().replace(" ","-");}
