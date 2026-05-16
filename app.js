'use strict';
/* ================================================
   APP.JS v3 — SERTECSUR
   · Hash routing (#home, #catalogo, etc.)
   · Productos desde BD
   · Desplegable "Cotizar" en detalle y carrito
   · Carrito: imagen + link al producto
   · Mis cotizaciones: imagen del producto
   · Reseñas desbloqueadas solo con cot. aprobada
================================================ */

const $ = (sel,ctx=document)=>ctx.querySelector(sel);
const $$ = (sel,ctx=document)=>[...ctx.querySelectorAll(sel)];

let PRODUCTS = [];
let _toastTimer;
let _currentView = 'home';

/* ══════════ HASH ROUTING ══════════ */
const VIEW_MAP = {
  '':               'home',
  '#':              'home',
  '#home':          'home',
  '#catalogo':      'catalogo',
  '#detalle':       'detalle',
  '#simulador':     'simulador',
  '#vision':        'vision',
  '#clientes':      'clientes',
  '#login':         'login',
  '#contacto':      'contacto',
  '#mis-cotizaciones': 'mis-cotizaciones',
};

function getHashView() {
  const hash = window.location.hash || '#home';
  return VIEW_MAP[hash] || 'home';
}

function pushView(viewID) {
  const hashMap = {
    'home':'#home','catalogo':'#catalogo','detalle':'#detalle',
    'simulador':'#simulador','vision':'#vision','clientes':'#clientes',
    'login':'#login','contacto':'#contacto','mis-cotizaciones':'#mis-cotizaciones'
  };
  const newHash = hashMap[viewID] || '#home';
  if (window.location.hash !== newHash) {
    history.pushState({view: viewID}, '', newHash);
  }
}

window.addEventListener('popstate', (e) => {
  const view = (e.state && e.state.view) ? e.state.view : getHashView();
  _activateView(view);
});

/* ══════════ SESSION ══════════ */
const Session = {
  user: null,

  async check() {
    try {
      const r = await fetch('db.php?action=me');
      const d = await r.json();
      this.user = (d.ok && d.data) ? d.data : null;
    } catch { this.user = null; }
    this.updateUI();
    return this.user;
  },

  updateUI() {
    const isLogged = !!this.user;
    const isClient = this.user?.rol === 'cliente';

    $$('[data-action="login-btn"]').forEach(btn => {
      if (isLogged) {
        btn.innerHTML = `<i class="fa-solid fa-user-check"></i> ${this.user.nombre.split(' ')[0]}`;
        btn.onclick = e => { e.preventDefault(); this.showUserMenu(); };
      } else {
        btn.innerHTML = `<i class="fa-solid fa-user"></i>`;
        btn.onclick = e => { e.preventDefault(); showView('login'); };
      }
    });

    $$('[data-cart-btn]').forEach(el => el.style.display = isClient ? 'inline-flex' : 'none');

    $$('[data-login-link]').forEach(el => {
      el.textContent = isLogged ? 'Mi cuenta' : 'Iniciar sesión';
      el.onclick = e => { e.preventDefault(); isLogged ? this.showUserMenu() : showView('login'); };
    });
  },

  showUserMenu() {
    document.getElementById('userMenu')?.remove();
    const menu = document.createElement('div');
    menu.id = 'userMenu';
    menu.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:800;';
    menu.innerHTML = `
      <div style="position:absolute;top:110px;right:1rem;background:#fff;border:1px solid var(--clr-border);border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,.15);width:230px;overflow:hidden;z-index:801;animation:menuIn .15s ease;">
        <style>@keyframes menuIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}</style>
        <div style="padding:.85rem 1rem;background:var(--clr-primary);color:#fff;">
          <div style="font-weight:700;font-size:.9rem;">${this.user.nombre}</div>
          <div style="font-size:.72rem;opacity:.7;">${this.user.correo}</div>
          <span style="background:rgba(255,255,255,.2);color:#fff;padding:.1rem .45rem;border-radius:10px;font-size:.65rem;font-weight:700;display:inline-block;margin-top:.3rem;">${this.user.rol.toUpperCase()}</span>
        </div>
        <div style="padding:.4rem 0;">
          ${this.user.rol==='admin'?`<button onclick="window.location.href='admin.html'" style="display:flex;align-items:center;gap:.5rem;width:100%;padding:.55rem 1rem;font-size:.85rem;color:var(--clr-primary);background:none;border:none;cursor:pointer;font-family:var(--font-base);"><i class="fa-solid fa-gauge" style="color:var(--clr-accent);width:16px;"></i> Panel de admin</button>`:''}
          ${this.user.rol==='cliente'?`
            <button onclick="document.getElementById('userMenu')?.remove();Cart.open()" style="display:flex;align-items:center;gap:.5rem;width:100%;padding:.55rem 1rem;font-size:.85rem;color:var(--clr-primary);background:none;border:none;cursor:pointer;font-family:var(--font-base);"><i class="fa-solid fa-cart-shopping" style="color:var(--clr-accent);width:16px;"></i> Mi carrito <span style="margin-left:auto;background:var(--clr-accent);color:#fff;font-size:.62rem;padding:.1rem .4rem;border-radius:10px;">${Cart.items.length}</span></button>
            <button onclick="document.getElementById('userMenu')?.remove();showView('mis-cotizaciones')" style="display:flex;align-items:center;gap:.5rem;width:100%;padding:.55rem 1rem;font-size:.85rem;color:var(--clr-primary);background:none;border:none;cursor:pointer;font-family:var(--font-base);"><i class="fa-solid fa-file-invoice-dollar" style="color:var(--clr-accent);width:16px;"></i> Mis cotizaciones</button>
          `:''}
          <button onclick="Session.logout()" style="display:flex;align-items:center;gap:.5rem;width:100%;padding:.55rem 1rem;font-size:.85rem;color:#dc2626;background:none;border:none;cursor:pointer;font-family:var(--font-base);"><i class="fa-solid fa-right-from-bracket" style="width:16px;"></i> Cerrar sesión</button>
        </div>
      </div>`;
    document.body.appendChild(menu);
    menu.addEventListener('click', e => { if(e.target===menu) menu.remove(); });
  },

  async logout() {
    document.getElementById('userMenu')?.remove();
    await fetch('db.php?action=logout',{method:'POST'});
    this.user = null; Cart.items = []; Cart.updateBadge(); this.updateUI();
    showView('home'); showToast('Sesión cerrada','info');
  }
};

/* ══════════ LOGIN ══════════ */
async function handleLogin(e) {
  e.preventDefault();
  const correo     = document.getElementById('login-email').value.trim();
  const contrasena = document.getElementById('login-pass').value.trim();
  const btn        = document.getElementById('loginBtn');
  const alertEl    = document.getElementById('loginAlert');
  if (!correo||!contrasena) return;
  btn.disabled=true; btn.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Entrando…';
  alertEl.style.display='none';
  try {
    const res = await fetch('db.php?action=login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({correo,contrasena})});
    const data = await res.json();
    if (data.ok) {
      await Session.check();
      if (data.data.rol==='admin') { window.location.href='admin.html'; }
      else { await Cart.load(); showView('home'); showToast(`¡Bienvenido, ${data.data.nombre}!`,'success'); }
    } else {
      alertEl.style.cssText='display:flex;align-items:center;gap:.5rem;padding:.6rem 1rem;border-radius:8px;font-size:.84rem;margin-bottom:1rem;background:#fee2e2;color:#b91c1c;border:1px solid #fecaca;';
      alertEl.innerHTML=`<i class="fa-solid fa-circle-xmark"></i> ${data.error||'Credenciales incorrectas'}`;
    }
  } catch {
    alertEl.style.cssText='display:flex;align-items:center;gap:.5rem;padding:.6rem 1rem;border-radius:8px;font-size:.84rem;margin-bottom:1rem;background:#fee2e2;color:#b91c1c;border:1px solid #fecaca;';
    alertEl.innerHTML='<i class="fa-solid fa-circle-xmark"></i> Error de conexión.';
  } finally { btn.disabled=false; btn.innerHTML='<i class="fa-solid fa-right-to-bracket"></i> Entrar'; }
}

/* ══════════ TOAST ══════════ */
function showToast(msg, type='success') {
  let t=document.getElementById('appToast');
  if(!t){t=document.createElement('div');t.id='appToast';t.style.cssText='position:fixed;bottom:1.5rem;left:50%;transform:translateX(-50%) translateY(80px);z-index:900;transition:transform .3s cubic-bezier(.34,1.56,.64,1),opacity .3s;opacity:0;pointer-events:none;';document.body.appendChild(t);}
  const colors={success:'#166534',error:'#991b1b',info:'#1a3a5c'};
  t.innerHTML=`<div style="background:${colors[type]||colors.info};color:#fff;padding:.65rem 1.2rem;border-radius:8px;font-size:.85rem;display:flex;align-items:center;gap:.5rem;box-shadow:0 4px 20px rgba(0,0,0,.25);font-family:var(--font-base);"><i class="fa-solid ${type==='success'?'fa-circle-check':type==='error'?'fa-circle-xmark':'fa-circle-info'}"></i>${msg}</div>`;
  requestAnimationFrame(()=>{t.style.transform='translateX(-50%) translateY(0)';t.style.opacity='1';});
  clearTimeout(_toastTimer);
  _toastTimer=setTimeout(()=>{t.style.transform='translateX(-50%) translateY(80px)';t.style.opacity='0';},3200);
}

/* ══════════ CARRITO ══════════ */
const Cart = {
  items:[], cartId:null,

  async load() {
    if(!Session.user||Session.user.rol!=='cliente') return;
    try{const r=await fetch('db.php?action=carrito');const d=await r.json();if(d.ok){this.items=d.data.items||[];this.cartId=d.data.cartId||null;this.updateBadge();}}catch{}
  },

  async add(productoId) {
    if(!Session.user){showToast('Inicia sesión para agregar al carrito','info');showView('login');return;}
    if(Session.user.rol!=='cliente'){showToast('Solo clientes pueden usar el carrito','info');return;}
    try{const r=await fetch('db.php?action=carrito',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({producto_id:productoId,cantidad:1})});const d=await r.json();if(d.ok){await this.load();showToast('Producto agregado al carrito');}}
    catch{showToast('Error al agregar','error');}
  },

  async remove(itemId){
    try{await fetch(`db.php?action=carrito&id=${itemId}`,{method:'DELETE'});await this.load();this.renderPanel();}catch{}
  },

  updateBadge(){
    const count=this.items.length;
    $$('[data-cart-count]').forEach(el=>{el.textContent=count;el.style.display=count>0?'inline-flex':'none';});
  },

  open(){document.getElementById('userMenu')?.remove();this.renderPanel();document.getElementById('cartPanel')?.classList.add('open');document.getElementById('cartOverlay')?.classList.add('open');},
  close(){document.getElementById('cartPanel')?.classList.remove('open');document.getElementById('cartOverlay')?.classList.remove('open');},

  renderPanel() {
    const body=document.getElementById('cartBody');
    if(!body) return;
    if(!this.items.length){
      body.innerHTML=`<div style="text-align:center;padding:2rem 1rem;color:var(--clr-muted);"><i class="fa-solid fa-cart-shopping" style="font-size:2.5rem;opacity:.2;display:block;margin-bottom:.75rem;"></i><p style="font-size:.88rem;">Tu carrito está vacío</p></div>`;
      document.getElementById('cartTotal').textContent='$0.00'; return;
    }
    let total=0;
    body.innerHTML=this.items.map(item=>{
      const sub=(item.precio||0)*(item.cantidad||1); total+=sub;
      return `<div style="display:flex;gap:.75rem;align-items:flex-start;padding:.75rem 0;border-bottom:1px solid var(--clr-border);">
        <img src="${item.img_url||''}" style="width:48px;height:48px;object-fit:cover;border-radius:6px;border:1px solid var(--clr-border);flex-shrink:0;cursor:pointer;" onclick="Cart.close();showDetailById(${item.producto_id})" onerror="this.style.display='none'"/>
        <div style="flex:1;min-width:0;">
          <p style="font-size:.84rem;font-weight:500;color:var(--clr-dark);line-height:1.3;cursor:pointer;" onclick="Cart.close();showDetailById(${item.producto_id})">${item.nombre}</p>
          <p style="font-size:.75rem;color:var(--clr-muted);">Cant: ${item.cantidad} · $${parseFloat(item.precio).toLocaleString('es-MX',{minimumFractionDigits:2})}</p>
        </div>
        <div style="text-align:right;flex-shrink:0;">
          <p style="font-size:.88rem;font-weight:700;color:var(--clr-primary);">$${sub.toLocaleString('es-MX',{minimumFractionDigits:2})}</p>
          <button onclick="Cart.remove(${item.id_item})" style="color:var(--clr-accent);font-size:.72rem;margin-top:.2rem;background:none;border:none;cursor:pointer;font-family:var(--font-base);"><i class="fa-solid fa-trash"></i> Quitar</button>
        </div>
      </div>`;
    }).join('');
    document.getElementById('cartTotal').textContent='$'+total.toLocaleString('es-MX',{minimumFractionDigits:2});

    // Botones de cotización en el footer del carrito
    const footer = document.getElementById('cartFooterBtns');
    if (footer) {
      footer.innerHTML = `
        <div style="position:relative;display:inline-block;width:100%;" id="cartCotDropWrap">
          <button onclick="toggleCotDrop('cartCotDrop')"
            style="width:100%;display:flex;align-items:center;justify-content:center;gap:.5rem;background:var(--clr-accent);color:#fff;padding:.65rem;border-radius:8px;font-size:.88rem;font-weight:700;border:none;cursor:pointer;font-family:var(--font-base);">
            <i class="fa-solid fa-file-invoice-dollar"></i> Cotizar <i class="fa-solid fa-chevron-down" style="font-size:.7rem;margin-left:auto;"></i>
          </button>
          <div id="cartCotDrop" style="display:none;position:absolute;bottom:110%;left:0;right:0;background:#fff;border:1px solid var(--clr-border);border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,.15);overflow:hidden;z-index:10;">
            <a href="${buildWaCart()}" target="_blank" rel="noopener noreferrer"
              style="display:flex;align-items:center;gap:.6rem;padding:.7rem 1rem;font-size:.84rem;color:var(--clr-text);text-decoration:none;border-bottom:1px solid var(--clr-border);">
              <i class="fa-brands fa-whatsapp" style="color:#22c55e;font-size:1rem;"></i> Cotizar por WhatsApp
            </a>
            <button onclick="showToast('El chat estará disponible próximamente.','info');document.getElementById('cartCotDrop').style.display='none';"
              style="display:flex;align-items:center;gap:.6rem;padding:.7rem 1rem;font-size:.84rem;color:var(--clr-text);background:none;border:none;border-bottom:1px solid var(--clr-border);cursor:pointer;width:100%;font-family:var(--font-base);">
              <i class="fa-solid fa-comments" style="color:var(--clr-primary);font-size:1rem;"></i> Cotizar por chat
            </button>
            <button onclick="cotizarAhora();document.getElementById('cartCotDrop').style.display='none';"
              style="display:flex;align-items:center;gap:.6rem;padding:.7rem 1rem;font-size:.84rem;color:var(--clr-text);background:none;border:none;cursor:pointer;width:100%;font-family:var(--font-base);">
              <i class="fa-solid fa-file-arrow-down" style="color:#0f766e;font-size:1rem;"></i> Cotizar ahora (PDF)
            </button>
          </div>
        </div>`;
    }
  }
};

function buildWaCart() {
  const nombres = Cart.items.map(i=>`${i.nombre} x${i.cantidad}`).join(', ');
  return `https://wa.me/529381329935?text=${encodeURIComponent('Hola! Quiero cotizar: '+nombres)}`;
}

function toggleCotDrop(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const isOpen = el.style.display !== 'none';
  // Cerrar todos
  $$('[id$="CotDrop"]').forEach(d=>d.style.display='none');
  if (!isOpen) el.style.display='block';
}

// Cerrar dropdowns al hacer click fuera
document.addEventListener('click', e => {
  if (!e.target.closest('[id$="CotDropWrap"]') && !e.target.closest('[id$="CotDrop"]')) {
    $$('[id$="CotDrop"]').forEach(d=>d.style.display='none');
  }
});

/* ══════════ PRODUCTOS DESDE BD ══════════ */
async function loadProductsFromDB() {
  try {
    const r = await fetch('db.php?action=productos');
    const d = await r.json();
    if (d.ok && d.data.length) {
      PRODUCTS = d.data.map(p=>({
        id:p.id_producto, name:p.nombre, cat:p.tipo||'General',
        img:p.img_url||'', desc:p.descripcion||'',
        precio:parseFloat(p.precio), stock:p.stock,
        certificacion:p.certificacion||'', simulable:!!p.simulable,
        specs:buildSpecs(p), caracteristicas:p.caracteristicas||[],
      }));
    }
  } catch(err){console.warn('[APP] No se cargaron productos de BD:',err);}
}

function buildSpecs(p) {
  const s={};
  if(p.tipo)s['Tipo']=p.tipo;
  if(p.certificacion)s['Certificación']=p.certificacion;
  if(p.stock!=null)s['Stock']=p.stock+' uds';
  (p.caracteristicas||[]).forEach(c=>{if(c.nombre)s[c.nombre]=c.valor;});
  if(p.ficha_tecnica&&typeof p.ficha_tecnica==='object')Object.entries(p.ficha_tecnica).forEach(([k,v])=>{s[k]=v;});
  return s;
}

/* ══════════ TARJETAS ══════════ */
function productCardHTML(p) {
  return `<article class="product-card">
    <div class="product-card__img" onclick="showDetailById(${p.id})" style="cursor:pointer;">
      <img src="${p.img}" alt="${p.name}" loading="lazy" onerror="this.parentNode.innerHTML='<i class=\\'fa-solid fa-camera product-card__img-placeholder\\'></i>'"/>
    </div>
    <div class="product-card__badge-row"><span class="badge badge--new">Nuevo</span></div>
    <div class="product-card__body">
      <p class="product-card__cat">${p.cat}</p>
      <h3 class="product-card__name">${p.name}</h3>
      <p class="product-card__desc">${p.desc}</p>
    </div>
    <div class="product-card__footer" style="display:flex;gap:.5rem;justify-content:flex-end;">
      <button class="btn btn--secondary btn--sm" onclick="showDetailById(${p.id})"><i class="fa-solid fa-arrow-right"></i> Ver más</button>
      <button class="btn btn--primary btn--sm" onclick="Cart.add(${p.id})" style="background:var(--clr-accent);border-color:var(--clr-accent);"><i class="fa-solid fa-cart-plus"></i></button>
    </div>
  </article>`;
}

function renderProducts(containerID,items){
  const el=document.getElementById(containerID);
  if(!el)return;
  el.innerHTML=items.length?items.map(productCardHTML).join(''):'<p style="color:var(--clr-muted);font-size:.9rem;">No hay productos.</p>';
}

/* ══════════ NAVEGACIÓN CON HASH ══════════ */
function showView(viewID) {
  pushView(viewID);
  _activateView(viewID);
}

function _activateView(viewID) {
  _currentView = viewID;
  $$('.view').forEach(v=>v.classList.remove('active'));
  const el = document.getElementById('view-'+viewID);
  if(el){el.classList.add('active');window.scrollTo({top:0,behavior:'smooth'});}
  switch(viewID){
    case 'home':           renderProducts('home-products',PRODUCTS.slice(0,8)); break;
    case 'catalogo':       renderProducts('catalog-products',PRODUCTS); break;
    case 'simulador':      if(typeof Sim!=='undefined'&&Sim.init)setTimeout(()=>Sim.init(),50); break;
    case 'mis-cotizaciones': loadMisCotizaciones(); break;
  }
}

function showCatalog(category){
  pushView('catalogo');
  const bcEl=document.getElementById('bc-category');const titleEl=document.getElementById('catalog-title');
  if(bcEl)bcEl.textContent=category;if(titleEl)titleEl.textContent=category;
  _activateView('catalogo');
  const filtered=category?PRODUCTS.filter(p=>p.cat===category):PRODUCTS;
  setTimeout(()=>renderProducts('catalog-products',filtered.length?filtered:PRODUCTS),50);
}

function showDetailById(productId){
  const p=PRODUCTS.find(x=>x.id==productId);if(!p)return;
  pushView('detalle');
  const bcProduct=document.getElementById('bc-product');if(bcProduct)bcProduct.textContent=p.name;
  const gallery=document.querySelector('.product-detail__gallery');
  if(gallery)gallery.innerHTML=`<img src="${p.img}" alt="${p.name}" onerror="this.parentNode.innerHTML='<i class=\\'fa-solid fa-camera\\' style=\\'font-size:4rem;color:#c0c0b8;\\'></i>'"/>`;
  const setCont=(id,val)=>{const el=document.getElementById(id);if(el)el.textContent=val;};
  setCont('detail-cat',p.cat);setCont('detail-name',p.name);setCont('detail-desc',p.desc);
  const tbody=document.querySelector('#view-detalle .product-detail__specs tbody');
  if(tbody)tbody.innerHTML=Object.entries(p.specs).map(([k,v])=>`<tr><td>${k}</td><td>${v}</td></tr>`).join('');
  const cartBtn=document.getElementById('detailCartBtn');
  if(cartBtn){cartBtn.style.display=Session.user?.rol==='cliente'?'inline-flex':'none';cartBtn.onclick=()=>Cart.add(p.id);}
  // Configurar desplegable cotizar en detalle
  _setupDetailCotDrop(p);
  const related=PRODUCTS.filter(x=>x.id!==productId&&x.cat===p.cat).slice(0,4);
  renderProducts('related-products',related.length?related:PRODUCTS.filter(x=>x.id!==productId).slice(0,4));
  _activateView('detalle');
}

function _setupDetailCotDrop(p) {
  const wrap = document.getElementById('detailCotDropWrap');
  if (!wrap) return;
  const waUrl = `https://wa.me/529381329935?text=${encodeURIComponent('Hola! Me interesa el producto: '+p.name)}`;
  wrap.innerHTML = `
    <div style="position:relative;display:inline-block;" id="detailCotDropInner">
      <button onclick="toggleCotDrop('detailCotDrop')"
        class="btn btn--lg"
        style="background:#0f766e;color:#fff;border:2px solid #0f766e;gap:.5rem;">
        <i class="fa-solid fa-file-invoice-dollar"></i> Cotizar
        <i class="fa-solid fa-chevron-down" style="font-size:.7rem;"></i>
      </button>
      <div id="detailCotDrop" style="display:none;position:absolute;top:110%;left:0;min-width:220px;background:#fff;border:1px solid var(--clr-border);border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,.15);overflow:hidden;z-index:50;">
        <a href="${waUrl}" target="_blank" rel="noopener noreferrer"
          style="display:flex;align-items:center;gap:.65rem;padding:.75rem 1rem;font-size:.85rem;color:var(--clr-text);text-decoration:none;border-bottom:1px solid var(--clr-border);">
          <i class="fa-brands fa-whatsapp" style="color:#22c55e;font-size:1.1rem;"></i> Por WhatsApp
        </a>
        <button onclick="showToast('El chat estará disponible próximamente.','info');document.getElementById('detailCotDrop').style.display='none';"
          style="display:flex;align-items:center;gap:.65rem;padding:.75rem 1rem;font-size:.85rem;color:var(--clr-text);background:none;border:none;border-bottom:1px solid var(--clr-border);cursor:pointer;width:100%;font-family:var(--font-base);">
          <i class="fa-solid fa-comments" style="color:var(--clr-primary);font-size:1.1rem;"></i> Por chat
        </button>
        <button onclick="cotizarAhora([{producto_id:${p.id},cantidad:1}]);document.getElementById('detailCotDrop').style.display='none';"
          style="display:flex;align-items:center;gap:.65rem;padding:.75rem 1rem;font-size:.85rem;color:var(--clr-text);background:none;border:none;cursor:pointer;width:100%;font-family:var(--font-base);">
          <i class="fa-solid fa-file-arrow-down" style="color:#0f766e;font-size:1.1rem;"></i> Cotizar ahora (PDF)
        </button>
      </div>
    </div>`;
}

function showDetail(id){showDetailById(id);}

/* ══════════ COTIZAR AHORA ══════════ */
async function cotizarAhora(items) {
  if(!Session.user){showToast('Inicia sesión para cotizar','info');showView('login');return;}
  if(Session.user.rol!=='cliente'){showToast('Solo clientes pueden cotizar','info');return;}
  if(!items){
    if(!Cart.items.length){showToast('Tu carrito está vacío','info');return;}
    items=Cart.items.map(i=>({producto_id:i.producto_id,cantidad:i.cantidad}));
  }
  try{
    showToast('Generando cotización…','info');
    const r=await fetch('db.php?action=cotizar',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items,notas:'Cotización desde sitio web'})});
    const d=await r.json();
    if(!d.ok){showToast(d.error||'Error al cotizar','error');return;}
    showToast('¡Cotización registrada! Generando PDF…','success');
    descargarCotizacionPDF(d.data);
  }catch{showToast('Error de conexión','error');}
}

function descargarCotizacionPDF(cot){
  const detalle=(cot.detalle||[]).map(d=>`<tr><td style="padding:.5rem .75rem;border:1px solid #dde1e7;">${d.producto_nombre}</td><td style="padding:.5rem .75rem;border:1px solid #dde1e7;text-align:center;">${d.cantidad}</td><td style="padding:.5rem .75rem;border:1px solid #dde1e7;text-align:right;">$${parseFloat(d.precio_unitario).toLocaleString('es-MX',{minimumFractionDigits:2})}</td><td style="padding:.5rem .75rem;border:1px solid #dde1e7;text-align:right;font-weight:700;">$${(d.cantidad*d.precio_unitario).toLocaleString('es-MX',{minimumFractionDigits:2})}</td></tr>`).join('');
  const html=`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/><title>Cotización #${cot.id_cotizacion}</title>
  <style>body{font-family:'Segoe UI',sans-serif;color:#1f2937;padding:2rem;max-width:800px;margin:auto;}.header{background:#1a3a5c;color:#fff;padding:1.25rem 1.5rem;border-radius:8px 8px 0 0;display:flex;justify-content:space-between;align-items:flex-start;}h1{margin:0;font-size:1.4rem;}.sub{font-size:.8rem;opacity:.75;margin-top:.2rem;}.info{display:grid;grid-template-columns:1fr 1fr;gap:.5rem 1.5rem;padding:1rem 0;font-size:.88rem;border-bottom:1px solid #dde1e7;margin-bottom:1rem;}.lbl{color:#6b7280;}table{width:100%;border-collapse:collapse;font-size:.85rem;}th{background:#f0f4f8;padding:.5rem .75rem;border:1px solid #dde1e7;text-align:left;font-size:.75rem;text-transform:uppercase;}tfoot td{font-weight:700;background:#f9fafb;padding:.6rem .75rem;border:1px solid #dde1e7;}.footer{margin-top:1.5rem;font-size:.75rem;color:#6b7280;border-top:1px solid #dde1e7;padding-top:.75rem;}</style></head><body>
  <div class="header"><div><h1>SERTECSUR</h1><p class="sub">Servicios Tecnológicos del Sureste</p></div><div style="text-align:right;"><p style="font-size:1.1rem;font-weight:700;margin:0;">COTIZACIÓN #${cot.id_cotizacion}</p><p class="sub">Fecha: ${new Date(cot.fecha||Date.now()).toLocaleDateString('es-MX',{day:'2-digit',month:'long',year:'numeric'})}</p></div></div>
  <div style="border:1px solid #dde1e7;border-top:none;border-radius:0 0 8px 8px;padding:1.25rem;">
  <div class="info"><span class="lbl">Cliente:</span><strong>${cot.cliente_nombre||''}</strong><span class="lbl">Correo:</span><span>${cot.cliente_correo||''}</span><span class="lbl">Teléfono:</span><span>${cot.cliente_telefono||'—'}</span><span class="lbl">Estado:</span><span>Pendiente de revisión</span><span class="lbl">Vigencia:</span><span>30 días</span></div>
  <table><thead><tr><th>Producto</th><th style="text-align:center;">Cant.</th><th style="text-align:right;">Precio u.</th><th style="text-align:right;">Subtotal</th></tr></thead><tbody>${detalle}</tbody><tfoot><tr><td colspan="3" style="text-align:right;">Subtotal</td><td style="text-align:right;">$${parseFloat(cot.subtotal||0).toLocaleString('es-MX',{minimumFractionDigits:2})}</td></tr><tr><td colspan="3" style="text-align:right;font-size:1rem;">TOTAL</td><td style="text-align:right;font-size:1rem;">$${parseFloat(cot.total||0).toLocaleString('es-MX',{minimumFractionDigits:2})}</td></tr></tfoot></table>
  <div class="footer">Tel: 938 153 2506 · ventas@sertecsur.net · Calle 55 #50, Col. Electricistas, Cd. del Carmen, Campeche</div></div>
  <script>window.onload=()=>window.print();<\/script></body></html>`;
  const blob=new Blob([html],{type:'text/html'});const url=URL.createObjectURL(blob);
  const win=window.open(url,'_blank');
  if(!win){const a=document.createElement('a');a.href=url;a.download=`cotizacion_${cot.id_cotizacion}.html`;a.click();}
  setTimeout(()=>URL.revokeObjectURL(url),60000);
}

/* ══════════ MIS COTIZACIONES ══════════ */
async function loadMisCotizaciones(){
  if(!Session.user||Session.user.rol!=='cliente'){showView('login');return;}
  const container=document.getElementById('view-mis-cotizaciones');if(!container)return;
  try{
    const r=await fetch('db.php?action=mis-cotizaciones');const d=await r.json();
    if(!d.ok){document.getElementById('misCotBody').innerHTML='<p style="color:var(--clr-muted);text-align:center;padding:2rem;">Error al cargar.</p>';return;}
    renderMisCotizaciones(d.data,container);
  }catch{document.getElementById('misCotBody').innerHTML='<p style="color:var(--clr-muted);text-align:center;padding:2rem;">Error de conexión.</p>';}
}

function renderMisCotizaciones(cots,container){
  const body=document.getElementById('misCotBody');if(!body)return;
  if(!cots.length){
    body.innerHTML=`<div style="text-align:center;padding:2.5rem;color:var(--clr-muted);"><i class="fa-solid fa-file-invoice" style="font-size:3rem;opacity:.2;display:block;margin-bottom:.75rem;"></i><p>No tienes cotizaciones aún.</p><button class="btn btn--primary btn--md" style="margin-top:1rem;" onclick="showView('catalogo')"><i class="fa-solid fa-box-open"></i> Ver catálogo</button></div>`;
    return;
  }
  const pending=cots.filter(c=>c.estado==='pendiente');
  const approved=cots.filter(c=>c.estado==='aprobada');
  const others=cots.filter(c=>c.estado!=='pendiente'&&c.estado!=='aprobada');

  function cotCard(c){
    const total=parseFloat(c.total||0).toLocaleString('es-MX',{minimumFractionDigits:2});
    const fecha=new Date(c.fecha).toLocaleDateString('es-MX',{day:'2-digit',month:'short',year:'numeric'});
    const bMap={pendiente:'background:#fef3c7;color:#92400e;',aprobada:'background:#dcfce7;color:#15803d;',rechazada:'background:#fee2e2;color:#b91c1c;'};

    const productos=(c.detalle||[]).map(d=>`
      <li style="display:flex;align-items:center;gap:.65rem;font-size:.82rem;padding:.4rem 0;border-bottom:1px solid #f0f0f0;">
        <img src="${d.img_url||''}" style="width:40px;height:40px;object-fit:cover;border-radius:6px;border:1px solid var(--clr-border);flex-shrink:0;cursor:pointer;" onclick="showDetailById(${d.producto_id})" onerror="this.style.display='none'"/>
        <span style="flex:1;cursor:pointer;" onclick="showDetailById(${d.producto_id})">${d.producto_nombre}</span>
        <span style="color:var(--clr-muted);white-space:nowrap;">x${d.cantidad}</span>
      </li>`).join('');

    const resenaBtns=c.estado==='aprobada'?(c.detalle||[]).map(d=>`
      <button onclick="abrirModalResena(${d.producto_id},'${(d.producto_nombre||'').replace(/'/g,"\\'")}',${c.id_cotizacion})"
        style="display:inline-flex;align-items:center;gap:.35rem;margin:.2rem .2rem 0 0;padding:.3rem .65rem;border-radius:6px;font-size:.75rem;background:#ede9fe;color:#6d28d9;border:none;cursor:pointer;font-family:var(--font-base);">
        <i class="fa-solid fa-star"></i> Reseñar: ${d.producto_nombre}
      </button>`).join(''):'';

    return `<div style="background:#fff;border:1px solid var(--clr-border);border-radius:10px;overflow:hidden;margin-bottom:1rem;box-shadow:0 2px 8px rgba(0,0,0,.07);">
      <div style="padding:.85rem 1.1rem;background:var(--clr-bg);border-bottom:1px solid var(--clr-border);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.5rem;">
        <div style="display:flex;align-items:center;gap:.6rem;">
          <span style="font-size:.78rem;color:var(--clr-muted);">#${c.id_cotizacion}</span>
          <span style="font-weight:700;font-size:.9rem;color:var(--clr-primary);">${fecha}</span>
          <span style="padding:.15rem .5rem;border-radius:20px;font-size:.7rem;font-weight:700;${bMap[c.estado]||'background:#f3f4f6;color:#4b5563;'}">${c.estado}</span>
        </div>
        <button onclick="descargarCotizacionPDF(${JSON.stringify(c).replace(/"/g,'&quot;').replace(/</g,'&lt;')})"
          style="display:inline-flex;align-items:center;gap:.3rem;padding:.3rem .65rem;border-radius:6px;font-size:.75rem;background:var(--clr-primary);color:#fff;border:none;cursor:pointer;font-family:var(--font-base);">
          <i class="fa-solid fa-download"></i> Descargar
        </button>
      </div>
      <div style="padding:.85rem 1.1rem;">
        <ul style="list-style:none;margin-bottom:.6rem;">${productos}</ul>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:.5rem;">
          <span style="font-size:.82rem;color:var(--clr-muted);">Total:</span>
          <strong style="font-size:1rem;color:var(--clr-accent);">$${total}</strong>
        </div>
        ${resenaBtns?`<div style="margin-top:.75rem;padding-top:.75rem;border-top:1px solid var(--clr-border);"><p style="font-size:.76rem;color:#6d28d9;font-weight:700;margin-bottom:.3rem;"><i class="fa-solid fa-star"></i> Cotización aprobada — puedes reseñar:</p>${resenaBtns}</div>`:''}
      </div>
    </div>`;
  }

  let html='';
  if(pending.length)  html+=`<h3 style="font-size:.88rem;font-weight:700;color:var(--clr-primary);margin-bottom:.6rem;display:flex;align-items:center;gap:.4rem;"><i class="fa-solid fa-clock" style="color:#f59e0b;"></i> Pendientes (${pending.length})</h3>${pending.map(cotCard).join('')}`;
  if(approved.length) html+=`<h3 style="font-size:.88rem;font-weight:700;color:var(--clr-primary);margin:.75rem 0 .6rem;display:flex;align-items:center;gap:.4rem;"><i class="fa-solid fa-circle-check" style="color:#22c55e;"></i> Aprobadas (${approved.length})</h3>${approved.map(cotCard).join('')}`;
  if(others.length)   html+=`<h3 style="font-size:.88rem;font-weight:700;color:var(--clr-primary);margin:.75rem 0 .6rem;display:flex;align-items:center;gap:.4rem;"><i class="fa-solid fa-history" style="color:var(--clr-muted);"></i> Historial</h3>${others.map(cotCard).join('')}`;
  body.innerHTML=html;
}

/* ══════════ RESEÑAS ══════════ */
function abrirModalResena(productoId,productoNombre,cotizacionId){
  document.getElementById('userMenu')?.remove();
  document.getElementById('modalResena')?.remove();
  const modal=document.createElement('div');
  modal.id='modalResena';
  modal.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:800;display:flex;align-items:center;justify-content:center;padding:1rem;';
  modal.innerHTML=`<div style="background:#fff;border-radius:12px;width:100%;max-width:440px;box-shadow:0 8px 40px rgba(0,0,0,.2);overflow:hidden;animation:fadeIn .2s ease;"><style>@keyframes fadeIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:none}}</style>
    <div style="background:var(--clr-primary);padding:1rem 1.25rem;display:flex;align-items:center;justify-content:space-between;">
      <div><p style="color:#fff;font-weight:700;font-size:.9rem;"><i class="fa-solid fa-star" style="color:#fbbf24;"></i> Reseñar producto</p><p style="color:rgba(255,255,255,.65);font-size:.75rem;">${productoNombre}</p></div>
      <button onclick="document.getElementById('modalResena').remove()" style="color:rgba(255,255,255,.75);font-size:1.1rem;background:none;border:none;cursor:pointer;"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div id="resenaAlertWrap" style="padding:0 1.25rem;"></div>
    <div style="padding:1rem 1.25rem 1.25rem;">
      <p style="font-size:.82rem;font-weight:700;color:var(--clr-primary);margin-bottom:.5rem;">Calificación *</p>
      <div id="starRating" style="display:flex;gap:.3rem;margin-bottom:.85rem;">${[1,2,3,4,5].map(n=>`<button data-val="${n}" onclick="setStarRating(${n})" style="font-size:1.5rem;color:#d1d5db;background:none;border:none;cursor:pointer;" class="star-btn">★</button>`).join('')}</div>
      <input type="hidden" id="resenaCalif" value="0"/>
      <p style="font-size:.82rem;font-weight:700;color:var(--clr-primary);margin-bottom:.35rem;">Comentario</p>
      <textarea id="resenaComentario" style="width:100%;border:1px solid var(--clr-border);border-radius:8px;padding:.55rem .75rem;font-family:var(--font-base);font-size:.87rem;resize:vertical;min-height:80px;outline:none;" placeholder="Comparte tu experiencia…"></textarea>
      <div style="display:flex;justify-content:flex-end;gap:.5rem;margin-top:.85rem;">
        <button onclick="document.getElementById('modalResena').remove()" style="padding:.45rem 1rem;border-radius:7px;border:1px solid var(--clr-border);background:transparent;font-size:.82rem;cursor:pointer;font-family:var(--font-base);">Cancelar</button>
        <button onclick="enviarResena(${productoId},${cotizacionId})" style="padding:.45rem 1rem;border-radius:7px;background:var(--clr-primary);color:#fff;border:none;font-size:.82rem;cursor:pointer;font-family:var(--font-base);"><i class="fa-solid fa-paper-plane"></i> Enviar</button>
      </div>
    </div></div>`;
  document.body.appendChild(modal);
  modal.addEventListener('click',e=>{if(e.target===modal)modal.remove();});
}

function setStarRating(val){
  document.getElementById('resenaCalif').value=val;
  document.querySelectorAll('.star-btn').forEach((btn,i)=>{btn.style.color=i<val?'#f59e0b':'#d1d5db';});
}

async function enviarResena(productoId,cotizacionId){
  const calif=parseFloat(document.getElementById('resenaCalif').value);
  const comentario=document.getElementById('resenaComentario').value.trim();
  const alertWrap=document.getElementById('resenaAlertWrap');
  if(!calif||calif<1){alertWrap.innerHTML='<div style="background:#fee2e2;color:#b91c1c;border:1px solid #fecaca;padding:.5rem .85rem;border-radius:7px;font-size:.82rem;margin-top:.5rem;"><i class="fa-solid fa-circle-xmark"></i> Selecciona una calificación.</div>';return;}
  try{
    const r=await fetch('db.php?action=resenas',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({producto_id:productoId,calificacion:calif,comentario})});
    const d=await r.json();
    if(d.ok){document.getElementById('modalResena')?.remove();showToast('¡Reseña enviada! Gracias.','success');}
    else alertWrap.innerHTML=`<div style="background:#fee2e2;color:#b91c1c;border:1px solid #fecaca;padding:.5rem .85rem;border-radius:7px;font-size:.82rem;margin-top:.5rem;"><i class="fa-solid fa-circle-xmark"></i> ${d.error}</div>`;
  }catch{alertWrap.innerHTML='<div style="background:#fee2e2;color:#b91c1c;padding:.5rem .85rem;border-radius:7px;font-size:.82rem;margin-top:.5rem;">Error de conexión.</div>';}
}

/* ══════════ CONTACTO ══════════ */
async function enviarContacto(e){
  e.preventDefault();
  const nombre=document.getElementById('c-name').value.trim();
  const correo=document.getElementById('c-email').value.trim();
  const telefono=document.getElementById('c-phone').value.trim();
  const asunto=document.getElementById('c-subject').value;
  const mensaje=document.getElementById('c-message').value.trim();
  const btn=document.getElementById('contactSendBtn');
  const alertEl=document.getElementById('contactAlert');
  if(!nombre||!correo||!mensaje){showToast('Por favor llena los campos requeridos','error');return;}
  btn.disabled=true;btn.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Enviando…';
  try{
    const r=await fetch('db.php?action=buzon',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({nombre,correo,telefono,asunto,mensaje})});
    const d=await r.json();
    if(d.ok){
      showToast('¡Mensaje enviado! Te contactaremos pronto.','success');
      document.getElementById('c-name').value='';document.getElementById('c-email').value='';
      document.getElementById('c-phone').value='';document.getElementById('c-subject').value='';
      document.getElementById('c-message').value='';
    }else showToast(d.error||'Error al enviar','error');
  }catch{showToast('Error de conexión','error');}
  finally{btn.disabled=false;btn.innerHTML='<i class="fa-solid fa-paper-plane"></i> Enviar mensaje';}
}

/* ══════════ SIDEBAR MÓVIL ══════════ */
function toggleSidebar(){
  const sidebar=document.getElementById('sidebar');const overlay=document.getElementById('sidebarOverlay');
  const isOpen=sidebar.classList.toggle('open');
  overlay.classList.toggle('open',isOpen);
  sidebar.setAttribute('aria-hidden',String(!isOpen));
  document.body.style.overflow=isOpen?'hidden':'';
}
function toggleSub(btn){
  const sub=btn.nextElementSibling;const isOpen=sub.classList.toggle('open');
  const arrow=btn.querySelector('.toggle-arrow');btn.classList.toggle('open',isOpen);
  if(arrow)arrow.style.transform=isOpen?'rotate(180deg)':'';
}

document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
    const sidebar=document.getElementById('sidebar');
    if(sidebar&&sidebar.classList.contains('open'))toggleSidebar();
    Cart.close();
    document.getElementById('userMenu')?.remove();
    document.getElementById('modalResena')?.remove();
    $$('[id$="CotDrop"]').forEach(d=>d.style.display='none');
  }
});

/* ══════════ INIT ══════════ */
async function initSession(){
  await loadProductsFromDB();
  await Session.check();
  if(Session.user?.rol==='cliente') await Cart.load();
  // Inicializar hash routing
  const initView = getHashView();
  history.replaceState({view: initView}, '', window.location.hash || '#home');
}
