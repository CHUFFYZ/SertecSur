'use strict';

const Registro = (() => {

  let _usuarioId   = null;
  let _via         = 'email';
  let _timerInt    = null;
  let _segundos    = 900;
  let _resendCooldown = false;

  /* ── Utilidades ──────────────────────────── */
  function showAlert(containerId, msg, type = 'error') {
    const el = document.getElementById(containerId);
    if (!el) return;
    const icons = { error: 'fa-circle-xmark', success: 'fa-circle-check', info: 'fa-circle-info' };
    el.className = `reg-alert reg-alert--${type}`;
    el.innerHTML = `<i class="fa-solid ${icons[type] || icons.error}"></i><span>${msg}</span>`;
    el.style.display = 'flex';
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function hideAlert(containerId) {
    const el = document.getElementById(containerId);
    if (el) el.style.display = 'none';
  }

  function setLoading(btnId, loading, originalHTML) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.disabled = loading;
    btn.innerHTML = loading
      ? '<i class="fa-solid fa-spinner fa-spin"></i> Procesando…'
      : originalHTML;
  }

  function irAlPaso(paso) {
    document.querySelectorAll('.reg-step').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(paso);
    if (el) el.classList.add('active');
  }

  /* ── Fortaleza de contraseña ─────────────── */
  function evalPass(val) {
    let score = 0;
    if (val.length >= 8)                       score++;
    if (val.length >= 12)                      score++;
    if (/[A-Z]/.test(val))                     score++;
    if (/[0-9]/.test(val))                     score++;
    if (/[^A-Za-z0-9]/.test(val))             score++;

    const fill  = document.getElementById('regStrengthFill');
    const label = document.getElementById('regStrengthLabel');
    if (!fill || !label) return;

    const levels = [
      { pct: '20%', color: '#ef4444', text: 'Muy débil' },
      { pct: '40%', color: '#f97316', text: 'Débil'     },
      { pct: '60%', color: '#eab308', text: 'Regular'   },
      { pct: '80%', color: '#22c55e', text: 'Fuerte'    },
      { pct:'100%', color: '#15803d', text: 'Muy fuerte'},
    ];

    const lvl = levels[Math.min(score, 4)];
    fill.style.width      = val ? lvl.pct   : '0%';
    fill.style.background = val ? lvl.color : 'transparent';
    label.textContent     = val ? lvl.text  : '';
    label.style.color     = val ? lvl.color : '';
  }

  function togglePass(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const isPass = input.type === 'password';
    input.type = isPass ? 'text' : 'password';
    const icon = btn.querySelector('i');
    if (icon) icon.className = isPass ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
  }

  function onViaChange(radio) {
    _via = radio.value;
    const hint = document.getElementById('regViaHint');
    if (hint) hint.style.display = _via === 'whatsapp' ? 'flex' : 'none';
  }

  /* ── OTP inputs ──────────────────────────── */
  function initOTPInputs(containerId) {
    const wrap   = document.getElementById(containerId);
    if (!wrap) return;
    const cells  = [...wrap.querySelectorAll('.otp-cell')];

    cells.forEach((cell, i) => {
      cell.value = '';
      cell.classList.remove('filled', 'error');

      cell.addEventListener('keydown', e => {
        if (e.key === 'Backspace') {
          e.preventDefault();
          if (cell.value) {
            cell.value = '';
            cell.classList.remove('filled');
          } else if (i > 0) {
            cells[i - 1].focus();
            cells[i - 1].value = '';
            cells[i - 1].classList.remove('filled');
          }
          checkOTPComplete(containerId);
        }
        if (e.key === 'ArrowLeft'  && i > 0)              cells[i - 1].focus();
        if (e.key === 'ArrowRight' && i < cells.length - 1) cells[i + 1].focus();
      });

      cell.addEventListener('input', e => {
        const val = e.target.value.replace(/\D/g, '').slice(-1);
        cell.value = val;
        if (val) {
          cell.classList.add('filled');
          if (i < cells.length - 1) cells[i + 1].focus();
        } else {
          cell.classList.remove('filled');
        }
        checkOTPComplete(containerId);
      });

      cell.addEventListener('paste', e => {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData)
          .getData('text').replace(/\D/g, '').slice(0, 6);
        text.split('').forEach((ch, j) => {
          if (cells[j]) {
            cells[j].value = ch;
            cells[j].classList.add('filled');
          }
        });
        const nextEmpty = cells.findIndex(c => !c.value);
        (cells[nextEmpty] || cells[cells.length - 1]).focus();
        checkOTPComplete(containerId);
      });

      cell.addEventListener('focus', () => cell.select());
    });
  }

  function getOTPValue(containerId) {
    const wrap  = document.getElementById(containerId);
    if (!wrap) return '';
    return [...wrap.querySelectorAll('.otp-cell')]
      .map(c => c.value)
      .join('');
  }

  function checkOTPComplete(containerId) {
    const code = getOTPValue(containerId);
    if (containerId === 'otpInputs') {
      const btn = document.getElementById('otpVerifyBtn');
      if (btn) btn.disabled = code.length < 6;
    }
  }

  function markOTPError(containerId) {
    const wrap = document.getElementById(containerId);
    if (!wrap) return;
    wrap.querySelectorAll('.otp-cell').forEach(c => {
      c.classList.add('error');
      c.classList.remove('filled');
      setTimeout(() => c.classList.remove('error'), 600);
    });
  }

  function clearOTPInputs(containerId) {
    const wrap = document.getElementById(containerId);
    if (!wrap) return;
    wrap.querySelectorAll('.otp-cell').forEach(c => {
      c.value = '';
      c.classList.remove('filled', 'error');
    });
    const first = wrap.querySelector('.otp-cell');
    if (first) first.focus();
  }

  /* ── Timer ───────────────────────────────── */
  function startTimer() {
    _segundos = 900;
    clearInterval(_timerInt);
    const el   = document.getElementById('otpTimer');
    const wrap = document.getElementById('otpTimerWrap');

    _timerInt = setInterval(() => {
      _segundos--;
      if (!el) { clearInterval(_timerInt); return; }
      const m = String(Math.floor(_segundos / 60)).padStart(2, '0');
      const s = String(_segundos % 60).padStart(2, '0');
      el.textContent = `${m}:${s}`;
      if (_segundos <= 60 && wrap) wrap.classList.add('expiring');
      if (_segundos <= 0) {
        clearInterval(_timerInt);
        el.textContent = '00:00';
        showAlert('otpAlert', 'El código ha expirado. Solicita uno nuevo.', 'error');
        const verifyBtn = document.getElementById('otpVerifyBtn');
        if (verifyBtn) verifyBtn.disabled = true;
      }
    }, 1000);
  }

  /* ── ENVIAR REGISTRO ─────────────────────── */
  async function enviar() {
    hideAlert('regAlert');

    const nombre   = document.getElementById('reg-nombre')?.value.trim();
    const correo   = document.getElementById('reg-correo')?.value.trim();
    const telefono = document.getElementById('reg-telefono')?.value.trim();
    const pass     = document.getElementById('reg-pass')?.value;
    const pass2    = document.getElementById('reg-pass2')?.value;
    const via      = document.querySelector('input[name="reg-via"]:checked')?.value || 'email';

    if (!nombre || !correo || !pass) {
      showAlert('regAlert', 'Completa todos los campos requeridos (*).', 'error');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      showAlert('regAlert', 'El correo electrónico no es válido.', 'error');
      return;
    }

    if (pass.length < 8) {
      showAlert('regAlert', 'La contraseña debe tener al menos 8 caracteres.', 'error');
      return;
    }

    if (pass !== pass2) {
      showAlert('regAlert', 'Las contraseñas no coinciden.', 'error');
      document.getElementById('reg-pass2')?.classList.add('error');
      return;
    }

    if (via === 'whatsapp' && !telefono) {
      showAlert('regAlert', 'Ingresa tu teléfono para verificar por WhatsApp.', 'error');
      return;
    }

    setLoading('regSubmitBtn', true);

    try {
      const res = await fetch('registro.php', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ nombre, correo, telefono, password: pass, via }),
      });

      const data = await res.json();

      if (!data.ok) {
        showAlert('regAlert', data.error || 'Error al registrar.', 'error');
        return;
      }

      _usuarioId = data.data.usuario_id;
      _via       = data.data.via;

      mostrarPasoOTP(_via, correo, telefono, data.data);

    } catch {
      showAlert('regAlert', 'Error de conexión. Intenta de nuevo.', 'error');
    } finally {
      setLoading('regSubmitBtn', false, '<i class="fa-solid fa-user-plus"></i> Crear cuenta');
    }
  }

  function mostrarPasoOTP(via, correo, telefono, serverData) {
    const icon     = document.getElementById('otpIcon');
    const iconWrap = document.getElementById('otpIconWrap');
    const subtitle = document.getElementById('otpSubtitle');

    if (via === 'whatsapp') {
      if (icon)     { icon.className = 'fa-brands fa-whatsapp otp-icon'; icon.style.color = '#22c55e'; }
      if (iconWrap) iconWrap.style.borderColor = '#22c55e';
      if (subtitle) subtitle.textContent = `Código enviado a tu WhatsApp (${telefono || ''})`;

      if (serverData?.url) {
        setTimeout(() => {
          showAlert('otpAlert',
            `<a href="${serverData.url}" target="_blank" rel="noopener" style="color:inherit;text-decoration:underline;font-weight:700;">
              <i class="fa-brands fa-whatsapp"></i> Abrir WhatsApp para ver el código
            </a>`, 'info');
        }, 400);
      }
    } else {
      if (icon)     { icon.className = 'fa-solid fa-envelope otp-icon'; icon.style.color = ''; }
      if (iconWrap) iconWrap.style.borderColor = '';
      if (subtitle) subtitle.textContent = `Código enviado a ${correo}`;
    }

    irAlPaso('stepOTP');
    initOTPInputs('otpInputs');
    startTimer();
    setTimeout(() => document.querySelector('#otpInputs .otp-cell')?.focus(), 100);
  }

  /* ── VERIFICAR OTP ───────────────────────── */
  async function verificar() {
    hideAlert('otpAlert');

    const codigo = getOTPValue('otpInputs');

    if (codigo.length < 6) {
      showAlert('otpAlert', 'Ingresa los 6 dígitos del código.', 'error');
      return;
    }

    setLoading('otpVerifyBtn', true);

    try {
      const res = await fetch('verificar.php?action=verificar-otp', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ codigo, usuario_id: _usuarioId }),
      });

      const data = await res.json();

      if (!data.ok) {
        markOTPError('otpInputs');
        clearOTPInputs('otpInputs');
        showAlert('otpAlert', data.error || 'Código incorrecto.', 'error');
        return;
      }

      clearInterval(_timerInt);

      if (typeof Session !== 'undefined' && Session.check) {
        await Session.check();
        if (Session.user?.rol === 'cliente' && typeof Cart !== 'undefined') {
          await Cart.load();
        }
      }

      const sub = document.getElementById('exitoSub');
      if (sub) sub.textContent = data.data?.mensaje || '¡Bienvenido a SERTECSUR!';

      irAlPaso('stepExito');

    } catch {
      showAlert('otpAlert', 'Error de conexión. Intenta de nuevo.', 'error');
    } finally {
      setLoading('otpVerifyBtn', false, '<i class="fa-solid fa-shield-check"></i> Verificar código');
    }
  }

  /* ── REENVIAR OTP ────────────────────────── */
  async function reenviar() {
    if (_resendCooldown) {
      showAlert('otpAlert', 'Espera un momento antes de reenviar.', 'info');
      return;
    }

    hideAlert('otpAlert');
    const btn = document.getElementById('otpResendBtn');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Reenviando…'; }

    try {
      const res = await fetch('verificar.php?action=reenviar-otp', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ usuario_id: _usuarioId }),
      });

      const data = await res.json();

      if (!data.ok) {
        showAlert('otpAlert', data.error || 'Error al reenviar.', 'error');
        return;
      }

      clearOTPInputs('otpInputs');
      startTimer();
      showAlert('otpAlert', data.data?.mensaje || 'Código reenviado.', 'success');

      _resendCooldown = true;
      setTimeout(() => { _resendCooldown = false; }, 60000);

    } catch {
      showAlert('otpAlert', 'Error de conexión.', 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-rotate-right"></i> Reenviar código';
      }
    }
  }

  /* ── RESET — SOLICITAR ───────────────────── */
  async function resetSolicitar() {
    hideAlert('resetAlert');
    const correo = document.getElementById('reset-correo')?.value.trim();

    if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      showAlert('resetAlert', 'Ingresa un correo válido.', 'error');
      return;
    }

    const btn = document.querySelector('#resetStep1 .reg-btn');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Enviando…'; }

    try {
      const res = await fetch('verificar.php?action=reset-solicitar', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ correo }),
      });

      const data = await res.json();

      if (!data.ok) {
        showAlert('resetAlert', data.error || 'Error al enviar.', 'error');
        return;
      }

      const sub = document.getElementById('resetSubtitle');
      if (sub) sub.textContent = 'Ingresa el código y tu nueva contraseña';

      document.getElementById('resetStep1').style.display = 'none';
      document.getElementById('resetStep2').style.display = 'block';

      initOTPInputs('resetOtpInputs');
      setTimeout(() => document.querySelector('#resetOtpInputs .otp-cell')?.focus(), 100);

    } catch {
      showAlert('resetAlert', 'Error de conexión.', 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Enviar código';
      }
    }
  }

  /* ── RESET — VERIFICAR ───────────────────── */
  async function resetVerificar() {
    hideAlert('resetAlert');

    const codigo    = getOTPValue('resetOtpInputs');
    const nuevaPass = document.getElementById('reset-pass')?.value.trim();

    if (codigo.length < 6) {
      showAlert('resetAlert', 'Ingresa los 6 dígitos del código.', 'error');
      return;
    }

    if (!nuevaPass || nuevaPass.length < 8) {
      showAlert('resetAlert', 'La nueva contraseña debe tener al menos 8 caracteres.', 'error');
      return;
    }

    const btn = document.querySelector('#resetStep2 .reg-btn');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Cambiando…'; }

    try {
      const res = await fetch('verificar.php?action=reset-verificar', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ codigo, nueva_pass: nuevaPass }),
      });

      const data = await res.json();

      if (!data.ok) {
        markOTPError('resetOtpInputs');
        clearOTPInputs('resetOtpInputs');
        showAlert('resetAlert', data.error || 'Código incorrecto.', 'error');
        return;
      }

      cerrarReset();
      if (typeof showToast !== 'undefined') {
        showToast('Contraseña actualizada. Ya puedes iniciar sesión.', 'success');
      }
      if (typeof showView !== 'undefined') showView('login');

    } catch {
      showAlert('resetAlert', 'Error de conexión.', 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-shield-check"></i> Cambiar contraseña';
      }
    }
  }

  /* ── MODAL RESET ─────────────────────────── */
  function abrirReset() {
    const overlay = document.getElementById('resetOverlay');
    if (overlay) {
      overlay.style.display = 'flex';
      setTimeout(() => document.getElementById('reset-correo')?.focus(), 100);
    }
  }

  function cerrarReset() {
    const overlay = document.getElementById('resetOverlay');
    if (overlay) overlay.style.display = 'none';
    document.getElementById('resetStep1').style.display = 'block';
    document.getElementById('resetStep2').style.display = 'none';
    hideAlert('resetAlert');
    clearOTPInputs('resetOtpInputs');
    const correoInput = document.getElementById('reset-correo');
    if (correoInput) correoInput.value = '';
  }

  function volverAlFormulario() {
    clearInterval(_timerInt);
    irAlPaso('stepRegistro');
    hideAlert('regAlert');
  }

  /* ── API pública ─────────────────────────── */
  return {
    enviar,
    verificar,
    reenviar,
    resetSolicitar,
    resetVerificar,
    abrirReset,
    cerrarReset,
    volverAlFormulario,
    evalPass,
    togglePass,
    onViaChange,
  };

})();
