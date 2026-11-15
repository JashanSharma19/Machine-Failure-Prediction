// On Vercel, route through the shared domain so browser requests follow the
// /api rewrite. Set VITE_API_URL only for a separately hosted local API.
const defaultBase=import.meta.env.DEV?'http://localhost:8000/api':'/api';
const BASE=(import.meta.env.VITE_API_URL||defaultBase).replace(/\/$/,'');
async function request(path,options={}){const r=await fetch(BASE+path,options);if(!r.ok){let m='Request failed';try{m=(await r.json()).detail||m}catch{}throw new Error(m)}return r.json()}
export const api={datasets:()=>request('/datasets'),dataset:id=>request(`/datasets/${id}`),analysis:id=>request(`/datasets/${id}/analysis`),generate:body=>request('/datasets',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),ftest:body=>request('/f-test',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),reliability:body=>request('/reliability',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),chat:body=>request('/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),risk:id=>request(`/risk/${id}`),url:path=>BASE+path};
