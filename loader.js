'use strict';
/* LOADER.JS v3 — agrega mis-cotizaciones */
const Loader = (() => {
  const PARTIALS = [
    { url:'partials/topbar.html',  target:'partial-topbar'  },
    { url:'partials/header.html',  target:'partial-header'  },
    { url:'partials/sidebar.html', target:'partial-sidebar' },
    { url:'partials/footer.html',  target:'partial-footer'  },
  ];
  const VIEWS = [
    'views/home.html','views/catalogo.html','views/detalle.html',
    'views/simulador.html','views/vision.html','views/clientes.html',
    'views/login.html','views/contacto.html','views/mis-cotizaciones.html',
    'views/registro.html',
  ];
  async function fetchHTML(url) {
    try { const r=await fetch(url); if(!r.ok){console.warn(`[Loader] No cargó: ${url}`);return '';} return r.text(); }
    catch(err){console.error(`[Loader] Error ${url}:`,err);return '';}
  }
  async function loadPartials() {
    await Promise.all(PARTIALS.map(async({url,target})=>{
      const html=await fetchHTML(url);
      const el=document.getElementById(target);
      if(el&&html) el.innerHTML=html;
    }));
  }
  async function loadViews() {
    const chunks=await Promise.all(VIEWS.map(fetchHTML));
    const app=document.getElementById('app'); if(!app) return;
    document.getElementById('appLoading')?.remove();
    chunks.forEach(html=>{ if(!html) return; const t=document.createElement('div'); t.innerHTML=html; while(t.firstChild) app.appendChild(t.firstChild); });
  }
  function initMap() {
    const mapDiv=document.getElementById('map'); const placeholder=document.getElementById('map-placeholder');
    if(!mapDiv||!placeholder||typeof L==='undefined') return;
    const LAT=18.651633377724096, LNG=-91.83675098241301;
    mapDiv.style.display='block'; placeholder.style.display='none';
    const map=L.map('map',{scrollWheelZoom:false}).setView([LAT,LNG],17);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap',maxZoom:19}).addTo(map);
    const pinIcon=L.divIcon({className:'',html:`<img src="img/pin.svg" style="width:auto;height:60px;display:block;">`,iconSize:[48,60],iconAnchor:[24,60],popupAnchor:[5,-60]});
    const gmapsURL='https://www.google.com/maps/dir//18.6516745,-91.836765/@18.6285654,-91.8396296,14z';
    const popupHTML=`<div style="font-family:'Segoe UI',Arial,sans-serif;min-width:220px;max-width:260px;color:#1a1a2e;"><div style="background:#0a2a4a;color:#fff;padding:10px 14px 8px;border-radius:6px 6px 0 0;margin:-14px -25px 10px -21px;"><strong>SERTECSUR</strong><br><span style="font-size:.75rem;opacity:.85;">Seguridad &amp; Tecnología</span></div><div style="font-size:.82rem;line-height:1.45;margin-bottom:9px;">Calle 55 #50, Col. Electricistas<br>24120 Cd. del Carmen, CAM<br><a href="tel:+529381532506" style="color:#0a2a4a;font-weight:600;text-decoration:none;">938 153 2506</a></div><div style="font-size:.8rem;line-height:1.6;margin-bottom:11px;"><div style="display:grid;grid-template-columns:auto 1fr;gap:0 8px;"><span>Lun–Vie</span><span style="color:#2a7a2a;font-weight:600;">09:00–19:00</span><span>Sábado</span><span style="color:#2a7a2a;font-weight:600;">09:00–17:00</span><span>Domingo</span><span style="color:#c0392b;font-weight:600;">Cerrado</span></div></div><a href="${gmapsURL}" target="_blank" style="display:block;background:#0a2a4a;color:#fff;text-align:center;padding:8px 0;border-radius:5px;font-size:.82rem;font-weight:600;text-decoration:none;">Obtener indicaciones</a></div>`;
    L.marker([LAT,LNG],{icon:pinIcon}).addTo(map).bindPopup(popupHTML,{maxWidth:280});
    const viewEl=mapDiv.closest('.view')||mapDiv.parentElement;
    if(viewEl){const obs=new MutationObserver(()=>{if(mapDiv.offsetWidth>0&&mapDiv.offsetHeight>0)map.invalidateSize();});obs.observe(viewEl,{attributes:true,attributeFilter:['class','style']});}
    setTimeout(()=>map.invalidateSize(),300);
  }
  async function boot() {
    await Promise.all([loadPartials(),loadViews()]);
    initMap();
    if(typeof initSession==='function') await initSession();
    if(typeof ChatPopup!=='undefined'&&ChatPopup.init) ChatPopup.init();
    // Activar vista según hash inicial
    const initView = (typeof getHashView === 'function') ? getHashView() : 'home';
    if(typeof _activateView==='function') _activateView(initView);
    else if(typeof showView==='function') showView(initView);
    console.log('[Loader] Aplicación lista.');
  }
  return {boot};
})();
document.addEventListener('DOMContentLoaded',()=>Loader.boot());
