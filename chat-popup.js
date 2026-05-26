'use strict';

/* ================================================
   CHAT POPUP WIDGET v2 — SERTECSUR
   Mejoras:
   · Tarjetas de producto con imagen, nombre, precio
   · Click en tarjeta abre detalle del producto
   · Botones de acción: añadir al carrito, cotizar,
     ir al catálogo, WhatsApp
   · Cotización y carrito integrados con db.php
   · Manejo de usuario autenticado/no autenticado
================================================ */

let chatHistory = [];

const ChatPopup = (() => {

  /* ── Mensajes de bienvenida ────────────────── */
  const WELCOME_MESSAGES = [
    { text: '¡Hola! 👋 Soy el asistente de <strong>SERTECSUR</strong>.', delay: 0 },
    { text: '¿En qué puedo ayudarte? Puedo recomendarte productos, cotizar, agregar al carrito y más.', delay: 900 },
  ];

  /* ── Sugerencias rápidas ───────────────────── */
  const SUGGESTIONS = [
    'Cotizar cámaras CCTV',
    'Recomienda una cámara exterior',
    'Comparar cámaras bullet vs domo',
    'Hablar con un asesor',
  ];

  /* ── Hora actual ───────────────────────────── */
  function now() {
    return new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  }

  /* ── HTML del widget ───────────────────────── */
  function buildHTML() {
    return `
      <div class="chat-overlay" id="chatOverlay" onclick="ChatPopup.close()"></div>
      <div class="chat-popup" id="chatPopup" role="dialog" aria-modal="true" aria-label="Chat SERTECSUR">
        <div class="chat-popup__header">
          <div class="chat-popup__avatar">
            <img src="img/SVG/logo.svg" alt="SERTECSUR"
              onerror="this.parentNode.innerHTML='<i class=\\'fa-solid fa-headset\\'></i>'"/>
          </div>
          <div class="chat-popup__header-info">
            <p class="chat-popup__name">Asistente SERTECSUR</p>
            <p class="chat-popup__status">
              <span class="chat-popup__status-dot"></span> En línea ahora
            </p>
          </div>
          <button class="chat-popup__close" onclick="ChatPopup.close()" aria-label="Cerrar">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="chat-popup__body" id="chatBody"></div>
        <div class="chat-popup__footer">
          <textarea id="chatInput" class="chat-popup__input"
            placeholder="Escribe tu mensaje…" rows="1"
            aria-label="Mensaje"></textarea>
          <button id="chatSendBtn" class="chat-popup__send"
            onclick="ChatPopup.sendMessage()" aria-label="Enviar" disabled>
            <i class="fa-solid fa-paper-plane"></i>
          </button>
        </div>
      </div>`;
  }

  /* ── Burbuja de texto ──────────────────────── */
  function addMessage({ text, type = 'bot', showTime = true }) {
    const body = document.getElementById('chatBody');
    if (!body) return;
    const wrap = document.createElement('div');
    wrap.style.display = 'flex';
    wrap.style.flexDirection = 'column';
    const msg = document.createElement('div');
    msg.className = `chat-msg chat-msg--${type}`;
    msg.innerHTML = text;
    wrap.appendChild(msg);
    if (showTime) {
      const t = document.createElement('p');
      t.className = 'chat-msg__time';
      t.textContent = now();
      wrap.appendChild(t);
    }
    body.appendChild(wrap);
    body.scrollTop = body.scrollHeight;
    return wrap;
  }

  /* ── Tarjetas de producto ──────────────────── */
  function addProductCards(products) {
    if (!products || !products.length) return;
    const body = document.getElementById('chatBody');
    if (!body) return;

    const grid = document.createElement('div');
    grid.className = 'chat-products-grid';

    products.forEach(p => {
      const card = document.createElement('div');
      card.className = 'chat-product-card';
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', `Ver ${p.nombre}`);

      const imgHTML = p.img
        ? `<img src="${p.img}" alt="${p.nombre}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
        : '';
      const placeholderStyle = p.img ? 'display:none;' : 'display:flex;';

      card.innerHTML = `
        <div class="chat-product-card__img">
          ${imgHTML}
          <div class="chat-product-card__img-ph" style="${placeholderStyle}">
            <i class="fa-solid fa-camera"></i>
          </div>
        </div>
        <div class="chat-product-card__body">
          <p class="chat-product-card__cat">${p.tipo || ''}</p>
          <p class="chat-product-card__name">${p.nombre}</p>
          <p class="chat-product-card__price">$${parseFloat(p.precio).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
        </div>`;

      // Click → abre detalle del producto
      const openDetail = () => {
        ChatPopup.close();
        if (typeof showDetailById === 'function') {
          showDetailById(p.id);
        } else if (typeof showView === 'function') {
          showView('catalogo');
        }
      };
      card.addEventListener('click', openDetail);
      card.addEventListener('keydown', e => { if (e.key === 'Enter') openDetail(); });

      grid.appendChild(card);
    });

    body.appendChild(grid);
    body.scrollTop = body.scrollHeight;
  }

  /* ── Botones de acción ─────────────────────── */
  function addActionButtons(actions) {
    if (!actions || !actions.length) return;
    const body = document.getElementById('chatBody');
    if (!body) return;

    const wrap = document.createElement('div');
    wrap.className = 'chat-actions-wrap';

    actions.forEach(action => {
      const btn = document.createElement('button');
      btn.className = 'chat-action-btn';

      const icons = {
        add_cart:        'fa-cart-plus',
        quote:           'fa-file-invoice-dollar',
        view_catalog:    'fa-box-open',
        contact_whatsapp:'fa-whatsapp',
        view_product:    'fa-eye',
      };

      const iconClass = icons[action.type] || 'fa-bolt';
      const iconFamily = action.type === 'contact_whatsapp' ? 'fa-brands' : 'fa-solid';
      btn.innerHTML = `<i class="${iconFamily} ${iconClass}"></i> ${action.label}`;

      btn.addEventListener('click', () => handleAction(action, btn));
      wrap.appendChild(btn);
    });

    body.appendChild(wrap);
    body.scrollTop = body.scrollHeight;
  }

  /* ── Manejar acción ────────────────────────── */
  async function handleAction(action, btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> ' + btn.textContent.trim();

    switch (action.type) {

      case 'add_cart':
        await _addToCart(action.product_id, btn);
        break;

      case 'quote':
        await _createQuote(action.product_ids || [action.product_id], btn);
        break;

      case 'view_catalog':
        ChatPopup.close();
        if (typeof showView === 'function') showView('catalogo');
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-box-open"></i> Ver catálogo';
        break;

      case 'contact_whatsapp': {
        const waUrl = 'https://wa.me/529381329935?text=' + encodeURIComponent('Hola, necesito ayuda con un producto de SERTECSUR.');
        window.open(waUrl, '_blank');
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-brands fa-whatsapp"></i> ' + action.label;
        break;
      }

      case 'view_product':
        if (action.product_id) {
          ChatPopup.close();
          if (typeof showDetailById === 'function') showDetailById(action.product_id);
        }
        break;

      default:
        btn.disabled = false;
    }
  }

  /* ── Añadir al carrito via db.php ──────────── */
  async function _addToCart(productId, btn) {
    // Verificar sesión
    const sess = await _getSession();
    if (!sess || sess.rol !== 'cliente') {
      _botMessage('Para agregar al carrito necesitas <strong>iniciar sesión</strong> como cliente.');
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-cart-plus"></i> ' + btn.textContent.replace(/^.*?\s/, '');
      // Botón para ir a login
      addActionButtons([{ type: 'view_catalog', label: 'Ir a iniciar sesión' }]);
      const lastAction = document.querySelector('.chat-actions-wrap:last-child .chat-action-btn:last-child');
      if (lastAction) {
        lastAction.onclick = () => { ChatPopup.close(); if (typeof showView === 'function') showView('login'); };
        lastAction.innerHTML = '<i class="fa-solid fa-user-lock"></i> Iniciar sesión';
      }
      return;
    }

    try {
      const r = await fetch('db.php?action=carrito', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ producto_id: productId, cantidad: 1 }),
      });
      const d = await r.json();
      if (d.ok) {
        // Actualizar carrito en la app si existe
        if (typeof Cart !== 'undefined' && Cart.load) await Cart.load();
        _botMessage('✅ Producto añadido al carrito. <button onclick="ChatPopup.close();Cart.open()" style="color:var(--clr-accent);background:none;border:none;cursor:pointer;font-family:inherit;font-size:.82rem;font-weight:700;text-decoration:underline;">Ver carrito</button>');
      } else {
        _botMessage('No pude agregar el producto: ' + (d.error || 'Error desconocido'));
      }
    } catch {
      _botMessage('Error de conexión al agregar el producto.');
    }
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-cart-plus"></i> Producto agregado ✓';
  }

  /* ── Crear cotización via db.php ───────────── */
  async function _createQuote(productIds, btn) {
    const sess = await _getSession();
    if (!sess || sess.rol !== 'cliente') {
      _botMessage('Para cotizar necesitas <strong>iniciar sesión</strong> como cliente.');
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-file-invoice-dollar"></i> ' + btn.textContent.replace(/^.*?\s/, '');
      return;
    }

    const items = productIds.map(id => ({ producto_id: parseInt(id), cantidad: 1 }));

    try {
      const r = await fetch('db.php?action=cotizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, notas: 'Cotización generada desde el asistente virtual' }),
      });
      const d = await r.json();
      if (d.ok) {
        _botMessage('✅ ¡Cotización generada! La puedes ver en <button onclick="ChatPopup.close();if(typeof showView===\'function\')showView(\'mis-cotizaciones\')" style="color:var(--clr-accent);background:none;border:none;cursor:pointer;font-family:inherit;font-size:.82rem;font-weight:700;text-decoration:underline;">Mis cotizaciones</button> o descargar el PDF ahora.');
        // Descargar PDF si la función existe
        if (typeof descargarCotizacionPDF === 'function') {
          setTimeout(() => descargarCotizacionPDF(d.data), 500);
        }
      } else {
        _botMessage('No pude crear la cotización: ' + (d.error || 'Error desconocido'));
      }
    } catch {
      _botMessage('Error de conexión al crear la cotización.');
    }
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-file-invoice-dollar"></i> Cotización creada ✓';
  }

  /* ── Obtener sesión actual ─────────────────── */
  async function _getSession() {
    // Intentar desde Session global primero
    if (typeof Session !== 'undefined' && Session.user) return Session.user;
    try {
      const r = await fetch('db.php?action=me');
      const d = await r.json();
      return (d.ok && d.data) ? d.data : null;
    } catch { return null; }
  }

  /* ── Mensaje del bot (shortcut) ────────────── */
  function _botMessage(html) {
    addMessage({ text: html, type: 'bot' });
  }

  /* ── Typing indicator ──────────────────────── */
  function showTyping() {
    const body = document.getElementById('chatBody');
    if (!body) return null;
    const el = document.createElement('div');
    el.className = 'chat-typing';
    el.id = 'chatTyping';
    el.innerHTML = '<span></span><span></span><span></span>';
    body.appendChild(el);
    body.scrollTop = body.scrollHeight;
    return el;
  }

  function hideTyping() {
    document.getElementById('chatTyping')?.remove();
  }

  /* ── Sugerencias iniciales ─────────────────── */
  function renderSuggestions() {
    const body = document.getElementById('chatBody');
    if (!body) return;
    const wrap = document.createElement('div');
    wrap.className = 'chat-suggestions';
    wrap.id = 'chatSuggestions';
    SUGGESTIONS.forEach(text => {
      const btn = document.createElement('button');
      btn.className = 'chat-suggestion-btn';
      btn.textContent = text;
      btn.onclick = () => { wrap.remove(); ChatPopup.sendMessage(text); };
      wrap.appendChild(btn);
    });
    body.appendChild(wrap);
    body.scrollTop = body.scrollHeight;
  }

  /* ── Bienvenida ────────────────────────────── */
  let welcomeDone = false;

  function playWelcome() {
    if (welcomeDone) return;
    welcomeDone = true;
    showTyping();
    WELCOME_MESSAGES.forEach(({ text, delay }, i) => {
      setTimeout(() => {
        if (i === 0) hideTyping();
        addMessage({ text, type: 'bot' });
        if (i < WELCOME_MESSAGES.length - 1) showTyping();
        if (i === WELCOME_MESSAGES.length - 1) setTimeout(renderSuggestions, 400);
      }, delay + 600);
    });
  }

  /* ── Auto-resize textarea ──────────────────── */
  function autoResize(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 100) + 'px';
  }

  /* ── Init ──────────────────────────────────── */
  function init() {
    if (document.getElementById('chatPopup')) return; // Ya inicializado

    // Inyectar HTML
    const container = document.createElement('div');
    container.innerHTML = buildHTML();
    document.body.appendChild(container);

    // CSS extra para tarjetas y acciones
    _injectStyles();

    // Botón flotante
    const oldBtn = document.querySelector('.whatsapp-float');
    if (oldBtn) {
      oldBtn.removeAttribute('href');
      oldBtn.setAttribute('role', 'button');
      oldBtn.setAttribute('aria-haspopup', 'dialog');
      oldBtn.setAttribute('aria-expanded', 'false');
      oldBtn.onclick = e => { e.preventDefault(); ChatPopup.toggle(); };
      const dot = document.createElement('span');
      dot.className = 'whatsapp-float__dot';
      oldBtn.style.position = 'relative';
      oldBtn.appendChild(dot);
    }

    // Input
    const input  = document.getElementById('chatInput');
    const sendBtn = document.getElementById('chatSendBtn');
    if (input) {
      input.addEventListener('input', () => {
        autoResize(input);
        if (sendBtn) sendBtn.disabled = input.value.trim() === '';
      });
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ChatPopup.sendMessage(); }
      });
    }

    document.addEventListener('keydown', e => { if (e.key === 'Escape') ChatPopup.close(); });
  }

  /* ── Estilos para tarjetas de producto ──────── */
  function _injectStyles() {
    if (document.getElementById('chatPopupV2Styles')) return;
    const style = document.createElement('style');
    style.id = 'chatPopupV2Styles';
    style.textContent = `
      /* Grid de tarjetas de producto en el chat */
      .chat-products-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: .45rem;
        padding: .35rem 0 .1rem;
        width: 100%;
      }

      .chat-product-card {
        background: var(--clr-white, #fff);
        border: 1.5px solid var(--clr-border, #dde1e7);
        border-radius: 10px;
        overflow: hidden;
        cursor: pointer;
        transition: border-color .18s, transform .18s, box-shadow .18s;
        display: flex;
        flex-direction: column;
      }

      .chat-product-card:hover {
        border-color: var(--clr-primary, #1a3a5c);
        transform: translateY(-2px);
        box-shadow: 0 4px 14px rgba(26,58,92,.13);
      }

      .chat-product-card:focus-visible {
        outline: 2px solid var(--clr-primary, #1a3a5c);
        outline-offset: 2px;
      }

      .chat-product-card__img {
        width: 100%;
        aspect-ratio: 1/1;
        background: #f0f4f8;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }

      .chat-product-card__img img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform .28s ease;
      }

      .chat-product-card:hover .chat-product-card__img img {
        transform: scale(1.06);
      }

      .chat-product-card__img-ph {
        font-size: 1.6rem;
        color: #bbb;
        align-items: center;
        justify-content: center;
      }

      .chat-product-card__body {
        padding: .45rem .55rem .5rem;
        flex: 1;
      }

      .chat-product-card__cat {
        font-size: .6rem;
        text-transform: uppercase;
        letter-spacing: .07em;
        color: var(--clr-muted, #6b7280);
        margin-bottom: .1rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .chat-product-card__name {
        font-size: .75rem;
        font-weight: 700;
        color: var(--clr-dark, #111827);
        line-height: 1.3;
        margin-bottom: .2rem;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .chat-product-card__price {
        font-size: .72rem;
        font-weight: 700;
        color: var(--clr-accent, #e63337);
      }

      /* Botones de acción del chat */
      .chat-actions-wrap {
        display: flex;
        flex-wrap: wrap;
        gap: .4rem;
        padding: .35rem 0 .1rem;
      }

      .chat-action-btn {
        display: inline-flex;
        align-items: center;
        gap: .35rem;
        background: var(--clr-primary, #1a3a5c);
        color: #fff;
        border: none;
        border-radius: 20px;
        padding: .35rem .8rem;
        font-size: .75rem;
        font-weight: 600;
        font-family: var(--font-base, sans-serif);
        cursor: pointer;
        transition: background .15s, transform .15s;
        white-space: nowrap;
      }

      .chat-action-btn:hover:not(:disabled) {
        background: var(--clr-accent, #e63337);
        transform: scale(1.03);
      }

      .chat-action-btn:disabled {
        opacity: .6;
        cursor: not-allowed;
        transform: none;
      }

      .chat-action-btn i { font-size: .72rem; }

      /* Mensaje del bot con tarjetas = sin fondo propio */
      .chat-msg--bot-cards {
        background: transparent !important;
        box-shadow: none !important;
        padding: 0 !important;
      }
    `;
    document.head.appendChild(style);
  }

  /* ── API pública ───────────────────────────── */
  return {

    open() {
      document.getElementById('chatPopup')?.classList.add('open');
      document.getElementById('chatOverlay')?.classList.add('open');
      document.querySelector('.whatsapp-float')?.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = '';
      setTimeout(() => document.getElementById('chatInput')?.focus(), 300);
      playWelcome();
    },

    close() {
      document.getElementById('chatPopup')?.classList.remove('open');
      document.getElementById('chatOverlay')?.classList.remove('open');
      document.querySelector('.whatsapp-float')?.setAttribute('aria-expanded', 'false');
    },

    toggle() {
      const popup = document.getElementById('chatPopup');
      if (!popup) return;
      popup.classList.contains('open') ? this.close() : this.open();
    },

    async sendMessage(forcedText) {
      const input   = document.getElementById('chatInput');
      const sendBtn = document.getElementById('chatSendBtn');
      const text    = forcedText || (input ? input.value.trim() : '');
      if (!text) return;

      // Mensaje del usuario
      addMessage({ text, type: 'user' });
      chatHistory.push({ role: 'user', content: text });

      if (input && !forcedText) {
        input.value = '';
        input.style.height = 'auto';
        if (sendBtn) sendBtn.disabled = true;
      }

      document.getElementById('chatSuggestions')?.remove();

      showTyping();

      try {
        const response = await fetch('api-chat.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: chatHistory }),
        });
        const data = await response.json();
        hideTyping();

        if (data.reply) {
          addMessage({ text: data.reply, type: 'bot' });
          chatHistory.push({ role: 'assistant', content: data.reply });
        }

        // Tarjetas de productos
        if (data.products && data.products.length) {
          addProductCards(data.products);
        }

        // Botones de acción
        if (data.actions && data.actions.length) {
          addActionButtons(data.actions);
        }

      } catch (error) {
        hideTyping();
        console.error('[ChatPopup]', error);
        addMessage({ text: 'Error de conexión con el servidor.', type: 'bot' });
      }
    },

    init,
  };

})();

/* ── Auto-init ─────────────────────────────── */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', ChatPopup.init.bind(ChatPopup));
} else {
  ChatPopup.init();
}