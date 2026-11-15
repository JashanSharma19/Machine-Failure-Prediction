import React, { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Activity, BarChart3, Database, FlaskConical, Layers, ShieldCheck, Sparkles, FileText, Menu, X, Download, RefreshCw, Send, ChevronRight, Moon, Sun } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, Legend } from 'recharts';
import { api } from './services/api';

const links = [
  ['Overview', '/', BarChart3], ['Data Simulation', '/simulation', Database],
  ['Statistical Analysis', '/statistics', Activity], ['Distributions', '/distributions', Layers],
  ['F-Test Analysis', '/f-test', FlaskConical], ['Reliability Prediction', '/reliability', ShieldCheck],
  ['AI Insights', '/insights', Sparkles], ['Reports', '/reports', FileText],
];
const chartColors = { navy: '#244b73', teal: '#347f7c', amber: '#b7791f', violet: '#76679c', grid: 'var(--chart-grid)', text: 'var(--chart-text)' };
const DATASET_FLOW_KEY = 'machinepred-manual-first-v1';

export default function App() {
  const [sets, setSets] = useState([]);
  const [id, setId] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loadingData, setLoadingData] = useState(true);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('machinepred-theme') || 'light');
  const loc = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('machinepred-theme', theme);
  }, [theme]);

  async function loadDatasets() {
    try {
      setError('');
      let list = await api.datasets();
      let savedId = localStorage.getItem('dataset');
      if (localStorage.getItem(DATASET_FLOW_KEY) !== '1') {
        localStorage.removeItem('dataset');
        localStorage.setItem(DATASET_FLOW_KEY, '1');
        savedId = null;
      }
      const selected = savedId ? list.find(x => String(x.id) === String(savedId)) : null;
      if (selected) { localStorage.dataset = selected.id; setId(String(selected.id)); }
      else { localStorage.removeItem('dataset'); setId(''); setData(null); }
      setSets(list);
    } catch (e) { setError(`${e.message}. Check that the FastAPI service is running.`); }
    finally { setLoadingData(false); }
  }

  useEffect(() => { loadDatasets(); }, []);
  useEffect(() => {
    if (!id) { setAnalysisLoading(false); return; }
    let active = true;
    setAnalysisLoading(true);
    setData(null);
    api.analysis(id).then(result => { if (active) { setData(result); setError(''); } })
      .catch(e => { if (active) setError(`${e.message}. Check that the FastAPI service is running.`); })
      .finally(() => { if (active) setAnalysisLoading(false); });
    return () => { active = false; };
  }, [id]);

  async function generate(form) {
    setBusy(true);
    try {
      const made = await api.generate(form);
      localStorage.dataset = made.id;
      const list = await api.datasets();
      setSets(list);
      setAnalysisLoading(true);
      setId(String(made.id));
      setError('');
      navigate('/', { replace: true });
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  const page = links.find(x => x[1] === loc.pathname)?.[0] || 'Overview';
  const common = { id, data, sets, error, busy, generate, loadingData };
  return <div className={`app-shell ${theme === 'dark' ? 'dark-theme' : ''}`}>
    <aside className={`sidebar ${mobile ? 'is-open' : ''}`}>
      <NavLink to="/" className="brand" onClick={() => setMobile(false)}>
        <span className="brand-mark"><Activity size={19}/></span>
        <span><b>MACHINEPRED</b><small>RELIABILITY ENGINEERING</small></span>
        <button className="mobile-close" aria-label="Close navigation" onClick={e => { e.preventDefault(); setMobile(false); }}><X size={18}/></button>
      </NavLink>
      <div className="nav-caption">WORKSPACE</div>
      <nav aria-label="Main navigation">{links.map(([label, to, Icon]) => <NavLink onClick={() => setMobile(false)} key={to} to={to} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}><Icon size={17} strokeWidth={1.8}/><span>{label}</span></NavLink>)}</nav>
      <div className="side-footer"><span className={`status-dot ${error?'offline':''}`}/> Statistical engine <b>{error?'Unavailable':data?'Connected':'Connecting'}</b><small>Simulated engineering data</small></div>
    </aside>
    {mobile && <button className="scrim" aria-label="Close navigation" onClick={() => setMobile(false)}/>}
    <main className="main-area">
      <header className="topbar">
        <button className="menu-button" aria-label="Open navigation" onClick={() => setMobile(true)}><Menu size={21}/></button>
        <div className="page-title"><div className="breadcrumbs">MACHINEPRED <ChevronRight size={12}/> ANALYSIS</div><h1>{page}</h1></div>
        <div className="header-controls"><label className="dataset-control"><span>Saved dataset</span><select aria-label="Select saved dataset" value={id} disabled={!sets.length} onChange={e => { if(e.target.value)localStorage.dataset = e.target.value;else localStorage.removeItem('dataset'); setAnalysisLoading(Boolean(e.target.value)); setId(e.target.value); }}><option value="">{sets.length?'Choose saved dataset':'No saved dataset'}</option>{sets.map(s => <option key={s.id} value={s.id}>{s.name} · #{s.id}</option>)}</select></label><div className={`system-status ${error?'offline':''}`}><i/>{error?'Unavailable':data?'Connected':id?'Connecting':'No dataset'}</div><button className="button button-outline theme-toggle" type="button" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} aria-pressed={theme === 'dark'} onClick={() => setTheme(current => current === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? <Sun size={15}/> : <Moon size={15}/>}<span>{theme === 'dark' ? 'Light' : 'Dark'} theme</span></button></div>
      </header>
      <div className="page-content">
        {error && <div className="alert" role="alert">{error}</div>}
        {(loadingData || (id && analysisLoading)) && !data ? <section className="empty-state"><div className="empty-mark"><Activity size={21}/></div><h2>{id?'Loading analysis results':'Checking saved datasets'}</h2><p>{id?'Retrieving results for the selected dataset.':'Looking for datasets you have already created.'}</p></section> : <Routes>
          <Route path="/" element={<Overview {...common}/>}/>
          <Route path="/simulation" element={<Simulation {...common}/>}/>
          <Route path="/statistics" element={<DataRequired data={data}><Statistics {...common}/></DataRequired>}/>
          <Route path="/distributions" element={<DataRequired data={data}><Distributions {...common}/></DataRequired>}/>
          <Route path="/f-test" element={<DataRequired data={data}><FTest {...common}/></DataRequired>}/>
          <Route path="/reliability" element={<DataRequired data={data}><Reliability {...common}/></DataRequired>}/>
          <Route path="/insights" element={<DataRequired data={data}><Insights {...common}/></DataRequired>}/>
          <Route path="/reports" element={<DataRequired data={data}><Reports {...common}/></DataRequired>}/>
          <Route path="*" element={<Overview {...common}/>}/>
        </Routes>}
      </div>
    </main>
  </div>;
}

function PageIntro({eyebrow, title, description, action}) {
  return <div className="page-intro"><div><div className="section-kicker">{eyebrow}</div><h2>{title}</h2><p>{description}</p></div>{action}</div>;
}
function DataRequired({data,children}) {
  if (data) return children;
  return <section className="empty-state"><div className="empty-mark"><Database size={21}/></div><h2>No dataset selected</h2><p>Enter your simulation settings first, then run the analysis.</p><Link className="button button-primary" to="/simulation">Open Data Simulation</Link></section>;
}
function Section({title, subtitle, action, className = '', children}) {
  return <section className={`section ${className}`}><div className="section-head"><div><h3>{title}</h3>{subtitle && <p>{subtitle}</p>}</div>{action}</div>{children}</section>;
}
function MetricStrip({items}) {
  return <div className="metric-strip">{items.map(([label, value, unit], i) => <div className="metric-cell" key={label}><span>{label}</span><strong className={i === 0 ? 'metric-accent' : ''}>{value ?? '—'}</strong><small>{unit}</small></div>)}</div>;
}
function ChartTooltip({active, payload, label}) {
  if (!active || !payload?.length) return null;
  return <div className="chart-tooltip"><b>{typeof label === 'number' ? `${Math.round(label)} hours` : label}</b>{payload.map(p => <div key={p.dataKey}><i style={{background:p.color}}/>{p.name || p.dataKey}: {typeof p.value === 'number' ? p.value.toFixed(3) : p.value}</div>)}</div>;
}

function Overview({data, id}) {
  if (!data) return <><PageIntro eyebrow="RELIABILITY OVERVIEW" title="Start a machine reliability analysis" description="Enter the number of machines and simulation settings. Results will appear after you run the analysis."/><section className="empty-state overview-empty"><div className="empty-mark"><Database size={21}/></div><h2>No dataset yet</h2><p>Your data will be generated only after you enter the settings and run the simulation.</p><Link className="button button-primary" to="/simulation">Enter simulation details</Link></section></>;
  const s = data.stats;
  const averageReliability = data.groups.length ? data.groups.reduce((a, g) => a + g.reliability_200, 0) / data.groups.length : 0;
  const action = <Link className="button button-primary" to="/simulation"><RefreshCw size={15}/>New simulation</Link>;
  return <>
    <PageIntro eyebrow="RELIABILITY OVERVIEW" title="Machine performance at a glance" description={`Current analysis uses simulated dataset #${id}. Results are estimates based on the selected population.`} action={action}/>
    <Section title="Key indicators" subtitle="Calculated from the active dataset" className="flush-section">
      <MetricStrip items={[
        ['Machines', data.rows, 'simulated records'], ['Mean time to failure', s.mttf == null ? '—' : s.mttf.toFixed(1), 'operating hours'],
        ['Sample variance', s.variance?.toFixed(1), 'hours²'], ['Reliability at 200 h', `${(averageReliability*100).toFixed(1)}%`, 'average across groups'],
      ]}/>
    </Section>
    <div className="content-grid overview-grid">
      <Section title="Failure time distribution" subtitle="Observed runtime frequencies by interval">
        <div className="chart-wrap"><ResponsiveContainer width="100%" height={260}><BarChart data={data.histogram} margin={{top:8,right:10,left:0,bottom:26}}><CartesianGrid vertical={false} stroke={chartColors.grid}/><XAxis dataKey="bin" tickFormatter={x=>Math.round(x)} stroke={chartColors.text} tickLine={false} axisLine={false} label={{value:'Operating hours',position:'insideBottom',offset:-16,fill:chartColors.text,fontSize:11}}/><YAxis stroke={chartColors.text} tickLine={false} axisLine={false} allowDecimals={false} label={{value:'Machine count',angle:-90,position:'insideLeft',fill:chartColors.text,fontSize:11}}/><Tooltip content={<ChartTooltip/>}/><Bar dataKey="count" name="Machines" fill={chartColors.navy} maxBarSize={32}/></BarChart></ResponsiveContainer></div>
      </Section>
      <Section title="Group reliability" subtitle="Estimated survival probability at 200 operating hours">
        <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Group</th><th>Machines</th><th>Mean runtime</th><th>R(200)</th></tr></thead><tbody>{data.groups.map(g=><tr key={g.group}><td><b>Group {g.group}</b></td><td>{g.count}</td><td>{g.mean == null ? '—' : `${g.mean.toFixed(1)} h`}</td><td><span className="reliability-value">{(g.reliability_200*100).toFixed(1)}%</span></td></tr>)}</tbody></table></div>
        <p className="footnote">Group-level model estimates; not individual failure guarantees.</p>
      </Section>
    </div>
    <Section title="Analytical observations" subtitle="Deterministic findings calculated from current results" action={<NavLink className="text-link" to="/insights">All insights <ChevronRight size={14}/></NavLink>}>
      <ul className="insight-list">{data.insights.map((x,i)=><li key={i}><span className="insight-index">0{i+1}</span><p>{x}</p></li>)}</ul>
    </Section>
  </>;
}

function Simulation({generate,busy,id,sets}) {
  const [form,setForm]=useState({count:'',groups:'',distribution:'weibull',scale:'',shape:'',seed:'',censoring:false,censor_hours:''});
  const [rows,setRows]=useState([]),[search,setSearch]=useState(''),[loadingRows,setLoadingRows]=useState(false),[formError,setFormError]=useState('');
  useEffect(()=>{if(!id){setRows([]);setLoadingRows(false);return}let active=true;setLoadingRows(true);api.dataset(id).then(d=>{if(active)setRows(d.rows||[])}).catch(()=>{if(active)setRows([])}).finally(()=>{if(active)setLoadingRows(false)});return()=>{active=false}},[id]);
  const filtered=useMemo(()=>rows.filter(r=>`${r.machine_id} ${r.machine_group} ${r.operating_condition}`.toLowerCase().includes(search.toLowerCase())).slice(0,12),[rows,search]);
  function update(key,value){setForm(x=>({...x,[key]:value}));setFormError('')}
  function submit(){
    const count=Number(form.count),scale=Number(form.scale),shape=Number(form.shape),seed=form.seed===''?null:Number(form.seed),censorHours=Number(form.censor_hours);
    const groups=[...new Set(form.groups.split(',').map(x=>x.trim()).filter(Boolean))];
    if(!Number.isInteger(count)||count<50||count>1000){setFormError('Enter a whole machine count from 50 to 1,000.');return}
    if(!groups.length||groups.length>8){setFormError('Enter 1–8 comma-separated group names.');return}
    if(!(scale>0&&Number.isFinite(scale))){setFormError('Enter a scale greater than zero.');return}
    if(form.distribution==='weibull'&&!(shape>0&&Number.isFinite(shape))){setFormError('Enter a Weibull shape greater than zero.');return}
    if(seed!==null&&!Number.isInteger(seed)){setFormError('Random seed must be a whole number or left blank.');return}
    if(form.censoring&&!(censorHours>0&&Number.isFinite(censorHours))){setFormError('Enter a censoring time greater than zero.');return}
    generate({count,groups,distribution:form.distribution,scale,shape:form.distribution==='weibull'?shape:1.7,seed,censoring:form.censoring,censor_hours:form.censoring?censorHours:400});
  }
  return <>
    <PageIntro eyebrow="DATA MANAGEMENT" title="Simulation setup" description="Enter the settings for your machine sample, then run the simulation to calculate results."/>
    <div className="content-grid simulation-grid">
      <Section title="Your simulation settings" subtitle="No sample dataset is loaded automatically. Required settings are marked with *.">
        <div className="form-grid">
          <label>Number of machines *<input type="number" min="50" max="1000" step="1" inputMode="numeric" value={form.count} onChange={e=>update('count',e.target.value)} placeholder="e.g. 100"/><small>Whole number from 50 to 1,000</small></label>
          <label>Machine groups *<input value={form.groups} onChange={e=>update('groups',e.target.value)} placeholder="e.g. A or A, B, C"/><small>One to eight unique names; separate with commas</small></label>
          <label>Lifetime distribution<select value={form.distribution} onChange={e=>update('distribution',e.target.value)}><option value="weibull">Weibull</option><option value="exponential">Exponential</option></select></label>
          <label>Scale parameter · hours *<input type="number" min="0" step="any" inputMode="decimal" value={form.scale} onChange={e=>update('scale',e.target.value)} placeholder="e.g. 500"/><small>Must be greater than zero</small></label>
          {form.distribution==='weibull'&&<label>Weibull shape β *<input type="number" min="0" step="any" inputMode="decimal" value={form.shape} onChange={e=>update('shape',e.target.value)} placeholder="e.g. 1.7"/><small>Must be greater than zero</small></label>}
          <label>Random seed <input type="number" step="1" inputMode="numeric" value={form.seed} onChange={e=>update('seed',e.target.value)} placeholder="Optional"/><small>Leave blank for a new random sample</small></label>
          <label className="check-field"><input type="checkbox" checked={form.censoring} onChange={e=>update('censoring',e.target.checked)}/> Include right-censored machines</label>
          {form.censoring&&<label>Censoring time · hours *<input type="number" min="0" step="any" inputMode="decimal" value={form.censor_hours} onChange={e=>update('censor_hours',e.target.value)} placeholder="e.g. 400"/></label>}
        </div>
        {formError&&<div className="alert" role="alert">{formError}</div>}
        <button className="button button-primary" disabled={busy} onClick={submit}><RefreshCw size={15}/>{busy?'Running analysis…':'Run simulation and analyze'}</button>
      </Section>
      <Section title="How to enter settings" subtitle="Keep the simulation inputs simple">
        <dl className="definition-list"><div><dt>Machine count</dt><dd>How many runtimes to simulate.</dd></div><div><dt>Group names</dt><dd>Use A for one group, or A, B to compare groups.</dd></div><div><dt>Scale</dt><dd>Typical lifetime scale, in operating hours.</dd></div><div><dt>Weibull shape</dt><dd>Controls how failure risk changes over time.</dd></div><div><dt>Random seed</dt><dd>Optional number to reproduce the same sample.</dd></div></dl>
        <p className="notice"><b>Simulated results</b><br/>The generated sample is illustrative and is not an exact forecast for individual machines.</p>
      </Section>
    </div>
    {id&&<Section title="Active dataset records" subtitle={`${rows.length} records · showing up to 12 matching rows`} action={<label className="search-control"><span>Search</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Machine or group"/></label>}>
      {loadingRows?<p className="muted">Loading dataset records…</p>:<div className="data-table-wrap"><table className="data-table"><thead><tr><th>Machine ID</th><th>Group</th><th>Operating hours</th><th>Failure time</th><th>Status</th><th>Condition</th></tr></thead><tbody>{filtered.map(r=><tr key={r.machine_id}><td><b>{r.machine_id}</b></td><td>{r.machine_group}</td><td>{Number(r.operating_hours).toFixed(2)} h</td><td>{Number(r.failure_time).toFixed(2)} h</td><td><span className={`status-pill ${r.failure_status?'observed':'censored'}`}>{r.failure_status?'Failed':'Censored'}</span></td><td>{r.operating_condition}</td></tr>)}{!filtered.length&&<tr><td colSpan="6" className="empty-cell">No matching records.</td></tr>}</tbody></table></div>}
    </Section>}
    {sets.length>0&&!id&&<p className="muted">Your saved datasets remain available in the dataset selector.</p>}
  </>;
}

function StatTable({title,rows}){return <div className="stat-group"><h3>{title}</h3><table className="stat-table"><tbody>{rows.map(([label,value,unit])=><tr key={label}><th>{label}</th><td>{value==null?'—':typeof value==='number'?value.toFixed(2):value}</td><td>{unit}</td></tr>)}</tbody></table></div>}
function Statistics({data}) {
  const s=data.stats;
  const groups=[
    ['CENTRAL TENDENCY',[['Mean',s.mean,'hours'],['Median',s.median,'hours'],['Mode',s.mode,'hours']]],
    ['DISPERSION',[['Sample variance',s.variance,'hours²'],['Standard deviation',s.std_dev,'hours'],['Coefficient of variation',s.coefficient_of_variation,'ratio']]],
    ['DISTRIBUTION',[['Minimum',s.min,'hours'],['First quartile',s.q1,'hours'],['Third quartile',s.q3,'hours'],['Maximum',s.max,'hours']]],
    ['DATASET INFORMATION',[['Observed failures',s.n_failures,'machines'],['Censored machines',s.n_censored,'machines']]],
  ];
  const compareData=[{name:'Mean',hours:s.mean},{name:'Median',hours:s.median}];
  return <>
    <PageIntro eyebrow="DESCRIPTIVE STATISTICS" title="Failure-time summary" description={`Summary statistics for the active sample. Variance is calculated with the sample convention (n − 1).`}/>
    <Section title="Statistical summary" subtitle="Observed failure times, expressed with units" className="flush-section">
      <div className="stat-grid">{groups.map(([title,rows])=><StatTable key={title} title={title} rows={rows}/>)}</div>
    </Section>
    {s.censoring_warning&&<div className="notice warning-notice"><b>Censoring limitation</b><p>{s.censoring_warning}</p></div>}
    <div className="content-grid stats-charts">
      <Section title="Failure-time histogram" subtitle="Frequency of observed runtimes">
        <div className="chart-wrap"><ResponsiveContainer width="100%" height={265}><BarChart data={data.histogram} margin={{top:8,right:10,left:0,bottom:27}}><CartesianGrid vertical={false} stroke={chartColors.grid}/><XAxis dataKey="bin" tickFormatter={x=>Math.round(x)} stroke={chartColors.text} tickLine={false} axisLine={false} label={{value:'Failure time (hours)',position:'insideBottom',offset:-17,fill:chartColors.text,fontSize:11}}/><YAxis stroke={chartColors.text} tickLine={false} axisLine={false} allowDecimals={false} label={{value:'Frequency',angle:-90,position:'insideLeft',fill:chartColors.text,fontSize:11}}/><Tooltip content={<ChartTooltip/>}/><Bar dataKey="count" name="Machines" fill={chartColors.navy} maxBarSize={32}/></BarChart></ResponsiveContainer></div>
      </Section>
      <Section title="Mean and median" subtitle="Central tendency comparison · operating hours">
        <div className="chart-wrap"><ResponsiveContainer width="100%" height={265}><BarChart data={compareData} margin={{top:20,right:15,left:5,bottom:10}}><CartesianGrid vertical={false} stroke={chartColors.grid}/><XAxis dataKey="name" stroke={chartColors.text} tickLine={false} axisLine={false}/><YAxis stroke={chartColors.text} tickLine={false} axisLine={false} label={{value:'Hours',angle:-90,position:'insideLeft',fill:chartColors.text,fontSize:11}}/><Tooltip content={<ChartTooltip/>}/><Bar dataKey="hours" name="Operating hours" fill={chartColors.teal} maxBarSize={54}/></BarChart></ResponsiveContainer></div>
      </Section>
    </div>
    <Section title="Failure-time box plot" subtitle="Five-number summary · operating hours">
      <BoxPlotSummary stats={s}/>
    </Section>
    <Section title="Formula and interpretation" subtitle="Definitions used by the analysis engine">
      <div className="formula-grid"><div><b>Sample variance</b><code>s² = Σ(xᵢ − x̄)² / (n − 1)</code><p>Uses sample variance to estimate population variability from observations.</p></div><div><b>Coefficient of variation</b><code>CV = s / x̄</code><p>Expresses standard deviation relative to the arithmetic mean.</p></div><div><b>Mean time to failure</b><code>MTTF = Σtᵢ / n</code><p>Shown only for complete failure observations; it is not inferred from failures alone when censoring is present.</p></div></div>
    </Section>
  </>;
}

function BoxPlotSummary({stats}) {
  const low=Number(stats.min)||0, high=Number(stats.max)||0, span=Math.max(high-low,1);
  const pos=value=>`${Math.max(0,Math.min(100,((Number(value)-low)/span)*100))}%`;
  return <div className="boxplot-summary" role="img" aria-label={`Failure-time box plot: minimum ${low.toFixed(1)} hours, first quartile ${Number(stats.q1).toFixed(1)}, median ${Number(stats.median).toFixed(1)}, third quartile ${Number(stats.q3).toFixed(1)}, maximum ${high.toFixed(1)} hours`}>
    <div className="boxplot-axis"><span>{low.toFixed(0)} h</span><span>{(low+span*.25).toFixed(0)}</span><span>{(low+span*.5).toFixed(0)}</span><span>{(low+span*.75).toFixed(0)}</span><span>{high.toFixed(0)} h</span></div>
    <div className="boxplot-track"><i className="boxplot-whisker" style={{left:pos(low),width:`${Math.max(0,((high-low)/span)*100)}%`}}/><i className="boxplot-cap cap-left" style={{left:pos(low)}}/><i className="boxplot-cap cap-right" style={{left:pos(high)}}/><i className="boxplot-box" style={{left:pos(stats.q1),width:`${Math.max(0,((Number(stats.q3)-Number(stats.q1))/span)*100)}%`}}/><i className="boxplot-median" style={{left:pos(stats.median)}}/></div>
    <div className="boxplot-values"><span><b>Min</b>{low.toFixed(1)} h</span><span><b>Q1</b>{Number(stats.q1).toFixed(1)} h</span><span><b>Median</b>{Number(stats.median).toFixed(1)} h</span><span><b>Q3</b>{Number(stats.q3).toFixed(1)} h</span><span><b>Max</b>{high.toFixed(1)} h</span></div>
  </div>;
}

function Distributions({data}) {
  const models=data.distributions.models;
  const curve=models[0].curve.map((p,i)=>({hours:p.hours,...Object.fromEntries(models.map(m=>[m.name,m.curve[i].density]))}));
  return <>
    <PageIntro eyebrow="PROBABILITY MODELS" title="Lifetime distribution fitting" description="Compare fitted lifetime models using likelihood and Akaike information criterion." action={<span className="model-result">Lowest AIC <b>{data.distributions.best_fit}</b></span>}/>
    <Section title="Probability density comparison" subtitle="Fitted density curves across observed operating hours">
      <div className="chart-wrap"><ResponsiveContainer width="100%" height={340}><LineChart data={curve} margin={{top:10,right:20,left:5,bottom:28}}><CartesianGrid stroke={chartColors.grid} vertical={false}/><XAxis dataKey="hours" stroke={chartColors.text} tickLine={false} axisLine={false} label={{value:'Operating hours',position:'insideBottom',offset:-17,fill:chartColors.text,fontSize:11}}/><YAxis stroke={chartColors.text} tickLine={false} axisLine={false} label={{value:'Probability density',angle:-90,position:'insideLeft',fill:chartColors.text,fontSize:11}}/><Tooltip content={<ChartTooltip/>}/><Legend verticalAlign="top" height={35}/><Line name="Exponential" dataKey="exponential" stroke={chartColors.navy} dot={false} strokeWidth={2}/><Line name="Weibull" dataKey="weibull" stroke={chartColors.teal} dot={false} strokeWidth={2}/><Line name="Normal" dataKey="normal" stroke={chartColors.violet} dot={false} strokeWidth={2}/></LineChart></ResponsiveContainer></div>
      <p className="footnote">Normal curves may assign probability to negative failure times and may be unsuitable for lifetime analysis.</p>
    </Section>
    <Section title="Model estimates" subtitle="Parameters and fit criteria from the current dataset">
      <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Model</th><th>Fitted parameters</th><th>Log-likelihood</th><th>AIC</th><th>Assessment</th></tr></thead><tbody>{models.map(m=><tr key={m.name}><td><b>{m.name[0].toUpperCase()+m.name.slice(1)}</b>{m.name===data.distributions.best_fit&&<span className="sub-label">Lowest AIC</span>}</td><td>{Object.entries(m.parameters).map(([k,v])=>`${k} = ${v.toFixed(3)}`).join(' · ')}</td><td>{m.log_likelihood.toFixed(2)}</td><td>{m.aic.toFixed(2)}</td><td>{m.goodness_of_fit}</td></tr>)}</tbody></table></div>
      <p className="footnote">{data.distributions.interpretation}</p>
    </Section>
  </>;
}

function FTest({id,data}) {
  const [a,setA]=useState(data.groups[0]?.group||'A'),[b,setB]=useState(data.groups[1]?.group||'B'),[r,setR]=useState(null),[err,setErr]=useState(''),[loading,setLoading]=useState(false);
  async function run(){setLoading(true);try{setR(await api.ftest({dataset_id:Number(id),group_a:a,group_b:b,alpha:.05}));setErr('')}catch(e){setErr(e.message)}finally{setLoading(false)}}
  if(data.groups.length<2)return <><PageIntro eyebrow="HYPOTHESIS TESTING" title="Variance comparison · F-test" description="The F-test compares the variability of two machine groups."/><Section title="Two groups are needed" subtitle="Your current dataset contains only one group."><p className="muted">Run a new simulation with at least two group names, such as A, B, to compare their sample variances.</p><Link className="button button-primary" to="/simulation">Update simulation settings</Link></Section></>;
  return <>
    <PageIntro eyebrow="HYPOTHESIS TESTING" title="Variance comparison · F-test" description="Assess whether two machine groups show evidence of different failure-time variances."/>
    <Section title="Test specification" subtitle="Classical two-sided F test · significance level α = 0.05">
      <div className="hypothesis-box"><div><b>Null hypothesis · H₀</b><p>σ²A = σ²B · the population variances are equal</p></div><div><b>Alternative hypothesis · H₁</b><p>σ²A ≠ σ²B · the population variances differ</p></div></div>
      <div className="inline-form"><label>Group A<select value={a} onChange={e=>setA(e.target.value)}>{data.groups.map(g=><option key={g.group} value={g.group}>Group {g.group}</option>)}</select></label><label>Group B<select value={b} onChange={e=>setB(e.target.value)}>{data.groups.map(g=><option key={g.group} value={g.group}>Group {g.group}</option>)}</select></label><button className="button button-primary" disabled={loading||a===b} onClick={run}><FlaskConical size={15}/>{loading?'Calculating…':'Run F-test'}</button></div>
      {err&&<div className="alert" role="alert">{err}</div>}
    </Section>
    {r&&<>
      <Section title="Test result" subtitle={`${r.group_a} compared with ${r.group_b}`}>
        <MetricStrip items={ [['F statistic',r.f_statistic.toFixed(4),'variance ratio'],['p-value',r.p_value.toFixed(5),'two-sided'],['Degrees of freedom',`${r.df_num}, ${r.df_den}`,'numerator, denominator'],['Significance level',r.alpha.toFixed(2),'α']]}/>
        <div className={`result-callout ${r.significant?'result-warning':''}`}><b>{r.conclusion}</b><p>At α = {r.alpha}, {r.significant?'reject':'fail to reject'} the null hypothesis. The p-value is the probability, assuming H₀ and test assumptions, of observing a result at least this extreme.</p></div>
        <div className="decision-plot"><div className="decision-label"><span>Rejection region</span><span>Do not reject H₀</span><span>Rejection region</span></div><div className="decision-scale"><i className="reject-left"/><i className="accept-zone"/><i className="reject-right"/><span className="observed-f" style={{left:`${Math.max(3,Math.min(97,(r.f_statistic/(r.upper_critical*1.35))*100))}%`}} title={`Observed F = ${r.f_statistic.toFixed(3)}`}/></div><div className="decision-values"><span>F = {r.lower_critical.toFixed(3)}</span><b>Observed F = {r.f_statistic.toFixed(3)}</b><span>F = {r.upper_critical.toFixed(3)}</span></div></div>
        <p className="notice">{r.assumption_warning}</p>
      </Section>
    </>}
  </>;
}

function Reliability({id,data}) {
  const [g,setG]=useState(''),[hours,setH]=useState(200),[age,setA]=useState(0),[model,setM]=useState(''),[r,setR]=useState(null),[err,setErr]=useState(''),[loading,setLoading]=useState(false);
  async function run(){setLoading(true);try{setR(await api.reliability({dataset_id:Number(id),group:g||null,hours:Number(hours),age:Number(age),distribution:model||null}));setErr('')}catch(e){setErr(e.message)}finally{setLoading(false)}}
  const curve=r?Object.entries(r.milestones).map(([h,v])=>({hours:Number(h),reliability:v*100})).sort((a,b)=>a.hours-b.hours):[];
  return <>
    <PageIntro eyebrow="SURVIVAL ANALYSIS" title="Reliability forecast" description="Estimate population survival probabilities at selected operating horizons."/>
    <Section title="Forecast parameters" subtitle="Choose the lifetime population and operating interval">
      <div className="form-grid forecast-form"><label>Machine group<select value={g} onChange={e=>setG(e.target.value)}><option value="">All groups</option>{data.groups.map(x=><option key={x.group} value={x.group}>Group {x.group}</option>)}</select></label><label>Lifetime model<select value={model} onChange={e=>setM(e.target.value)}><option value="">Best AIC reliability model</option><option value="weibull">Weibull</option><option value="exponential">Exponential</option></select></label><label>Forecast interval · Δt hours<input type="number" min="0" value={hours} onChange={e=>setH(e.target.value)}/></label><label>Already survived age · a hours<input type="number" min="0" value={age} onChange={e=>setA(e.target.value)}/></label></div>
      <div className="formula-band"><b>Conditional survival</b><code>P(T &gt; a + Δt | T &gt; a) = R(a + Δt) / R(a)</code></div>
      <button className="button button-primary" disabled={loading} onClick={run}><Activity size={15}/>{loading?'Calculating…':'Calculate forecast'}</button>{err&&<div className="alert" role="alert">{err}</div>}
    </Section>
    {r&&<>
      <Section title="Forecast result" subtitle={`${r.model.name[0].toUpperCase()+r.model.name.slice(1)} model · ${r.conditional?'conditional remaining-life':'total lifetime'} estimate`}>
        <div className="forecast-result"><div className="primary-result"><span>RELIABILITY</span><strong>{(r.reliability*100).toFixed(2)}<small>%</small></strong><p>{r.risk_category}</p></div><div className="result-detail"><span>Failure probability</span><b>{(r.failure_probability*100).toFixed(2)}%</b><small>Over next {r.hours} operating hours</small></div><div className="result-detail"><span>Expected lifetime</span><b>{r.expected_lifetime.toFixed(1)} h</b><small>Model-based expectation</small></div><div className="result-detail"><span>Model parameters</span><b>{Object.entries(r.model.parameters).map(([k,v])=>`${k} ${v.toFixed(3)}`).join(' · ')}</b><small>{r.fit_summary}</small></div></div>
      </Section>
      <div className="content-grid">
        <Section title="Reliability curve" subtitle="Survival probability at fixed operating horizons">
          <div className="chart-wrap"><ResponsiveContainer width="100%" height={255}><LineChart data={curve} margin={{top:10,right:15,left:5,bottom:27}}><CartesianGrid stroke={chartColors.grid} vertical={false}/><XAxis dataKey="hours" stroke={chartColors.text} tickLine={false} axisLine={false} label={{value:'Operating hours',position:'insideBottom',offset:-16,fill:chartColors.text,fontSize:11}}/><YAxis domain={[0,100]} stroke={chartColors.text} tickLine={false} axisLine={false} label={{value:'Reliability (%)',angle:-90,position:'insideLeft',fill:chartColors.text,fontSize:11}}/><Tooltip content={<ChartTooltip/>}/><Line name="Reliability" dataKey="reliability" stroke={chartColors.navy} strokeWidth={2} dot={{r:3,fill:chartColors.navy}} activeDot={{r:5}}/></LineChart></ResponsiveContainer></div>
        </Section>
        <Section title="Standard horizons" subtitle="Unconditional reliability by operating time">
          <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Hours</th><th>Reliability</th><th>Failure probability</th></tr></thead><tbody>{Object.entries(r.milestones).map(([h,v])=><tr key={h}><td>{h} h</td><td>{(v*100).toFixed(2)}%</td><td>{((1-v)*100).toFixed(2)}%</td></tr>)}</tbody></table></div>
          <p className="footnote">Educational risk thresholds: high ≥80%, moderate 50–79.99%, low &lt;50%. They are not certified maintenance standards.</p>
        </Section>
      </div>
      <p className="notice">These are group-level population estimates, not exact failure-time predictions for an individual machine.</p>
    </>}
  </>;
}

function Insights({data}) {
  return <>
    <PageIntro eyebrow="AUTOMATED ANALYSIS" title="Reliability intelligence" description="Deterministic observations derived from the selected dataset. Estimates are labelled separately from observed data."/>
    <Section title="Current findings" subtitle={`${data.insights.length} priority observation${data.insights.length===1?'':'s'} from dataset #${data.dataset_id}`}>
      <ul className="insight-list insight-list-large">{data.insights.map((x,i)=><li key={i}><span className="insight-index">0{i+1}</span><div><b>{i===0?'Primary observation':i===1?'Supporting observation':'Additional context'}</b><p>{x}</p></div></li>)}</ul>
    </Section>
    <Chat id={data.dataset_id}/>
  </>;
}
function Chat({id}) {
  const [q,setQ]=useState(''),[msgs,setMsgs]=useState([]),[loading,setLoading]=useState(false),[err,setErr]=useState('');
  async function send(){if(!q.trim()||loading)return;const text=q.trim();setQ('');setMsgs(m=>[...m,{from:'you',text}]);setLoading(true);setErr('');try{const r=await api.chat({dataset_id:Number(id),question:text});setMsgs(m=>[...m,{from:'bot',text:r.answer}])}catch(e){setErr(e.message)}finally{setLoading(false)}}
  return <Section title="Ask ReliBot" subtitle="Rule-based explanations from computed results; no generative model is used.">
    <div className="chat-content">{msgs.length===0?<p className="muted">Try: “Why is variance high?” or “Explain the Weibull distribution.”</p>:msgs.map((m,i)=><div className={`chat-message ${m.from}`} key={i}><b>{m.from==='you'?'You':'ReliBot'}</b><p>{m.text}</p></div>)}{loading&&<p className="muted">Reading current analysis…</p>}{err&&<p className="inline-error">{err}</p>}</div>
    <form className="chat-form" onSubmit={e=>{e.preventDefault();send()}}><input aria-label="Question for ReliBot" value={q} onChange={e=>setQ(e.target.value)} placeholder="Ask a question about this analysis"/><button className="button button-primary" disabled={loading||!q.trim()}><Send size={15}/>Send</button></form>
  </Section>;
}

function Reports({id,data}) {
  const s=data.stats;
  return <>
    <PageIntro eyebrow="EXPORTS & DOCUMENTATION" title="Analysis report" description="Download a reproducible machine dataset or a PDF summary based on the current selection."/>
    <Section title="Report preview" subtitle="MACHINEPRED AI · simulated reliability analysis">
      <div className="report-preview"><div className="report-heading"><div><span>ENGINEERING ANALYSIS</span><h3>Machine reliability summary</h3></div><small>Dataset #{id}</small></div><div className="report-meta"><span><b>Records</b>{data.rows} machines</span><span><b>Observed failures</b>{s.n_failures}</span><span><b>Lowest-AIC model</b>{data.distributions.best_fit}</span></div><div className="report-section"><b>Summary</b><p>Mean observed failure time: {s.mttf==null?'not estimated under censoring':`${s.mttf.toFixed(1)} operating hours`}. Sample variance: {s.variance?.toFixed(1)} hours².</p></div><div className="report-section"><b>Key findings</b><ul>{data.insights.map((x,i)=><li key={i}>{x}</li>)}</ul></div><div className="report-disclaimer">Simulated educational data. Model estimates do not guarantee individual machine outcomes.</div></div>
    </Section>
    <Section title="Export files" subtitle="Values are generated from the active dataset at download time.">
      <div className="export-actions"><a className="button button-primary" href={api.url(`/export/${id}.csv`)}><Download size={15}/> Download dataset CSV</a><a className="button button-outline" href={api.url(`/report/${id}.pdf`)}><FileText size={15}/> Generate PDF report</a></div>
    </Section>
  </>;
}
