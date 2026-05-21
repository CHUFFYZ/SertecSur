'use strict';
let chatHistory = [];
/* ================================================
   CHAT POPUP WIDGET
   chat-popup.js — incluir ANTES del cierre </body>
   Requiere: chat-popup.css cargado en el <head>
================================================ */

const ChatPopup = (() => {

  /* ── Mensajes iniciales del bot ────────────── */
  const WELCOME_MESSAGES = [
    {
      text: '¡Hola! 👋 Soy el asistente virtual de <strong>SERTECSUR</strong>.',
      delay: 0
    },
    {
      text: '¿En qué puedo ayudarte hoy? Puedo orientarte sobre nuestros productos, servicios o cotizaciones.',
      delay: 900
    }
  ];

  /* ── Sugerencias rápidas ───────────────────── */
  const SUGGESTIONS = [
    'Cotizar cámaras CCTV',
    'Sistemas de alarma',
    'Redes Wi-Fi',
    'Hablar con un asesor',
  ];

  /* ── Hora actual formateada ────────────────── */
  function now() {
    return new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  }

  /* ── Construye el HTML del widget ─────────── */
  function buildHTML() {
    return `
      <!-- Overlay -->
      <div class="chat-overlay" id="chatOverlay" onclick="ChatPopup.close()"></div>

      <!-- Popup -->
      <div class="chat-popup" id="chatPopup" role="dialog" aria-modal="true" aria-label="Chat de soporte SERTECSUR">

        <!-- Header -->
        <div class="chat-popup__header">
          <div class="chat-popup__avatar">
            <img
              src="img/SVG/logo.svg"
              alt="SERTECSUR"
              onerror="this.parentNode.innerHTML='<i class=\\'fa-solid fa-headset\\'></i>'"
            />
          </div>
          <div class="chat-popup__header-info">
            <p class="chat-popup__name">Asistente SERTECSUR</p>
            <p class="chat-popup__status">
              <span class="chat-popup__status-dot"></span>
              En línea ahora
            </p>
          </div>
          <button class="chat-popup__close" onclick="ChatPopup.close()" aria-label="Cerrar chat">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <!-- Mensajes -->
        <div class="chat-popup__body" id="chatBody"></div>

        <!-- Input -->
        <div class="chat-popup__footer">
          <textarea
            id="chatInput"
            class="chat-popup__input"
            placeholder="Escribe tu mensaje…"
            rows="1"
            aria-label="Escribe tu mensaje"
          ></textarea>
          <button
            id="chatSendBtn"
            class="chat-popup__send"
            onclick="ChatPopup.sendMessage()"
            aria-label="Enviar mensaje"
            disabled
          >
            <i class="fa-solid fa-paper-plane"></i>
          </button>
        </div>

      </div>
    `;
  }

  /* ── Agrega una burbuja de mensaje ─────────── */
  function addMessage({ text, type = 'bot', showTime = true }) {
    const body   = document.getElementById('chatBody');
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

  /* ── Indicador "escribiendo..." ────────────── */
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
    const el = document.getElementById('chatTyping');
    if (el) el.remove();
  }

  /* ── Sugerencias rápidas ───────────────────── */
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
      btn.onclick = () => {
        wrap.remove();
        ChatPopup.sendMessage(text);
      };
      wrap.appendChild(btn);
    });

    body.appendChild(wrap);
    body.scrollTop = body.scrollHeight;
  }

  /* ── Muestra el saludo inicial ─────────────── */
  let welcomeDone = false;

  function playWelcome() {
    if (welcomeDone) return;
    welcomeDone = true;

    const typing = showTyping();

    WELCOME_MESSAGES.forEach(({ text, delay }, i) => {
      setTimeout(() => {
        if (i === 0) hideTyping();
        addMessage({ text, type: 'bot' });

        if (i < WELCOME_MESSAGES.length - 1) showTyping();

        if (i === WELCOME_MESSAGES.length - 1) {
          setTimeout(renderSuggestions, 400);
        }
      }, delay + 600);
    });
  }

  /* ── Ajusta altura del textarea ────────────── */
  function autoResize(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 100) + 'px';
  }

  /* ── Inicializa el widget ───────────────────── */
  function init() {
    // Inyectar HTML del popup
    const container = document.createElement('div');
    container.innerHTML = buildHTML();
    document.body.appendChild(container);

    // Reemplaza el botón flotante original por uno que abre el popup
    const oldBtn = document.querySelector('.whatsapp-float');
    if (oldBtn) {
      oldBtn.removeAttribute('href');
      oldBtn.setAttribute('role', 'button');
      oldBtn.setAttribute('aria-haspopup', 'dialog');
      oldBtn.setAttribute('aria-expanded', 'false');
      oldBtn.onclick = (e) => { e.preventDefault(); ChatPopup.toggle(); };

      // Punto verde de "online"
      const dot = document.createElement('span');
      dot.className = 'whatsapp-float__dot';
      oldBtn.style.position = 'relative';
      oldBtn.appendChild(dot);
    }

    // Input: habilitar botón enviar y autoResize
    const input = document.getElementById('chatInput');
    const sendBtn = document.getElementById('chatSendBtn');

    if (input) {
      input.addEventListener('input', () => {
        autoResize(input);
        if (sendBtn) sendBtn.disabled = input.value.trim() === '';
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          ChatPopup.sendMessage();
        }
      });
    }

    // Cerrar con Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') ChatPopup.close();
    });
  }

  /* ── API pública ───────────────────────────── */
  return {

    open() {
      const popup   = document.getElementById('chatPopup');
      const overlay = document.getElementById('chatOverlay');
      const floatBtn = document.querySelector('.whatsapp-float');

      if (popup)   popup.classList.add('open');
      if (overlay) overlay.classList.add('open');
      if (floatBtn) floatBtn.setAttribute('aria-expanded', 'true');

      document.body.style.overflow = '';

      setTimeout(() => {
        const input = document.getElementById('chatInput');
        if (input) input.focus();
      }, 300);

      playWelcome();
    },

    close() {
      const popup   = document.getElementById('chatPopup');
      const overlay = document.getElementById('chatOverlay');
      const floatBtn = document.querySelector('.whatsapp-float');

      if (popup)   popup.classList.remove('open');
      if (overlay) overlay.classList.remove('open');
      if (floatBtn) floatBtn.setAttribute('aria-expanded', 'false');
    },

    toggle() {
      const popup = document.getElementById('chatPopup');
      if (!popup) return;
      popup.classList.contains('open') ? this.close() : this.open();
    },

    async sendMessage(forcedText) {
  const input  = document.getElementById('chatInput');
  const sendBtn = document.getElementById('chatSendBtn');
  const text   = forcedText || (input ? input.value.trim() : '');

  if (!text) return;

  // 1. Mostrar mensaje del usuario y guardar en historial
  addMessage({ text, type: 'user' });
  chatHistory.push({ role: 'user', content: text });

  if (input && !forcedText) {
    input.value = '';
    input.style.height = 'auto';
    if (sendBtn) sendBtn.disabled = true;
  }

  const sug = document.getElementById('chatSuggestions');
  if (sug) sug.remove();

  // 2. Mostrar "escribiendo..."
  const typing = showTyping();

  try {
    // Dentro de sendMessage()
  const response = await fetch('api-chat.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: chatHistory })
  });
    const data = await response.json();
    hideTyping();

    if (data.reply) {
      addMessage({ text: data.reply, type: 'bot' });
      // Guardar respuesta del bot para mantener el contexto
      chatHistory.push({ role: 'assistant', content: data.reply });
    } else {
      addMessage({ text: 'No pude obtener respuesta del asistente.', type: 'bot' });
    }
  } catch (error) {
    hideTyping();
    console.error(error);
    addMessage({ text: 'Error de conexión con el servidor.', type: 'bot' });
  }
},

    init
  };

})();

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', ChatPopup.init.bind(ChatPopup));
} else {
  ChatPopup.init();
}
