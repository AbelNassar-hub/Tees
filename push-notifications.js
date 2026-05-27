// ============================================================
// PUSH NOTIFICATIONS — 3DROP (version corrigée)
// ============================================================

const VAPID_KEY = "BH8zCrccBBMZxxmKx_GqOIFWUfNiEDPccvwqfWctFVkswPcIBH7pssr-t3_FAGcGYYiofaU6-XRWR28Rpaqnw5E";

let messaging = null;

// ============================================================
//Enregistrer le Service Worker en premier
// ============================================================
async function registerSW() {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker non supporté');
    return null;
  }
  try {
    const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    // Attendre que le SW soit actif
    await navigator.serviceWorker.ready;
    console.log('[SW] Service Worker actif :', reg.scope);
    return reg;
  } catch (err) {
    console.error('[SW] Erreur enregistrement:', err);
    return null;
  }
}

// ============================================================
// Initialiser Firebase Messaging
// ============================================================
async function initMessaging(swReg) {
  try {
    const { initializeApp, getApps } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
    const { getMessaging, getToken, onMessage } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js');

    const app = getApps().length === 0
      ? initializeApp(FIREBASE_CONFIG)
      : getApps()[0];

    messaging = getMessaging(app);

    // Écouter les messages quand l'app est ouverte
    onMessage(messaging, (payload) => {
      console.log('[Push] Message reçu:', payload);
      showInAppNotification(payload);
    });

    // Obtenir le token FCM
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swReg
    });

    return token;
  } catch (err) {
    console.error('[Push] Erreur initMessaging:', err);
    return null;
  }
}

// ============================================================
// FONCTION PRINCIPALE : abonner l'utilisateur
// ============================================================
async function subscribeToPush() {
  if (!('Notification' in window)) {
    alert('Votre navigateur ne supporte pas les notifications.');
    return null;
  }

  // Demander la permission
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    console.log('[Push] Permission refusée');
    return null;
  }

  // Enregistrer le Service Worker
  const swReg = await registerSW();
  if (!swReg) return null;

  // Obtenir le token
  const token = await initMessaging(swReg);
  if (!token) return null;

  console.log('[Push] Token :', token);
  await saveTokenToFirestore(token);
  return token;
}

// ============================================================
// SAUVEGARDER LE TOKEN
// ============================================================
async function saveTokenToFirestore(token) {
  try {
    const existing = await fbGet('push_tokens', token);
    if (!existing) {
      await fbSet('push_tokens', token, {
        token: token,
        createdAt: new Date().toISOString(),
        platform: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
        page: window.location.pathname
      });
      console.log('[Push] Token sauvegardé dans Firestore ✅');
    } else {
      console.log('[Push] Token déjà enregistré');
    }
  } catch (err) {
    console.error('[Push] Erreur sauvegarde:', err);
  }
}

// ============================================================
// NOTIFICATION IN-APP (site ouvert)
// ============================================================
function showInAppNotification(payload) {
  const { title, body, icon } = payload.notification || {};
  const toast = document.createElement('div');
  toast.style.cssText = `
    position:fixed;bottom:24px;right:24px;
    background:#1a1a1a;border:1px solid rgba(216,90,48,0.4);
    border-radius:12px;padding:16px 20px;
    display:flex;align-items:center;gap:14px;
    max-width:340px;z-index:9999;
    box-shadow:0 8px 32px rgba(0,0,0,0.4);
    animation:slideInRight .4s ease;cursor:pointer;
  `;
  toast.innerHTML = `
    <div style="font-size:28px;">🔔</div>
    <div>
      <div style="font-size:14px;font-weight:600;color:#fff;margin-bottom:4px;">${title || '3DROP'}</div>
      <div style="font-size:13px;color:#888;line-height:1.4;">${body || ''}</div>
    </div>
    <button onclick="this.parentElement.remove()"
      style="background:none;border:none;color:#555;font-size:18px;cursor:pointer;margin-left:auto;">✕</button>
  `;
  if (!document.getElementById('push-anim-style')) {
    const s = document.createElement('style');
    s.id = 'push-anim-style';
    s.textContent = `@keyframes slideInRight{from{opacity:0;transform:translateX(40px);}to{opacity:1;transform:translateX(0);}}`;
    document.head.appendChild(s);
  }
  document.body.appendChild(toast);
  const url = payload.data?.url;
  if (url) toast.addEventListener('click', () => window.location.href = url);
  setTimeout(() => toast.remove(), 6000);
}

// ============================================================
// BOUTON D'ACTIVATION
// ============================================================
async function activerNotifications() {
  const btns = ['btn-notif-nav', 'btn-notif-hero', 'btn-notif-sticky'];
  btns.forEach(id => {
    const b = document.getElementById(id);
    if (b) { b.textContent = '⏳ Activation...'; b.disabled = true; }
  });

  const token = await subscribeToPush();

  if (token) {
    btns.forEach(id => {
      const b = document.getElementById(id);
      if (b) {
        b.textContent = '✅ Notifications activées';
        b.style.background = 'rgba(61,184,135,0.15)';
        b.style.borderColor = 'rgba(61,184,135,0.4)';
        b.style.color = '#3DB887';
      }
    });
    const toast = document.getElementById('notif-toast');
    if (toast) toast.style.display = 'none';
    const sticky = document.getElementById('notif-sticky');
    if (sticky) sticky.style.display = 'none';
  } else {
    btns.forEach(id => {
      const b = document.getElementById(id);
      if (b) { b.disabled = false; }
    });
    const nb = document.getElementById('btn-notif-nav');
    if (nb) nb.textContent = '🔔 Notifs';
    const hb = document.getElementById('btn-notif-hero');
    if (hb) hb.textContent = '🔔 Recevoir nos offres & nouveautés';
    const sb = document.getElementById('btn-notif-sticky');
    if (sb) sb.textContent = '🔔 Activer les notifications';
  }
}