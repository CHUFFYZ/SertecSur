'use strict';

/* ================================================
   SIMULADOR DE SEGURIDAD — simulador.js (POO)
   Arquitectura de clases ES6:

   ┌─────────────────────────────────────────────┐
   │  Producto          – modelo de datos          │
   │  ItemPlano         – modelo de instancia      │
   │  CatalogoDB        – repositorio de productos │
   │  CanvasRenderer    – render de ítems en DOM   │
   │  DragController    – drag & drop              │
   │  EnvironmentMode   – noche / lluvia / intruso │
   │  CoveragePanel     – barras de cobertura      │
   │  Simulador         – controlador principal    │
   └─────────────────────────────────────────────┘

   Uso global: window.Sim = new Simulador();
   El HTML llama: Sim.selectProduct('sc1'), etc.
================================================ */


/* ══════════════════════════════════════════════
   CLASE: Producto
   Modelo de datos de un producto del catálogo.
   Encapsula todas las propiedades y expone
   métodos de consulta (getters).
══════════════════════════════════════════════ */
class Producto {
  constructor({ id, name, cat, img, icon, color,
                canSimulate, nightVision, hasFov,
                fov, specs, tags }) {
    this._id          = id;
    this._name        = name;
    this._cat         = cat;
    this._img         = img;
    this._icon        = icon;
    this._color       = color;
    this._canSimulate = canSimulate;
    this._nightVision = nightVision;
    this._hasFov      = hasFov;
    this._fov         = fov;
    this._specs       = specs;
    this._tags        = tags;
  }

  get id()          { return this._id; }
  get name()        { return this._name; }
  get cat()         { return this._cat; }
  get img()         { return this._img; }
  get icon()        { return this._icon; }
  get color()       { return this._color; }
  get canSimulate() { return this._canSimulate; }
  get nightVision() { return this._nightVision; }
  get hasFov()      { return this._hasFov; }
  get fov()         { return this._fov; }
  get specs()       { return this._specs; }
  get tags()        { return this._tags; }

  /** Indica si es de tipo alarma (sirena, detector, pánico) */
  esAlarma() {
    return this._cat.includes('Sirena')
        || this._cat.includes('Detector')
        || this._cat.includes('Pánico');
  }

  /** Genera el HTML del tag de la etiqueta visual */
  tagHTML(t) {
    const cls = t === 'Nocturna' ? 'night'
              : t === 'Wi-Fi'    ? 'wifi'
              : t.includes('p')  ? 'hd'
              : 'ip';
    return `<span class="sim-tag sim-tag--${cls}">${t}</span>`;
  }
}


/* ══════════════════════════════════════════════
   CLASE: ItemPlano
   Representa un producto colocado en el plano.
   Contiene su posición, rotación, escala y
   estado (activo / alerta / showFov).
══════════════════════════════════════════════ */
class ItemPlano {
  constructor(id, producto) {
    this.id        = id;
    this.producto  = producto;          // instancia de Producto
    this.x         = 35 + Math.random() * 30;
    this.y         = 35 + Math.random() * 30;
    this.rotation  = 0;
    this.scale     = 100;
    this.fov       = producto.fov;
    this.reach     = 70;
    this.offset    = -26;
    this.showFov   = producto.hasFov;
    this.active    = true;
    this.alert     = false;
  }

  /** Cambia la rotación con normalización 0–360 */
  rotarPor(delta) {
    this.rotation = ((this.rotation + delta) % 360 + 360) % 360;
  }

  /** Devuelve la clase CSS del badge según estado */
  get badgeClass() {
    if (this.alert)        return 'sim-item__badge--alert';
    if (this.active)       return 'sim-item__badge--active';
    return 'sim-item__badge--inactive';
  }
}


/* ══════════════════════════════════════════════
   CLASE: CatalogoDB
   Repositorio de productos simulables.
   Encapsula el catálogo y expone métodos
   de búsqueda y agrupación.
══════════════════════════════════════════════ */
class CatalogoDB {
  constructor() {
    this._productos = this._cargarCatalogo();
  }

  _cargarCatalogo() {
    const datos = [
      /* CÁMARAS BULLET */
      { id:'sc1', name:'Cámara Bullet 800 TVL', cat:'Cámaras Bullet',
        img:'https://sertecsur.net/tienda/img/p/8/3/83-home_default.jpg',
        icon:'fa-solid fa-camera', color:'#1a3a5c',
        canSimulate:true, nightVision:false, hasFov:true,
        fov:90, specs:'Lente 6mm · 40m IR · IP66', tags:['HD','IP66'] },

      { id:'sc2', name:'Cámara Bullet 720 TVL DAHUA', cat:'Cámaras Bullet',
        img:'https://sertecsur.net/tienda/img/p/5/8/58-home_default.jpg',
        icon:'fa-solid fa-camera', color:'#1a3a5c',
        canSimulate:true, nightVision:true, hasFov:true,
        fov:80, specs:'Lente 3.6mm · Smart IR 15m · IP66', tags:['Nocturna','IP66'] },

      { id:'sc3', name:'Cámara Bala EXIR 1080P TurboHD', cat:'Cámaras Bullet',
        img:'https://sertecsur.net/tienda/img/p/6/9/69-home_default.jpg',
        icon:'fa-solid fa-camera', color:'#1a3a5c',
        canSimulate:true, nightVision:true, hasFov:true,
        fov:95, specs:'Varifocal 2.8–12mm · 50m IR · WDR Real', tags:['1080p','Nocturna','IP66'] },

      { id:'sc4', name:'Cámara TurboHD 720p EPCOM', cat:'Cámaras Bullet',
        img:'https://sertecsur.net/tienda/img/p/6/4/64-home_default.jpg',
        icon:'fa-solid fa-camera', color:'#1a3a5c',
        canSimulate:true, nightVision:true, hasFov:true,
        fov:85, specs:'Lente 3.6mm fijo · 40m IR', tags:['720p','Nocturna'] },

      /* CÁMARAS DOMO */
      { id:'sd1', name:'Cámara Domo Antivandalismo', cat:'Cámaras Domo',
        img:'https://sertecsur.net/tienda/img/p/1/1/1/111-home_default.jpg',
        icon:'fa-solid fa-circle', color:'#1a3a5c',
        canSimulate:true, nightVision:true, hasFov:true,
        fov:110, specs:'36 LEDs IR · 30m · IP66 · Varifocal', tags:['Nocturna','IP66','Domo'] },

      /* CÁMARAS IP */
      { id:'si1', name:'Cámara IP Interior 1 MP', cat:'Cámaras IP',
        img:'https://sertecsur.net/tienda/img/p/1/2/2/122-home_default.jpg',
        icon:'fa-solid fa-video', color:'#185fa5',
        canSimulate:true, nightVision:false, hasFov:true,
        fov:100, specs:'H.264 · Audio bidireccional · MicroSD', tags:['Wi-Fi','HD'] },

      /* VIDEOPORTERO */
      { id:'sv1', name:'Kit Videoportero Híbrido', cat:'Videoportero',
        img:'https://sertecsur.net/tienda/img/p/5/9/9/599-home_default.jpg',
        icon:'fa-solid fa-door-open', color:'#0f6e56',
        canSimulate:true, nightVision:false, hasFov:false,
        fov:0, specs:'7" Touch · Wi-Fi · 117° visión', tags:['Wi-Fi','720p'] },

      /* SIRENAS */
      { id:'ss1', name:'Sirena Inalámbrica Exterior', cat:'Sirenas y Estrobos',
        img:'https://sertecsur.net/tienda/img/p/5/9/3/593-home_default.jpg',
        icon:'fa-solid fa-bell', color:'#e63337',
        canSimulate:true, nightVision:false, hasFov:false,
        fov:100, specs:'Estrobo · 433 MHz · Exterior', tags:['Alarma'] },

      /* CERCAS ELÉCTRICAS */
      { id:'se1', name:'Energizador 1J — 10,000V', cat:'Cercas Eléctricas',
        img:'https://sertecsur.net/tienda/img/p/5/9/8/598-home_default.jpg',
        icon:'fa-solid fa-bolt', color:'#ba7517',
        canSimulate:true, nightVision:false, hasFov:false,
        fov:0, specs:'10,000V · 1J · Residencial', tags:['Perímetro'] },

      { id:'se2', name:'Energizador 0.9J — 12,000V', cat:'Cercas Eléctricas',
        img:'https://sertecsur.net/tienda/img/p/5/9/7/597-home_default.jpg',
        icon:'fa-solid fa-bolt', color:'#ba7517',
        canSimulate:true, nightVision:false, hasFov:false,
        fov:0, specs:'12,000V · 0.9J · 250m', tags:['Perímetro'] },

      /* DVR / NVR — no simulables */
      { id:'dvr1', name:'DVR 16 Canales', cat:'DVR / NVR',
        img:'https://sertecsur.net/tienda/img/p/1/5/2/152-home_default.jpg',
        icon:'fa-solid fa-server', color:'#444441',
        canSimulate:false, nightVision:false, hasFov:false,
        fov:0, specs:'16 canales · 4 audio · HD', tags:[] },

      { id:'dvr2', name:'DVR 16 CH TurboHD', cat:'DVR / NVR',
        img:'https://sertecsur.net/tienda/img/p/1/5/7/157-home_default.jpg',
        icon:'fa-solid fa-server', color:'#444441',
        canSimulate:false, nightVision:false, hasFov:false,
        fov:0, specs:'16ch · P2P EZVIZ · 2 HDD', tags:[] },

      /* DETECTORES / SENSORES */
      { id:'det1', name:'Detector de Movimiento PIR', cat:'Detectores / Sensores',
        img:'', icon:'fa-solid fa-wave-square', color:'#3b6d11',
        canSimulate:true, nightVision:false, hasFov:true,
        fov:120, specs:'Alcance 12m · 120° · Interior', tags:['Alarma'] },

      { id:'det2', name:'Contacto Magnético', cat:'Contactos Magnéticos',
        img:'', icon:'fa-solid fa-magnet', color:'#3b6d11',
        canSimulate:true, nightVision:false, hasFov:false,
        fov:0, specs:'Puertas y ventanas · Inalámbrico', tags:['Alarma'] },

      { id:'det3', name:'Botón de Pánico', cat:'Botones de Pánico',
        img:'', icon:'fa-solid fa-hand-point-up', color:'#e63337',
        canSimulate:true, nightVision:false, hasFov:false,
        fov:0, specs:'Inalámbrico · 433 MHz', tags:['Alarma'] },
    ];

    return datos.map(d => new Producto(d));
  }

  /** Devuelve todos los productos */
  todos() { return this._productos; }

  /** Busca un producto por id */
  buscarPorId(id) {
    return this._productos.find(p => p.id === id) || null;
  }

  /** Filtra por texto (nombre o categoría) */
  filtrar(query) {
    const q = (query || '').toLowerCase().trim();
    if (!q) return this._productos;
    return this._productos.filter(p =>
      p.name.toLowerCase().includes(q) || p.cat.toLowerCase().includes(q)
    );
  }

  /** Agrupa un array de productos por categoría */
  agruparPorCategoria(lista) {
    return lista.reduce((grupos, p) => {
      if (!grupos[p.cat]) grupos[p.cat] = [];
      grupos[p.cat].push(p);
      return grupos;
    }, {});
  }
}


/* ══════════════════════════════════════════════
   CLASE: CanvasRenderer
   Responsable de construir y actualizar el SVG
   del cono de visión y el DOM de cada ítem.
   No conoce el estado global del simulador.
══════════════════════════════════════════════ */
class CanvasRenderer {

  /** Genera el SVG del cono de visión */
  buildCone(fovDeg, color, reach = 70, offset = 0) {
    const half    = (fovDeg / 2) * (Math.PI / 180);
    const svgSize = (reach + Math.abs(offset)) * 2 + 20;
    const cx      = svgSize / 2;
    const cy      = svgSize / 2;
    const tipY    = cy - offset;

    const x1 = cx - reach * Math.sin(half);
    const y1 = tipY - reach * Math.cos(half);
    const x2 = cx + reach * Math.sin(half);
    const y2 = tipY - reach * Math.cos(half);

    const style = [
      'position:absolute',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'pointer-events:none',
      'overflow:visible',
    ].join(';');

    const base = `<svg viewBox="0 0 ${svgSize} ${svgSize}" width="${svgSize}" height="${svgSize}" style="${style}">`;

    if (fovDeg >= 360) {
      return `${base}<circle cx="${cx}" cy="${tipY}" r="${reach}" fill="${color}" opacity="0.28"/></svg>`;
    }

    const largeArc = fovDeg > 180 ? 1 : 0;
    return `${base}<path d="M${cx} ${tipY} L${x1} ${y1} A${reach} ${reach} 0 ${largeArc} 1 ${x2} ${y2} Z"
              fill="${color}" opacity="1.28"/></svg>`;
  }

  /** Crea y devuelve el elemento DOM del ítem */
  crearElemento(item, onDragStart, onSelect, onTooltip) {
    const p  = item.producto;
    const el = document.createElement('div');

    el.className = `sim-item${p.nightVision ? ' night-capable' : ''}`;
    el.id        = item.id;
    el.style.left      = item.x + '%';
    el.style.top       = item.y + '%';
    el.style.transform = this._transform(item);

    const coneHTML = (item.showFov && p.hasFov)
      ? `<div class="sim-item__cone" id="${item.id}_cone">${this.buildCone(item.fov, p.color, item.reach, item.offset)}</div>`
      : '';

    const imgHTML = p.img
      ? `<img src="${p.img}" alt="${p.name}"
            onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
         <i class="${p.icon} sim-item__icon" style="display:none;color:${p.color}"></i>`
      : `<i class="${p.icon} sim-item__icon" style="color:${p.color}"></i>`;

    el.innerHTML = `
      ${coneHTML}
      <div class="sim-item__body">
        ${imgHTML}
        <span class="sim-item__badge ${item.badgeClass}" id="${item.id}_badge"></span>
      </div>`;

    el.addEventListener('mousedown',  e => onDragStart(e, item.id));
    el.addEventListener('touchstart', e => onDragStart(e, item.id), { passive: true });
    el.addEventListener('click',      e => { e.stopPropagation(); onSelect(item.id); });
    el.addEventListener('mouseenter', e => onTooltip('show', e, item));
    el.addEventListener('mouseleave', () => onTooltip('hide'));

    return el;
  }

  /** Refresca posición y rotación del elemento DOM */
  refrescarTransform(item) {
    const el = document.getElementById(item.id);
    if (el) el.style.transform = this._transform(item);
  }

  /** Refresca el SVG del cono */
  refrescarCono(item) {
    const el = document.getElementById(`${item.id}_cone`);
    if (el) el.innerHTML = this.buildCone(item.fov, item.producto.color, item.reach, item.offset);
  }

  /** Refresca el badge de estado */
  refrescarBadge(item) {
    const el = document.getElementById(`${item.id}_badge`);
    if (el) el.className = `sim-item__badge ${item.badgeClass}`;
  }

  /** Mueve el elemento a nuevas coordenadas porcentuales */
  moverElemento(item) {
    const el = document.getElementById(item.id);
    if (el) {
      el.style.left = item.x + '%';
      el.style.top  = item.y + '%';
    }
  }

  /** Elimina el elemento del DOM */
  eliminarElemento(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  _transform(item) {
    return `translate(-50%,-50%) rotate(${item.rotation}deg) scale(${item.scale / 100})`;
  }
}


/* ══════════════════════════════════════════════
   CLASE: DragController
   Maneja exclusivamente la lógica de
   arrastrar ítems sobre el canvas.
══════════════════════════════════════════════ */
class DragController {
  constructor() {
    this._target  = null;
    this._offX    = 0;
    this._offY    = 0;
  }

  get isDragging() { return this._target !== null; }
  get targetId()   { return this._target; }

  iniciar(e, itemId) {
    this._target = itemId;
    const src    = e.touches ? e.touches[0] : e;
    const el     = document.getElementById(itemId);
    if (!el) return;
    const rect   = el.getBoundingClientRect();
    this._offX   = src.clientX - (rect.left + rect.width  / 2);
    this._offY   = src.clientY - (rect.top  + rect.height / 2);
  }

  calcularPosicion(e, canvasRect) {
    if (!this._target) return null;
    const src  = e.touches ? e.touches[0] : e;
    const pctX = ((src.clientX - this._offX - canvasRect.left) / canvasRect.width)  * 100;
    const pctY = ((src.clientY - this._offY - canvasRect.top)  / canvasRect.height) * 100;
    return {
      x: Math.min(95, Math.max(5, pctX)),
      y: Math.min(95, Math.max(5, pctY)),
    };
  }

  finalizar() { this._target = null; }
}


/* ══════════════════════════════════════════════
   CLASE: EnvironmentMode
   Controla los modos ambientales:
   noche, lluvia e intruso.
   Cada modo es independiente y reversible.
══════════════════════════════════════════════ */
class EnvironmentMode {
  constructor() {
    this.nightMode    = false;
    this.rainMode     = false;
    this.intruderMode = false;
    this._rainAnim    = null;
  }

  toggleNight(onStatus) {
    this.nightMode = !this.nightMode;
    const canvas = document.getElementById('simCanvas');
    const btn    = document.getElementById('btnNight');
    if (canvas) canvas.classList.toggle('night', this.nightMode);
    if (btn)    btn.classList.toggle('active', this.nightMode);
    onStatus(this.nightMode
      ? 'Modo noche activo — las cámaras con IR mantienen su imagen'
      : 'Modo noche desactivado');
  }

  toggleRain(onStatus) {
    this.rainMode = !this.rainMode;
    const btn    = document.getElementById('btnRain');
    const canvas = document.getElementById('simCanvas');
    if (btn) btn.classList.toggle('active', this.rainMode);

    if (this.rainMode) {
      const rain = document.createElement('canvas');
      rain.id = 'simRain';
      rain.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:6;pointer-events:none;opacity:.55;';
      if (canvas) canvas.appendChild(rain);
      this._animarLluvia(rain);
    } else {
      const rain = document.getElementById('simRain');
      if (rain) rain.remove();
    }

    onStatus(this.rainMode ? 'Lluvia activa — prueba resistencia IP' : 'Lluvia desactivada');
  }

  _animarLluvia(canvasEl) {
    const ctx   = canvasEl.getContext('2d');
    const drops = Array.from({ length: 80 }, () => ({
      x:     Math.random() * 900,
      y:     Math.random() * 600,
      len:   8  + Math.random() * 12,
      speed: 4  + Math.random() * 4,
    }));

    const frame = () => {
      if (!document.getElementById('simRain')) return;
      canvasEl.width  = canvasEl.offsetWidth;
      canvasEl.height = canvasEl.offsetHeight;
      ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
      ctx.strokeStyle = 'rgba(150,180,220,.7)';/*aolor de rayo amplitud rgba(150,180,220,.7)*/
      ctx.lineWidth   = 1;
      drops.forEach(d => {
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - 1, d.y + d.len);
        ctx.stroke();
        d.y += d.speed;
        if (d.y > canvasEl.height) { d.y = -20; d.x = Math.random() * canvasEl.width; }
      });
      requestAnimationFrame(frame);
    };
    frame();
  }

  toggleIntruder(tieneAlarma, onStatus) {
    this.intruderMode = !this.intruderMode;
    const btn      = document.getElementById('btnIntruder');
    const intruder = document.getElementById('simIntruder');
    const banner   = document.getElementById('simAlarmBanner');

    if (btn) btn.classList.toggle('active', this.intruderMode);

    if (this.intruderMode) {
      if (intruder) intruder.classList.add('active');
      if (tieneAlarma && banner) banner.classList.add('active');
      onStatus('<strong style="color:#ef4444">⚠ Intruso detectado</strong> — sistema de alarma activado');

      setTimeout(() => {
        if (!this.intruderMode) return;
        if (intruder) intruder.classList.remove('active');
        setTimeout(() => { if (intruder) intruder.classList.add('active'); }, 500);
      }, 2500);
    } else {
      if (intruder) intruder.classList.remove('active');
      if (banner)   banner.classList.remove('active');
      onStatus('Simulación de intruso detenida');
    }
  }

  resetAll(onStatus) {
    const canvas = document.getElementById('simCanvas');
    if (canvas) canvas.classList.remove('night');
    this.nightMode    = false;
    this.rainMode     = false;
    this.intruderMode = false;

    ['btnNight', 'btnRain', 'btnIntruder'].forEach(id => {
      const b = document.getElementById(id);
      if (b) b.classList.remove('active');
    });

    const rain     = document.getElementById('simRain');     if (rain)     rain.remove();
    const intruder = document.getElementById('simIntruder'); if (intruder) intruder.classList.remove('active');
    const banner   = document.getElementById('simAlarmBanner'); if (banner) banner.classList.remove('active');

    onStatus('Vista restablecida');
  }
}


/* ══════════════════════════════════════════════
   CLASE: CoveragePanel
   Calcula y actualiza las barras de cobertura
   y la leyenda del panel derecho.
══════════════════════════════════════════════ */
class CoveragePanel {
  static _EXT_CAMERAS  = ['sv1', 'sc1', 'sc2', 'sc3', 'sc4'];
  static _INT_CAMERAS  = ['si1', 'sd1', 'sc3'];

  actualizar(items) {
    const activos = items.filter(i => i.active);

    const camaras   = activos.filter(i => i.producto.cat.includes('Cámara') || i.producto.cat.includes('Videoportero'));
    const perimetro = activos.filter(i => i.producto.cat.includes('Cerca')  || i.producto.cat.includes('Magnético'));
    const alarma    = activos.filter(i => i.producto.esAlarma());

    const pCov = Math.min(100, Math.round(
      camaras.filter(c => CoveragePanel._EXT_CAMERAS.includes(c.producto.id)).length * 30
      + perimetro.length * 25
    ));
    const iCov = Math.min(100, Math.round(
      camaras.filter(c => CoveragePanel._INT_CAMERAS.includes(c.producto.id)).length * 40
      + camaras.length * 8
    ));
    const aCov = Math.min(100, Math.round(alarma.length * 35));

    this._setBar('covPerimeter', 'covPeriPct',  pCov);
    this._setBar('covInterior',  'covIntPct',   iCov);
    this._setBar('covAlarm',     'covAlarmPct', aCov);

    this._renderLeyenda(activos);
  }

  _setBar(barId, pctId, valor) {
    const bar = document.getElementById(barId);
    const pct = document.getElementById(pctId);
    if (bar) bar.style.width   = valor + '%';
    if (pct) pct.textContent   = valor + '%';
  }

  _renderLeyenda(items) {
    const el = document.getElementById('simLegend');
    if (!el) return;

    const cats = {};
    items.forEach(i => { cats[i.producto.cat] = i.producto.color; });

    if (!Object.keys(cats).length) {
      el.innerHTML = '<p style="font-size:.74rem;color:var(--clr-muted);padding:.25rem 0;">Sin elementos en el plano</p>';
      return;
    }

    el.innerHTML = Object.entries(cats).map(([cat, color]) =>
      `<div class="sim-legend-item">
         <span class="sim-legend-dot" style="background:${color}"></span>
         <span>${cat}</span>
       </div>`
    ).join('');
  }
}


/* ══════════════════════════════════════════════
   CLASE: Simulador   (Controlador principal)
   Orquesta todas las clases anteriores.
   Es el único objeto expuesto globalmente.
   El HTML llama sus métodos con Sim.xxx()
══════════════════════════════════════════════ */
class Simulador {
  constructor() {
    /* Dependencias */
    this._catalogo  = new CatalogoDB();
    this._renderer  = new CanvasRenderer();
    this._drag      = new DragController();
    this._env       = new EnvironmentMode();
    this._coverage  = new CoveragePanel();

    /* Estado del plano */
    this._items           = [];         // Array<ItemPlano>
    this._selectedId      = null;       // id del ítem seleccionado en el plano
    this._selectedProduct = null;       // Producto seleccionado del panel
    this._idCounter       = 0;
  }

  /* ── Helpers privados ──────────────────────── */

  _uid() { return `item_${++this._idCounter}`; }

  _canvasRect() { return document.getElementById('simCanvas').getBoundingClientRect(); }

  _setStatus(msg) {
    const el = document.getElementById('simStatus');
    if (el) el.innerHTML = msg;
  }

  _updateCount() {
    const el = document.getElementById('simCount');
    if (el) el.textContent = this._items.length;
  }

  _findItem(id) { return this._items.find(i => i.id === id) || null; }

  _selectedItem() { return this._findItem(this._selectedId); }

  /* ── Inicialización ────────────────────────── */

  init() {
    this._renderListaProductos();
    this._coverage.actualizar(this._items);
    this._bindCanvasEvents();
  }

  _bindCanvasEvents() {
    const canvas = document.getElementById('simCanvas');
    if (!canvas) return;

    canvas.addEventListener('mousemove', e => {
      if (this._drag.isDragging) {
        const pos  = this._drag.calcularPosicion(e, this._canvasRect());
        const item = this._findItem(this._drag.targetId);
        if (item && pos) {
          item.x = pos.x;
          item.y = pos.y;
          this._renderer.moverElemento(item);
        }
      }
      this._moverTooltip(e);
    });

    canvas.addEventListener('mouseup',    () => this._drag.finalizar());
    canvas.addEventListener('mouseleave', () => this._drag.finalizar());
    canvas.addEventListener('touchmove',  e => {
      const pos  = this._drag.calcularPosicion(e, this._canvasRect());
      const item = this._findItem(this._drag.targetId);
      if (item && pos) {
        item.x = pos.x;
        item.y = pos.y;
        this._renderer.moverElemento(item);
      }
    }, { passive: true });
    canvas.addEventListener('touchend', () => this._drag.finalizar());
    canvas.addEventListener('click', e => {
      if (e.target === canvas || e.target.classList.contains('sim-items-layer')) {
        this.deselectItem();
      }
    });
  }

  /* ── Panel de productos ────────────────────── */

  _renderListaProductos(filtro) {
    const container = document.getElementById('simProductList');
    if (!container) return;

    const lista   = this._catalogo.filtrar(filtro);
    const grupos  = this._catalogo.agruparPorCategoria(lista);
    let   html    = '';

    Object.entries(grupos).forEach(([cat, productos]) => {
      html += `<div class="sim-cat-header">${cat}</div>`;
      productos.forEach(p => {
        const nightBadge = p.nightVision
          ? `<span class="sim-product-item__badge sim-product-item__badge--nocturna">
               <i class="fa-solid fa-moon" style="font-size:.55rem;"></i>
             </span>`
          : '';

        const imgHTML = p.img
          ? `<img class="sim-product-item__img" src="${p.img}" alt="${p.name}"
                onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
             <div class="sim-product-item__img-ph" style="display:none;">
               <i class="${p.icon}" style="font-size:.9rem;color:${p.color}"></i>
             </div>`
          : `<div class="sim-product-item__img-ph">
               <i class="${p.icon}" style="font-size:.9rem;color:${p.color}"></i>
             </div>`;

        const disabled    = p.canSimulate ? '' : 'disabled';
        const titleAttr   = p.canSimulate ? '' : 'title="Este producto no puede simularse en el plano"';

        html += `
          <div class="sim-product-item ${disabled}" data-id="${p.id}"
               onclick="Sim.selectProduct('${p.id}')" ${titleAttr}>
            ${imgHTML}
            <div class="sim-product-item__info">
              <p class="sim-product-item__name">${p.name}</p>
              <p class="sim-product-item__cat">${p.cat}</p>
            </div>
            ${nightBadge}
          </div>`;
      });
    });

    container.innerHTML = html;
  }

  selectProduct(id) {
    const p = this._catalogo.buscarPorId(id);
    if (!p || !p.canSimulate) return;

    this._selectedProduct = p;

    document.querySelectorAll('.sim-product-item').forEach(el => {
      el.classList.toggle('active', el.dataset.id === id);
    });

    const info = document.getElementById('simProductInfo');
    if (!info) return;

    const imgHTML = p.img
      ? `<img src="${p.img}" alt="${p.name}"
            style="max-height:86px;max-width:100%;object-fit:contain;"
            onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
         <i class="${p.icon}" style="display:none;font-size:2rem;color:${p.color}"></i>`
      : `<i class="${p.icon}" style="font-size:2rem;color:${p.color}"></i>`;

    document.getElementById('simInfoImg').innerHTML   = imgHTML;
    document.getElementById('simInfoName').textContent = p.name;
    document.getElementById('simInfoCat').textContent  = p.cat;
    document.getElementById('simInfoSpecs').textContent = p.specs;
    document.getElementById('simInfoTags').innerHTML   = p.tags.map(t => p.tagHTML(t)).join('');

    info.style.display = 'block';
    this._setStatus(`<strong>${p.name}</strong> seleccionado — haz clic en <strong>Agregar al plano</strong>`);
  }

  filterProducts(q) { this._renderListaProductos(q); }

  /* ── Agregar ítem al plano ─────────────────── */

  addSelected() {
    const p = this._selectedProduct;
    if (!p) return;

    const item = new ItemPlano(this._uid(), p);
    this._items.push(item);

    const el = this._renderer.crearElemento(
      item,
      (e, id)        => this._drag.iniciar(e, id),
      (id)           => this.selectItem(id),
      (action, e, i) => this._handleTooltip(action, e, i)
    );

    const layer = document.getElementById('simItemsLayer');
    if (layer) layer.appendChild(el);

    this._updateCount();
    this._coverage.actualizar(this._items);
    this._setStatus(`<strong>${p.name}</strong> añadido. Arrastra para reposicionar.`);
  }

  /* ── Selección de ítem en el plano ─────────── */

  selectItem(id) {
    this._selectedId = id;
    const item = this._selectedItem();
    if (!item) return;

    document.querySelectorAll('.sim-item').forEach(el => el.classList.remove('selected'));
    const el = document.getElementById(id);
    if (el) el.classList.add('selected');

    document.getElementById('simNoSelection').style.display = 'none';
    document.getElementById('simSelection').style.display   = 'block';

    const p = item.producto;

    const imgHTML = p.img
      ? `<img src="${p.img}" alt="${p.name}"
            onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
         <i class="${p.icon}" style="display:none;font-size:2.2rem;color:${p.color}"></i>`
      : `<i class="${p.icon}" style="font-size:2.2rem;color:${p.color}"></i>`;

    document.getElementById('simSelImg').innerHTML     = imgHTML;
    document.getElementById('simSelName').textContent  = p.name;

    document.getElementById('simRotSlider').value      = item.rotation;
    document.getElementById('simRotVal').textContent   = Math.round(item.rotation) + '°';
    document.getElementById('simScaleSlider').value    = item.scale;
    document.getElementById('simScaleVal').textContent = item.scale + '%';
    document.getElementById('simActiveCheck').checked  = item.active;

    const hasFov = p.hasFov;
    const show   = v => v ? '' : 'none';

    document.getElementById('simFovGroup').style.display    = show(hasFov);
    document.getElementById('simFovToggle').style.display   = show(hasFov);
    document.getElementById('simReachGroup').style.display  = show(hasFov);
    document.getElementById('simOffsetGroup').style.display = show(hasFov);
    document.getElementById('simAlertToggle').style.display = show(p.esAlarma());

    if (hasFov) {
      document.getElementById('simFovSlider').value      = item.fov;
      document.getElementById('simFovVal').textContent   = item.fov + '°';
      document.getElementById('simFovCheck').checked     = item.showFov;
      document.getElementById('simReachSlider').value    = item.reach;
      document.getElementById('simReachVal').textContent = item.reach;
      document.getElementById('simOffsetSlider').value    = item.offset;
      document.getElementById('simOffsetVal').textContent = item.offset;
    }

    const alertCheck = document.getElementById('simAlertCheck');
    if (alertCheck) alertCheck.checked = item.alert;

    this._setStatus(`Editando: <strong>${p.name}</strong>`);
  }

  deselectItem() {
    this._selectedId = null;
    document.querySelectorAll('.sim-item').forEach(el => el.classList.remove('selected'));
    document.getElementById('simNoSelection').style.display = 'block';
    document.getElementById('simSelection').style.display   = 'none';
    this._setStatus('Selecciona un producto del panel y haz clic en <strong>Agregar al plano</strong>');
  }

  /* ── Controles de propiedades ──────────────── */

  rotateItem(deg) {
    const item = this._selectedItem();
    if (!item) return;
    item.rotation = parseFloat(deg);
    document.getElementById('simRotVal').textContent = Math.round(item.rotation) + '°';
    this._renderer.refrescarTransform(item);
  }

  rotateBy(delta) {
    const item = this._selectedItem();
    if (!item) return;
    item.rotarPor(delta);
    document.getElementById('simRotSlider').value    = item.rotation;
    document.getElementById('simRotVal').textContent = Math.round(item.rotation) + '°';
    this._renderer.refrescarTransform(item);
  }

  scaleItem(pct) {
    const item = this._selectedItem();
    if (!item) return;
    item.scale = parseInt(pct);
    document.getElementById('simScaleVal').textContent = item.scale + '%';
    this._renderer.refrescarTransform(item);
  }

  setFov(deg) {
    const item = this._selectedItem();
    if (!item || !item.producto.hasFov) return;
    item.fov = parseInt(deg);
    document.getElementById('simFovVal').textContent = item.fov + '°';
    this._renderer.refrescarCono(item);
  }

  setReach(val) {
    const item = this._selectedItem();
    if (!item || !item.producto.hasFov) return;
    item.reach = parseInt(val);
    document.getElementById('simReachVal').textContent = item.reach;
    this._renderer.refrescarCono(item);
  }

  setOffset(val) {
    const item = this._selectedItem();
    if (!item || !item.producto.hasFov) return;
    item.offset = parseInt(val);
    document.getElementById('simOffsetVal').textContent = item.offset;
    this._renderer.refrescarCono(item);
  }

  toggleFovCone(checked) {
    const item = this._selectedItem();
    if (!item) return;
    item.showFov = checked;
    const coneEl = document.getElementById(`${item.id}_cone`);

    if (coneEl) {
      coneEl.style.display = checked ? '' : 'none';
    } else if (checked) {
      const wrap = document.getElementById(item.id);
      if (!wrap) return;
      const cone = document.createElement('div');
      cone.className = 'sim-item__cone';
      cone.id        = `${item.id}_cone`;
      cone.innerHTML = this._renderer.buildCone(item.fov, item.producto.color, item.reach, item.offset);
      wrap.insertBefore(cone, wrap.firstChild);
    }
  }

  toggleActive(checked) {
    const item = this._selectedItem();
    if (!item) return;
    item.active = checked;
    this._renderer.refrescarBadge(item);
    this._coverage.actualizar(this._items);
  }

  toggleAlert(checked) {
    const item = this._selectedItem();
    if (!item) return;
    item.alert = checked;
    this._renderer.refrescarBadge(item);
  }

  /* ── Tooltip ───────────────────────────────── */

  _handleTooltip(action, e, item) {
    const tip = document.getElementById('simTooltip');
    if (!tip) return;
    if (action === 'hide') { tip.style.display = 'none'; return; }
    const tags = item.producto.tags.join(' · ');
    tip.innerHTML   = `<strong>${item.producto.name}</strong><br>${item.producto.specs}${tags ? '<br>' + tags : ''}`;
    tip.style.display = 'block';
    this._moverTooltip(e);
  }

  _moverTooltip(e) {
    const tip    = document.getElementById('simTooltip');
    const canvas = this._canvasRect();
    if (!tip || tip.style.display === 'none') return;
    const x = e.clientX - canvas.left + 12;
    const y = e.clientY - canvas.top  - 10;
    tip.style.left = Math.min(x, canvas.width - 180) + 'px';
    tip.style.top  = Math.max(0, y) + 'px';
  }

  /* ── Eliminar / limpiar ────────────────────── */

  deleteSelected() {
    if (!this._selectedId) return;
    const idx = this._items.findIndex(i => i.id === this._selectedId);
    if (idx === -1) return;
    this._renderer.eliminarElemento(this._selectedId);
    this._items.splice(idx, 1);
    this.deselectItem();
    this._updateCount();
    this._coverage.actualizar(this._items);
    this._setStatus('Elemento eliminado del plano');
  }

  clearAll() {
    this._items.forEach(i => this._renderer.eliminarElemento(i.id));
    this._items      = [];
    this._selectedId = null;
    this.deselectItem();
    this._updateCount();
    this._coverage.actualizar(this._items);
    this._setStatus('Plano limpiado');
  }

  /* ── Modos ambientales ─────────────────────── */

  toggleNight()    { this._env.toggleNight(msg => this._setStatus(msg)); }
  toggleRain()     { this._env.toggleRain(msg => this._setStatus(msg)); }

  toggleIntruder() {
    const tieneAlarma = this._items.some(i => i.producto.esAlarma());
    this._env.toggleIntruder(tieneAlarma, msg => this._setStatus(msg));
  }

  resetView()      { this._env.resetAll(msg => this._setStatus(msg)); }
}


/* ══════════════════════════════════════════════
   ARRANQUE GLOBAL
   Se crea una instancia de Simulador y se
   expone como window.Sim para compatibilidad
   con los onclick del HTML existente.
══════════════════════════════════════════════ */
const Sim = new Simulador();

/* Hook en showView para inicializar cuando
   la vista del simulador se hace visible */
(function () {
  const origShow = window.showView;
  window.showView = function (id) {
    if (origShow) origShow(id);
    if (id === 'simulador') setTimeout(() => Sim.init(), 50);
  };
})();

/* ══════════════════════════════════════════════
   SimFloor — Controlador de plano personalizado
   Gestiona:
     · Subir imagen  (PNG/JPG/JPEG/SVG)
     · Modal "Generar desde video"  (solo UI)
     · Restaurar plano original
══════════════════════════════════════════════ */
const SimFloor = (() => {

  /* ── Estado interno ── */
  let _pendingDataURL  = null;   // data-URL de la imagen previsualizada
  let _pendingVideoURL = null;   // object-URL del video previsualizad
  let _customActive    = false;  // hay plano personalizado activo

  /* ── Helpers DOM ── */
  const $  = id => document.getElementById(id);
  const el = id => $(id);

  /* ═══════════════════════════════════════════
     MODAL: Subir imagen
  ═══════════════════════════════════════════ */
  function openUpload() {
    el('simFloorUploadModal').style.display = 'flex';
    _pendingDataURL = null;
    _resetUploadUI();
  }

  function closeUpload() {
    el('simFloorUploadModal').style.display = 'none';
    _pendingDataURL = null;
  }

  function _resetUploadUI() {
    el('simFloorDropInner').style.display  = '';
    el('simFloorPreview').style.display    = 'none';
    el('simFloorApplyBtn').disabled        = true;
    el('simFloorFileInput').value          = '';
    const previewImg = el('simFloorPreviewImg');
    if (previewImg.src) URL.revokeObjectURL(previewImg.src);
    previewImg.src = '';
  }

  /* Drag & drop ── imagen */
  function onDragOver(e) {
    e.preventDefault();
    el('simFloorDropzone').classList.add('drag-over');
  }
  function onDragLeave(e) {
    el('simFloorDropzone').classList.remove('drag-over');
  }
  function onDrop(e) {
    e.preventDefault();
    el('simFloorDropzone').classList.remove('drag-over');
    const file = e.dataTransfer?.files?.[0];
    if (file) _processImageFile(file);
  }

  /* Input file ── imagen */
  function onFileSelected(input) {
    const file = input.files?.[0];
    if (file) _processImageFile(file);
  }

  function _processImageFile(file) {
    const allowed = ['image/png','image/jpeg','image/svg+xml'];
    if (!allowed.includes(file.type)) {
      alert('Formato no soportado. Usa PNG, JPG, JPEG o SVG.');
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      _pendingDataURL = e.target.result;
      // Mostrar preview
      el('simFloorPreviewImg').src  = _pendingDataURL;
      el('simFloorFileName').textContent = file.name;
      el('simFloorDropInner').style.display = 'none';
      el('simFloorPreview').style.display   = 'flex';
      el('simFloorApplyBtn').disabled       = false;
    };
    reader.readAsDataURL(file);
  }

  function clearPreview(e) {
    e.stopPropagation();
    _resetUploadUI();
  }

  /* Aplicar imagen al canvas */
  function applyImage() {
    if (!_pendingDataURL) return;

    const canvas  = el('simCanvas');
    const svgFloor = el('simFloor');

    // Ocultar SVG original
    svgFloor.style.display = 'none';

    // Eliminar imagen personalizada previa si existe
    const prev = canvas.querySelector('.sim-custom-floor-img');
    if (prev) prev.remove();

    // Crear elemento <img>
    const img  = document.createElement('img');
    img.src    = _pendingDataURL;
    img.className = 'sim-custom-floor-img';
    img.alt    = 'Plano personalizado';

    // Insertar antes del layer de ítems
    const itemsLayer = el('simItemsLayer');
    canvas.insertBefore(img, itemsLayer);

    // Mostrar badge "temporal"
    _showCustomBadge(canvas);

    // Mostrar botón "Plano original"
    el('btnResetFloor').style.display = '';

    _customActive = true;
    closeUpload();
  }

  function _showCustomBadge(canvas) {
    let badge = canvas.querySelector('.simfloor-custom-badge');
    if (!badge) {
      badge = document.createElement('div');
      badge.className = 'simfloor-custom-badge';
      badge.innerHTML = '<i class="fa-solid fa-clock-rotate-left"></i> Plano temporal';
      canvas.appendChild(badge);
    }
  }

  /* Restaurar plano original */
  function reset() {
    const canvas = el('simCanvas');

    // Mostrar SVG original
    el('simFloor').style.display = '';

    // Eliminar imagen personalizada
    const img = canvas.querySelector('.sim-custom-floor-img');
    if (img) img.remove();

    // Eliminar badge
    const badge = canvas.querySelector('.simfloor-custom-badge');
    if (badge) badge.remove();

    // Ocultar botón reset
    el('btnResetFloor').style.display = 'none';

    _customActive = false;
    _pendingDataURL = null;
  }


  /* ═══════════════════════════════════════════
     MODAL: Generar desde video  (solo UI)
  ═══════════════════════════════════════════ */
  function openVideoGen() {
    el('simFloorVideoModal').style.display = 'flex';
    _pendingVideoURL = null;
    _resetVideoUI();
  }

  function closeVideoGen() {
    el('simFloorVideoModal').style.display = 'none';
    if (_pendingVideoURL) {
      URL.revokeObjectURL(_pendingVideoURL);
      _pendingVideoURL = null;
    }
  }

  function _resetVideoUI() {
    el('simVideoDropInner').style.display  = '';
    el('simVideoPreview').style.display    = 'none';
    el('simVideoGenerateBtn').disabled     = true;
    el('simVideoFileInput').value          = '';
    const vid = el('simVideoPreviewEl');
    if (vid.src) { vid.pause(); URL.revokeObjectURL(vid.src); vid.src = ''; }
  }

  /* Drag & drop ── video */
  function onVideoDragOver(e) {
    e.preventDefault();
    el('simVideoDropzone').classList.add('drag-over');
  }
  function onVideoDragLeave(e) {
    el('simVideoDropzone').classList.remove('drag-over');
  }
  function onVideoDrop(e) {
    e.preventDefault();
    el('simVideoDropzone').classList.remove('drag-over');
    const file = e.dataTransfer?.files?.[0];
    if (file) _processVideoFile(file);
  }

  /* Input file ── video */
  function onVideoSelected(input) {
    const file = input.files?.[0];
    if (file) _processVideoFile(file);
  }

  function _processVideoFile(file) {
    if (!file.type.startsWith('video/')) {
      alert('Por favor selecciona un archivo de video (MP4, MOV, AVI, WEBM).');
      return;
    }
    if (file.size > 500 * 1024 * 1024) {
      alert('El video supera el límite de 500 MB.');
      return;
    }
    if (_pendingVideoURL) URL.revokeObjectURL(_pendingVideoURL);
    _pendingVideoURL = URL.createObjectURL(file);

    const vid = el('simVideoPreviewEl');
    vid.src = _pendingVideoURL;

    el('simVideoFileName').textContent = file.name;
    el('simVideoFileSize').textContent = _formatSize(file.size);

    el('simVideoDropInner').style.display = 'none';
    el('simVideoPreview').style.display   = 'flex';
    el('simVideoGenerateBtn').disabled    = false;
  }

  function clearVideo(e) {
    e.stopPropagation();
    _resetVideoUI();
  }

  /* Botón "Generar" — placeholder, solo UI por ahora */
  function generateFromVideo() {
    // TODO: conectar con backend / API de generación de planos
    alert('Funcionalidad de generación con IA próximamente disponible.');
  }

  /* Helpers */
  function _formatSize(bytes) {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  /* API pública */
  return {
    openUpload, closeUpload,
    onDragOver, onDragLeave, onDrop,
    onFileSelected, clearPreview,
    applyImage, reset,
    openVideoGen, closeVideoGen,
    onVideoDragOver, onVideoDragLeave, onVideoDrop,
    onVideoSelected, clearVideo,
    generateFromVideo,
  };
})();