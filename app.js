/*****************************************************************
 * Alerte Fracarro Tunisie — logique de l'application
 *
 * IMPORTANT : remplacer API_URL par l'URL de déploiement de l'étape 1
 * (Déployer > Nouveau déploiement > Application Web > copier l'URL /exec)
 *****************************************************************/
const API_URL = 'https://script.google.com/macros/s/AKfycbykwNpmbtK0iXoQFjSY0XrU7ZB5D-uszYdxI2qVdwJioNedl10CMgMnLsg7EG-CYRrlDg/exec';

/* ------------------------- i18n ------------------------- */
const I18N = {
  fr: {
    dir: 'ltr',
    appsub: "Dispositif d'alerte interne",
    tabReport: 'Signaler', tabTrack: 'Suivre une alerte',
    s1title: 'Catégorie', s1hint: 'Choisissez le sujet le plus proche de votre signalement.',
    selectPh: '— Sélectionner —',
    s2title: 'Description',
    s2hint: 'Faits, dates, lieux, personnes impliquées si vous les connaissez. Restez factuel.',
    descPh: 'Décrivez la situation le plus précisément possible…',
    s3title: 'Pièces jointes', s3hint: 'Facultatif — photos ou PDF, 3 fichiers maximum, 5 Mo chacun.',
    fileZoneTxt: 'Toucher pour ajouter une photo ou un document',
    s4title: 'Votre identité',
    s4hint: "Obligatoire pour assurer le suivi. Elle reste strictement confidentielle et n'est jamais partagée avec vos collègues.",
    nameLabel: 'Nom et prénom', emailLabel: 'E-mail', phoneLabel: 'Téléphone',
    contactHint: 'E-mail ou téléphone : au moins l’un des deux.',
    consentTxt: "Je certifie agir de bonne foi. J'ai compris qu'aucune représaille n'est tolérée envers un lanceur d'alerte de bonne foi.",
    submitBtn: "Envoyer l'alerte",
    doneTitle: 'Alerte enregistrée',
    doneHint: 'Conservez précieusement votre référence et votre code : ils sont les seuls moyens de suivre votre alerte.',
    doneWarn: '⚠ Ce code ne sera plus jamais affiché',
    copyBtn: 'Copier la référence et le code',
    newAlertBtn: 'Signaler une autre alerte',
    trackTitle: 'Suivre mon alerte',
    trackHint: 'Saisissez la référence et le code reçus au moment du dépôt.',
    trackIdLabel: 'Référence', trackCodeLabel: 'Code de suivi', trackBtn: 'Vérifier',
    installTitle: "Installer l'application", installTxt: "Accès rapide depuis votre écran d'accueil",
    installBtn: 'Installer',
    footer: "Fracarro Tunisie · Vos données sont traitées de façon confidentielle,<br>conformément à la loi n°2004-63 et à la loi n°2018-35.",
    steps: ['Nouvelle', 'En analyse', 'En action', 'Clôturée'],
    stepRejected: 'Irrecevable',
    errors: {
      INVALID_CATEGORY: 'Merci de choisir une catégorie.',
      CONSENT_REQUIRED: 'Merci de cocher la case de bonne foi.',
      NAME_REQUIRED: 'Le nom et prénom sont obligatoires.',
      CONTACT_REQUIRED: 'Merci de renseigner un e-mail ou un numéro de téléphone.',
      INVALID_EMAIL: "Cette adresse e-mail n'est pas valide.",
      INVALID_PHONE: 'Le numéro de téléphone doit comporter 8 chiffres.',
      DESCRIPTION_TOO_SHORT: 'Merci de détailler un peu plus la description (20 caractères minimum).',
      TOO_MANY_FILES: 'Trois pièces jointes au maximum.',
      FILE_TYPE: 'Type de fichier non accepté (photo ou PDF uniquement).',
      FILE_TOO_BIG: 'Ce fichier dépasse 5 Mo.',
      RATE_LIMIT: 'Trop de tentatives. Merci de réessayer dans quelques minutes.',
      BUSY: 'Le serveur est occupé, merci de réessayer.',
      TRACK_INVALID: 'Référence ou code incorrect.',
      SERVER_ERROR: 'Une erreur est survenue. Merci de réessayer.',
      NETWORK: 'Connexion impossible. Vérifiez votre réseau et réessayez.',
      OFFLINE_QUEUED: "Pas de réseau : votre alerte est gardée sur votre téléphone. Rouvrez l'application une fois connecté : elle sera envoyée et votre référence et votre code s'afficheront."
    }
  },
  ar: {
    dir: 'rtl',
    appsub: 'نظام التبليغ الداخلي',
    tabReport: 'الإبلاغ', tabTrack: 'متابعة بلاغ',
    s1title: 'التصنيف', s1hint: 'اختر الموضوع الأقرب لبلاغك.',
    selectPh: '— اختر —',
    s2title: 'الوصف',
    s2hint: 'الوقائع والتواريخ والأماكن والأشخاص المعنيين إن وُجدوا. كن واقعيًا.',
    descPh: 'صف الحالة بأكبر قدر ممكن من الدقة…',
    s3title: 'المرفقات', s3hint: 'اختياري — صور أو PDF، 3 ملفات كحد أقصى، 5 ميغا لكل ملف.',
    fileZoneTxt: 'اضغط لإضافة صورة أو مستند',
    s4title: 'هويتك',
    s4hint: 'إلزامية لضمان المتابعة. تبقى سرية تمامًا ولا تُشارك أبدًا مع زملائك.',
    nameLabel: 'الاسم واللقب', emailLabel: 'البريد الإلكتروني', phoneLabel: 'الهاتف',
    contactHint: 'البريد الإلكتروني أو الهاتف: أحدهما على الأقل.',
    consentTxt: 'أؤكد أنني أتصرف بحسن نية. فهمت أنه لا يُسمح بأي انتقام تجاه المبلّغ بحسن نية.',
    submitBtn: 'إرسال البلاغ',
    doneTitle: 'تم تسجيل البلاغ',
    doneHint: 'احتفظ برقم المرجع والرمز جيدًا: هما الوسيلة الوحيدة لمتابعة بلاغك.',
    doneWarn: '⚠ لن يُعرض هذا الرمز مرة أخرى',
    copyBtn: 'نسخ المرجع والرمز',
    newAlertBtn: 'إبلاغ عن حالة أخرى',
    trackTitle: 'متابعة بلاغي',
    trackHint: 'أدخل المرجع والرمز اللذين تلقيتهما عند الإرسال.',
    trackIdLabel: 'المرجع', trackCodeLabel: 'رمز المتابعة', trackBtn: 'تحقق',
    installTitle: 'تثبيت التطبيق', installTxt: 'وصول سريع من شاشة هاتفك الرئيسية',
    installBtn: 'تثبيت',
    footer: 'Fracarro Tunisie · تُعامل بياناتك بسرية تامة،<br>وفقًا للقانون عدد 2004-63 والقانون عدد 2018-35.',
    steps: ['جديد', 'قيد الدراسة', 'قيد المعالجة', 'مغلق'],
    stepRejected: 'غير مقبول',
    errors: {
      INVALID_CATEGORY: 'الرجاء اختيار تصنيف.',
      CONSENT_REQUIRED: 'الرجاء تأكيد حسن النية.',
      NAME_REQUIRED: 'الاسم واللقب إلزاميان.',
      CONTACT_REQUIRED: 'الرجاء إدخال بريد إلكتروني أو رقم هاتف.',
      INVALID_EMAIL: 'هذا البريد الإلكتروني غير صالح.',
      INVALID_PHONE: 'يجب أن يتكون رقم الهاتف من 8 أرقام.',
      DESCRIPTION_TOO_SHORT: 'الرجاء تفصيل الوصف أكثر (20 حرفًا كحد أدنى).',
      TOO_MANY_FILES: '3 مرفقات كحد أقصى.',
      FILE_TYPE: 'نوع الملف غير مقبول (صورة أو PDF فقط).',
      FILE_TOO_BIG: 'هذا الملف يتجاوز 5 ميغا.',
      RATE_LIMIT: 'محاولات كثيرة جدًا. حاول مرة أخرى بعد قليل.',
      BUSY: 'الخادم مشغول، الرجاء إعادة المحاولة.',
      TRACK_INVALID: 'المرجع أو الرمز غير صحيح.',
      SERVER_ERROR: 'حدث خطأ. الرجاء إعادة المحاولة.',
      NETWORK: 'تعذّر الاتصال. تحقق من الشبكة وأعد المحاولة.',
      OFFLINE_QUEUED: 'لا يوجد اتصال: تم حفظ بلاغك على هاتفك. أعد فتح التطبيق عند توفر الاتصال: سيُرسل البلاغ ويظهر المرجع والرمز.'
    }
  }
};

let lang = 'fr';
let selectedFiles = [];
let lastResult = null;

/* ------------------------- Traduction ------------------------- */
function setLang(l) {
  lang = l;
  const t = I18N[l];
  document.documentElement.lang = l;
  document.documentElement.dir = t.dir;
  document.querySelectorAll('.langbtn').forEach(b => b.classList.toggle('active', b.dataset.lang === l));

  document.querySelectorAll('[data-i]').forEach(el => {
    const key = el.dataset.i;
    if (t[key] !== undefined) el.innerHTML = t[key];
  });
  document.querySelectorAll('[data-i-ph]').forEach(el => {
    const key = el.dataset.iPh;
    if (t[key] !== undefined) el.placeholder = t[key];
  });

  const sel = document.getElementById('category');
  const current = sel.value;
  sel.innerHTML = '<option value="">' + t.selectPh + '</option>';
  (window.__categories || []).forEach(c => {
    const o = document.createElement('option');
    o.value = c.code; o.textContent = l === 'ar' ? c.ar : c.fr;
    sel.appendChild(o);
  });
  sel.value = current;

  localStorage.setItem('alerte_lang', l);
}

function errMsg(code) {
  return (I18N[lang].errors[code]) || I18N[lang].errors.SERVER_ERROR;
}

/* ------------------------- Onglets ------------------------- */
function showTab(name) {
  document.getElementById('tabReport').classList.toggle('active', name === 'report');
  document.getElementById('tabTrack').classList.toggle('active', name === 'track');
  document.getElementById('panelReport').classList.toggle('active', name === 'report');
  document.getElementById('panelTrack').classList.toggle('active', name === 'track');
}

/* ------------------------- Chargement des catégories ------------------------- */
async function loadCategories() {
  try {
    const res = await fetch(API_URL + '?action=categories');
    const data = await res.json();
    if (data.ok) {
      window.__categories = data.categories;
      setLang(lang);
    }
  } catch (e) {
    // Hors ligne : réessaiera à la prochaine ouverture
  }
}

/* ------------------------- Pièces jointes ------------------------- */
const fileInput = document.getElementById('fileInput');
const filezone = document.getElementById('filezone');
fileInput.addEventListener('change', (e) => addFiles(e.target.files));
['dragover', 'dragleave', 'drop'].forEach(ev => {
  filezone.addEventListener(ev, (e) => {
    e.preventDefault();
    filezone.classList.toggle('drag', ev === 'dragover');
    if (ev === 'drop') addFiles(e.dataTransfer.files);
  });
});

function addFiles(list) {
  Array.from(list).forEach(f => {
    if (selectedFiles.length >= 3) return;
    selectedFiles.push(f);
  });
  renderFiles();
}

function renderFiles() {
  const box = document.getElementById('filelist');
  box.innerHTML = '';
  selectedFiles.forEach((f, i) => {
    const div = document.createElement('div');
    div.className = 'fileitem';
    const size = (f.size / 1024 / 1024).toFixed(1);
    div.innerHTML = '<span>' + escapeHtml(f.name) + ' · ' + size + ' Mo</span>';
    const btn = document.createElement('button');
    btn.textContent = '✕';
    btn.onclick = () => { selectedFiles.splice(i, 1); renderFiles(); };
    div.appendChild(btn);
    box.appendChild(div);
  });
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1]);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ------------------------- Compteur description ------------------------- */
const descEl = document.getElementById('description');
descEl.addEventListener('input', () => {
  document.getElementById('descCount').textContent = descEl.value.length;
});

/* ------------------------- Envoi ------------------------- */
async function submitAlert() {
  const errBox = document.getElementById('errReport');
  errBox.classList.remove('show');

  const payload = {
    action: 'submit',
    category: document.getElementById('category').value,
    description: descEl.value.trim(),
    name: document.getElementById('name').value.trim(),
    email: document.getElementById('email').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    lang: lang,
    consent: document.getElementById('consent').checked,
    website: document.getElementById('website').value, // piège anti-robot
    files: []
  };

  // Validation locale (évite un aller-retour réseau inutile)
  if (!payload.category) return showErr('INVALID_CATEGORY');
  if (payload.description.length < 20) return showErr('DESCRIPTION_TOO_SHORT');
  if (payload.name.length < 3) return showErr('NAME_REQUIRED');
  if (!payload.email && !payload.phone) return showErr('CONTACT_REQUIRED');
  if (payload.phone && !/^\d{8}$/.test(payload.phone)) return showErr('INVALID_PHONE');
  if (!payload.consent) return showErr('CONSENT_REQUIRED');

  const btn = document.getElementById('submitBtn');
  const txt = document.getElementById('submitTxt');
  btn.disabled = true;
  const oldTxt = txt.innerHTML;
  txt.innerHTML = '<span class="spinner"></span>';

  try {
    if (selectedFiles.length) {
      payload.files = await Promise.all(selectedFiles.map(async f => ({
        name: f.name, mimeType: f.type, dataBase64: await fileToBase64(f)
      })));
    }

    const data = await callApi(payload);

    if (data.ok) {
      showResult(data.id, data.code);
    } else {
      showErr(data.error);
    }
  } catch (e) {
    // Pas de réseau : mise en file d'attente locale
    queueOffline(payload);
  } finally {
    btn.disabled = false;
    txt.innerHTML = oldTxt;
  }
}

function showErr(code) {
  const box = document.getElementById('errReport');
  box.textContent = errMsg(code);
  box.className = 'notice err show';
  box.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function showResult(id, code) {
  lastResult = { id, code };
  document.getElementById('formZone').style.display = 'none';
  document.getElementById('resultZone').style.display = 'block';
  document.getElementById('resId').textContent = id;
  document.getElementById('resCode').textContent = code;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function copyResult() {
  if (!lastResult) return;
  const text = lastResult.id + ' / ' + lastResult.code;
  navigator.clipboard && navigator.clipboard.writeText(text);
}

function resetForm() {
  document.getElementById('formZone').style.display = 'block';
  document.getElementById('resultZone').style.display = 'none';
  document.getElementById('category').value = '';
  descEl.value = ''; document.getElementById('descCount').textContent = '0';
  document.getElementById('name').value = '';
  document.getElementById('email').value = '';
  document.getElementById('phone').value = '';
  document.getElementById('consent').checked = false;
  selectedFiles = []; renderFiles();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ------------------------- File d'attente hors ligne ------------------------- */
function queueOffline(payload) {
  const key = 'alerte_queue';
  const queue = JSON.parse(localStorage.getItem(key) || '[]');
  const localId = 'LOCAL-' + Date.now();
  // Les pièces jointes lourdes peuvent dépasser la mémoire locale : on les retire
  if (JSON.stringify(payload).length > 4000000) payload.files = [];
  queue.push({ localId, payload });
  localStorage.setItem(key, JSON.stringify(queue));
  showResult(lang === 'ar' ? 'في الانتظار' : 'En attente', '—');
  const notice = document.createElement('div');
  notice.className = 'notice info show';
  notice.textContent = errMsg('OFFLINE_QUEUED');
  document.getElementById('resultZone').querySelector('.card').prepend(notice);
}

async function flushQueue() {
  const key = 'alerte_queue';
  const queue = JSON.parse(localStorage.getItem(key) || '[]');
  if (!queue.length) return;
  const remaining = [];
  for (const item of queue) {
    try {
      const data = await callApi(item.payload);
      if (data.ok) {
        // L'employé n'a pas encore vu sa vraie référence : on l'affiche maintenant
        showResult(data.id, data.code);
      } else if (data.error === 'RATE_LIMIT' || data.error === 'BUSY' || data.error === 'SERVER_ERROR') {
        remaining.push(item);
      }
    } catch (e) {
      remaining.push(item);
    }
  }
  localStorage.setItem(key, JSON.stringify(remaining));
}
window.addEventListener('online', flushQueue);

/* ------------------------- Appel API générique ------------------------- */
function callApi(payload) {
  // text/plain évite le pré-vol CORS (OPTIONS), non géré par Apps Script
  return fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  }).then(r => r.json());
}

/* ------------------------- Suivi ------------------------- */
async function trackAlert() {
  const errBox = document.getElementById('errTrack');
  errBox.classList.remove('show');
  const id = document.getElementById('trackId').value.trim().toUpperCase();
  const code = document.getElementById('trackCode').value.trim().toUpperCase();
  if (!id || !code) { errBox.textContent = errMsg('TRACK_INVALID'); errBox.classList.add('show'); return; }

  const btn = document.getElementById('trackBtn');
  btn.disabled = true;
  try {
    const data = await callApi({ action: 'track', id, code });
    if (!data.ok) {
      errBox.textContent = errMsg(data.error);
      errBox.classList.add('show');
      document.getElementById('trackResult').style.display = 'none';
      return;
    }
    renderTrack(data);
  } catch (e) {
    errBox.textContent = errMsg('NETWORK');
    errBox.classList.add('show');
  } finally {
    btn.disabled = false;
  }
}

function renderTrack(data) {
  const t = I18N[lang];
  const box = document.getElementById('trackResult');
  box.style.display = 'block';
  const steps = t.steps; // Nouvelle / En analyse / En action / Clôturée
  const order = ['NEW', 'REVIEW', 'ACTION', 'CLOSED'];
  const title = document.getElementById('trackStatusTitle');
  const line = document.getElementById('trackTimeline');
  line.innerHTML = '';

  if (data.statut === 'REJECTED') {
    title.textContent = t.stepRejected;
    line.innerHTML = '<div class="tstep rejected done"><div class="c"></div><span>' + t.stepRejected + '</span></div>';
  } else {
    const idx = order.indexOf(data.statut);
    title.textContent = steps[idx] || steps[0];
    order.forEach((code, i) => {
      const div = document.createElement('div');
      div.className = 'tstep' + (i < idx ? ' done' : '') + (i === idx ? ' now' : '');
      div.innerHTML = '<div class="c"></div><span>' + steps[i] + '</span>';
      line.appendChild(div);
    });
  }

  const meta = document.getElementById('trackMeta');
  const dEpot = data.depot ? new Date(data.depot).toLocaleDateString(lang === 'ar' ? 'ar-TN' : 'fr-TN') : '—';
  const dMaj = data.maj ? new Date(data.maj).toLocaleDateString(lang === 'ar' ? 'ar-TN' : 'fr-TN') : '—';
  meta.textContent = (lang === 'ar'
    ? ('تاريخ الإيداع: ' + dEpot + ' · آخر تحديث: ' + dMaj)
    : ('Dépôt : ' + dEpot + ' · Dernière mise à jour : ' + dMaj));
}

/* ------------------------- Installation PWA ------------------------- */
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (!localStorage.getItem('alerte_install_dismissed')) {
    document.getElementById('installbar').classList.add('show');
  }
});
document.getElementById('installBtn').addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  document.getElementById('installbar').classList.remove('show');
});
function dismissInstall() {
  document.getElementById('installbar').classList.remove('show');
  localStorage.setItem('alerte_install_dismissed', '1');
}
// iOS Safari n'a pas beforeinstallprompt : on affiche une bannière générique
(function iosInstallHint() {
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone = window.navigator.standalone === true;
  if (isIos && !isStandalone && !localStorage.getItem('alerte_install_dismissed')) {
    const bar = document.getElementById('installbar');
    document.getElementById('installBtn').style.display = 'none';
    bar.classList.add('show');
  }
})();

/* ------------------------- Service worker ------------------------- */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js'));
}

/* ------------------------- Initialisation ------------------------- */
(function init() {
  const saved = localStorage.getItem('alerte_lang');
  if (saved) lang = saved;
  loadCategories();
  setLang(lang);
  flushQueue();
})();
