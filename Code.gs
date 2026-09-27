/*****************************************************************
 * ESPACE RÉFÉRENTS – DISPOSITIF D'ALERTE FRACARRO TUNISIE
 * Fichier : Code.gs  (projet Apps Script AUTONOME, distinct de l'API)
 *
 * Déploiement : Exécuter en tant que = Moi (Ali KHNISSI)
 *               Accès = Tous les utilisateurs de fracarro.com
 *
 * Règle d'accès :
 *  - un référent ne voit que les alertes dont il est le référent ;
 *  - les administrateurs (ADMINS) voient tout et peuvent réaffecter.
 * Toutes les consultations sensibles sont tracées dans JOURNAL.
 *****************************************************************/

const CFG = {
  TZ: 'Africa/Tunis',
  STATUTS: ['Nouvelle', 'En analyse', 'En action', 'Clôturée', 'Irrecevable'],
  FINAUX: ['Clôturée', 'Irrecevable'],
  CONCLUSIONS: ['Fondée', 'Partiellement fondée', 'Non fondée'],
  DOMAINE: 'fracarro.com'
};

/** À LANCER UNE FOIS après avoir remplacé les valeurs */
function configurer() {
  PropertiesService.getScriptProperties().setProperties({
    BASE_ALERTES_ID: 'A_REMPLACER',               // ID du fichier BASE_ALERTES
    ADMINS: 'ali.khnissi@fracarro.com',           // plusieurs : séparer par des virgules
    APP_URL: ''                                    // URL /exec de cet espace (après déploiement)
  }, false);
  Logger.log('Configuration enregistrée.');
}

function prop_(k) {
  const v = PropertiesService.getScriptProperties().getProperty(k) || '';
  if (!v || v === 'A_REMPLACER') {
    if (k === 'APP_URL') return '';
    throw new Error('Paramètre manquant : ' + k + ' (lancez configurer())');
  }
  return v;
}

/* ------------------------- Page ------------------------- */

function doGet(e) {
  const t = HtmlService.createTemplateFromFile('Index');
  t.deepId = (e && e.parameter && e.parameter.id) ? String(e.parameter.id).substring(0, 40) : '';
  return t.evaluate()
    .setTitle('Espace référents – ALERTE')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
}

/* ------------------------- Accès aux données ------------------------- */

let SS_CACHE = null;
function ss_() {
  if (!SS_CACHE) SS_CACHE = SpreadsheetApp.openById(prop_('BASE_ALERTES_ID'));
  return SS_CACHE;
}

function readTable_(name) {
  const sh = ss_().getSheetByName(name);
  if (!sh) throw new Error('Onglet introuvable : ' + name);
  const values = sh.getDataRange().getValues();
  const head = values.shift().map(h => String(h).trim());
  const idx = {};
  head.forEach((h, i) => { idx[h] = i; });
  return { sh, head, rows: values, idx };
}

function appendByHeaders_(name, obj) {
  const sh = ss_().getSheetByName(name);
  const head = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(h => String(h).trim());
  sh.appendRow(head.map(h => (obj[h] !== undefined ? obj[h] : '')));
}

function cleanText_(s, max) {
  let t = String(s == null ? '' : s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ' ').trim();
  if (max) t = t.substring(0, max);
  if (/^[=+\-@]/.test(t)) t = "'" + t;
  return t;
}

function iso_(v) { return v instanceof Date ? v.toISOString() : ''; }
function low_(v) { return String(v || '').toLowerCase().trim(); }

function log_(me, action, detail) {
  appendByHeaders_('JOURNAL', {
    'Date': new Date(), 'Utilisateur': me.email, 'Action': action, 'Détail': cleanText_(detail, 1000)
  });
}

function history_(id, auteur, action, detail) {
  appendByHeaders_('HISTORIQUE', {
    'Date': new Date(), 'ID alerte': id, 'Auteur': auteur,
    'Action': cleanText_(action, 100), 'Détail': cleanText_(detail, 3000)
  });
}

/* ------------------------- Identification ------------------------- */

function me_() {
  const email = low_(Session.getActiveUser().getEmail());
  if (!email) throw new Error('Session non identifiée : connectez-vous avec votre compte @' + CFG.DOMAINE + '.');

  const admins = prop_('ADMINS').split(',').map(low_).filter(String);
  const isAdmin = admins.indexOf(email) >= 0;
  if (isAdmin) return { email, isAdmin: true };

  const cats = readTable_('CATEGORIES');
  const al = readTable_('ALERTES');
  const allowed = cats.rows.some(r => low_(r[cats.idx['Référent (email)']]) === email) ||
                  al.rows.some(r => low_(r[al.idx['Référent']]) === email);
  if (!allowed) throw new Error('Accès refusé : ce compte n’est pas référent du dispositif d’alerte.');
  return { email, isAdmin: false };
}

function visible_(me, row, idx) {
  return me.isAdmin || low_(row[idx['Référent']]) === me.email;
}

function categoriesMap_() {
  const t = readTable_('CATEGORIES');
  const m = {};
  t.rows.forEach(r => {
    const code = String(r[t.idx['Code']]).trim();
    if (!code) return;
    m[code] = {
      code, fr: String(r[t.idx['Libellé FR']]),
      referent: low_(r[t.idx['Référent (email)']]),
      delai: Number(r[t.idx['Délai cible (jours)']]) || 30
    };
  });
  return m;
}

/** Résumé d'une alerte (sans description ni identité) */
function summary_(r, idx, cats, now) {
  const code = String(r[idx['Code catégorie']]);
  const depot = r[idx['Date dépôt']];
  const statut = String(r[idx['Statut']] || 'Nouvelle');
  const cloture = r[idx['Date clôture']];
  const delai = (cats[code] && cats[code].delai) || 30;
  const fin = CFG.FINAUX.indexOf(statut) >= 0;
  const ref = (fin && cloture instanceof Date) ? cloture : now;
  const age = depot instanceof Date ? Math.floor((ref - depot) / 86400000) : 0;
  return {
    id: String(r[idx['ID']]),
    depot: iso_(depot),
    code: code,
    categorie: String(r[idx['Catégorie']] || (cats[code] && cats[code].fr) || code),
    statut: statut,
    referent: low_(r[idx['Référent']]),
    priseEnCharge: iso_(r[idx['Date prise en charge']]),
    cloture: iso_(cloture),
    maj: iso_(r[idx['Dernière mise à jour']]),
    conclusion: String(r[idx['Conclusion']] || ''),
    delai: delai,
    age: age,
    final: fin,
    retard: !fin && age > delai,
    restant: delai - age
  };
}

/* ------------------------- Fonctions appelées par la page ------------------------- */

function getSession() {
  const me = me_();
  const cats = categoriesMap_();
  const res = {
    email: me.email,
    isAdmin: me.isAdmin,
    statuts: CFG.STATUTS,
    finaux: CFG.FINAUX,
    conclusions: CFG.CONCLUSIONS,
    categories: Object.keys(cats).map(k => ({ code: k, fr: cats[k].fr, delai: cats[k].delai }))
  };
  if (me.isAdmin) {
    const set = {};
    Object.keys(cats).forEach(k => { if (cats[k].referent) set[cats[k].referent] = true; });
    prop_('ADMINS').split(',').map(low_).filter(String).forEach(a => { set[a] = true; });
    res.referents = Object.keys(set).sort();
  }
  return res;
}

function listAlerts() {
  const me = me_();
  const t = readTable_('ALERTES');
  const cats = categoriesMap_();
  const now = new Date();
  return t.rows
    .filter(r => r[t.idx['ID']] && visible_(me, r, t.idx))
    .map(r => summary_(r, t.idx, cats, now))
    .sort((a, b) => (a.depot < b.depot ? 1 : -1));
}

function getDashboard() {
  const list = listAlerts();
  const now = new Date();
  const moisCourant = Utilities.formatDate(now, CFG.TZ, 'yyyy-MM');
  const unAn = new Date(now.getTime() - 365 * 86400000);

  const ouvertes = list.filter(a => !a.final);
  const clotureesAn = list.filter(a => a.statut === 'Clôturée' && a.cloture && new Date(a.cloture) >= unAn);
  const delaiMoyen = clotureesAn.length
    ? Math.round(clotureesAn.reduce((s, a) => s + a.age, 0) / clotureesAn.length * 10) / 10
    : null;

  const parCat = {};
  list.forEach(a => {
    const c = parCat[a.code] || (parCat[a.code] = { code: a.code, categorie: a.categorie, total: 0, ouvertes: 0, retard: 0 });
    c.total++;
    if (!a.final) c.ouvertes++;
    if (a.retard) c.retard++;
  });

  const parStatut = {};
  CFG.STATUTS.forEach(s => { parStatut[s] = 0; });
  list.forEach(a => { parStatut[a.statut] = (parStatut[a.statut] || 0) + 1; });

  return {
    total: list.length,
    ouvertes: ouvertes.length,
    nouvelles: list.filter(a => a.statut === 'Nouvelle').length,
    retard: list.filter(a => a.retard).length,
    clotureesMois: list.filter(a => a.cloture && Utilities.formatDate(new Date(a.cloture), CFG.TZ, 'yyyy-MM') === moisCourant).length,
    delaiMoyen: delaiMoyen,
    fondees: list.filter(a => a.conclusion === 'Fondée' || a.conclusion === 'Partiellement fondée').length,
    parCategorie: Object.keys(parCat).map(k => parCat[k]).sort((a, b) => b.total - a.total),
    parStatut: parStatut,
    urgentes: ouvertes.filter(a => a.retard || a.restant <= 3)
      .sort((a, b) => a.restant - b.restant).slice(0, 8)
  };
}

function findVisible_(me, id) {
  const t = readTable_('ALERTES');
  const i = t.rows.findIndex(r => String(r[t.idx['ID']]) === String(id));
  if (i < 0) throw new Error('Alerte introuvable.');
  if (!visible_(me, t.rows[i], t.idx)) {
    log_(me, 'ACCES_REFUSE', 'Tentative d’accès à ' + id);
    throw new Error('Vous n’avez pas accès à cette alerte.');
  }
  return { t, i, row: t.rows[i], sheetRow: i + 2 };
}

function getAlert(id) {
  const me = me_();
  const f = findVisible_(me, id);
  const idx = f.t.idx;
  const base = summary_(f.row, idx, categoriesMap_(), new Date());

  const pj = String(f.row[idx['Pièces jointes']] || '').split(/\n| \| /).filter(String);
  const h = readTable_('HISTORIQUE');
  const historique = h.rows
    .filter(r => String(r[h.idx['ID alerte']]) === String(id))
    .map(r => ({
      date: iso_(r[h.idx['Date']]),
      auteur: String(r[h.idx['Auteur']]),
      action: String(r[h.idx['Action']]),
      detail: String(r[h.idx['Détail']])
    }))
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  log_(me, 'CONSULTATION', id);

  base.description = String(f.row[idx['Description']] || '').replace(/^'/, '');
  base.langue = String(f.row[idx['Langue']] || 'fr');
  base.nbPieces = pj.length;
  base.identiteDisponible = !!(f.row[idx['Nom']]);
  base.historique = historique;
  base.notePublique = String(f.row[idx['Note publique'] !== undefined ? idx['Note publique'] : 0] || '').trim();
  return base;
}

/** Identité du déclarant : affichée à la demande et tracée */
function revealIdentity(id) {
  const me = me_();
  const f = findVisible_(me, id);
  const idx = f.t.idx;
  log_(me, 'IDENTITE_CONSULTEE', id);
  history_(id, me.email, 'Identité consultée', 'Consultation de l’identité du déclarant');
  return {
    nom: String(f.row[idx['Nom']] || '').replace(/^'/, ''),
    email: String(f.row[idx['Email']] || ''),
    telephone: String(f.row[idx['Téléphone']] || '')
  };
}

/** Pièce jointe : uniquement celles rattachées à l'alerte */
function getAttachment(id, n) {
  const me = me_();
  const f = findVisible_(me, id);
  const urls = String(f.row[f.t.idx['Pièces jointes']] || '').split(/\n| \| /).filter(String);
  const url = urls[Number(n)];
  if (!url) throw new Error('Pièce jointe introuvable.');
  const m = url.match(/\/d\/([\w-]{20,})/) || url.match(/[?&]id=([\w-]{20,})/);
  if (!m) throw new Error('Lien de pièce jointe non reconnu.');
  const blob = DriveApp.getFileById(m[1]).getBlob();
  if (blob.getBytes().length > 8 * 1024 * 1024) throw new Error('Fichier trop volumineux pour l’aperçu.');
  log_(me, 'PIECE_CONSULTEE', id + ' #' + (Number(n) + 1));
  return { name: blob.getName(), mime: blob.getContentType(), data: Utilities.base64Encode(blob.getBytes()) };
}

/**
 * Mise à jour d'une alerte.
 * p = { id, statut, conclusion, commentaire, referent }
 */
function updateAlert(p) {
  const me = me_();
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) throw new Error('Serveur occupé, réessayez.');
  try {
    const f = findVisible_(me, p.id);
    const idx = f.t.idx;
    const row = f.row.slice();
    const now = new Date();
    const changes = [];

    const ancien = String(row[idx['Statut']] || 'Nouvelle');
    const statut = p.statut ? String(p.statut) : ancien;
    if (CFG.STATUTS.indexOf(statut) < 0) throw new Error('Statut invalide.');

    const commentaire = cleanText_(p.commentaire, 3000);
    const conclusion = p.conclusion ? String(p.conclusion) : String(row[idx['Conclusion']] || '');
    if (conclusion && CFG.CONCLUSIONS.indexOf(conclusion) < 0) throw new Error('Conclusion invalide.');

    // Règles de clôture
    if (CFG.FINAUX.indexOf(statut) >= 0 && statut !== ancien && commentaire.length < 10) {
      throw new Error('Un commentaire de clôture (10 caractères minimum) est obligatoire.');
    }
    if (statut === 'Clôturée' && !conclusion) {
      throw new Error('Indiquez la conclusion (fondée / non fondée) avant de clôturer.');
    }

    if (statut !== ancien) {
      row[idx['Statut']] = statut;
      changes.push('Statut : ' + ancien + ' → ' + statut);
      if (ancien === 'Nouvelle' && !(row[idx['Date prise en charge']] instanceof Date)) {
        row[idx['Date prise en charge']] = now;
      }
      if (CFG.FINAUX.indexOf(statut) >= 0) {
        row[idx['Date clôture']] = now;
      } else if (CFG.FINAUX.indexOf(ancien) >= 0) {
        row[idx['Date clôture']] = '';
        changes.push('Alerte rouverte');
      }
    }

    if (conclusion !== String(row[idx['Conclusion']] || '')) {
      row[idx['Conclusion']] = conclusion;
      changes.push('Conclusion : ' + conclusion);
    }

    let nouveauReferent = null;
    if (p.referent && low_(p.referent) !== low_(row[idx['Référent']])) {
      if (!me.isAdmin) throw new Error('Seul un administrateur peut réaffecter une alerte.');
      const r = low_(p.referent);
      if (!new RegExp('^[^\\s@]+@' + CFG.DOMAINE.replace('.', '\\.') + '$').test(r)) {
        throw new Error('Le référent doit avoir une adresse @' + CFG.DOMAINE + '.');
      }
      changes.push('Réaffectée : ' + low_(row[idx['Référent']]) + ' → ' + r);
      row[idx['Référent']] = r;
      nouveauReferent = r;
    }

    const notePublique = cleanText_(p.notePublique, 300);
    if (!changes.length && !commentaire && !notePublique) throw new Error('Aucune modification à enregistrer.');

    row[idx['Dernière mise à jour']] = now;
    f.t.sh.getRange(f.sheetRow, 1, 1, row.length).setValues([row]);

    if (notePublique !== undefined && notePublique !== null) {
      const noteCol = f.t.idx['Note publique'];
      if (noteCol !== undefined) {
        f.t.sh.getRange(f.sheetRow, noteCol + 1).setValue(notePublique);
        if (notePublique) changes.push('Note publique mise à jour');
      }
    }
    if (changes.length) history_(p.id, me.email, 'Mise à jour', changes.join(' · '));
    if (commentaire) history_(p.id, me.email, 'Commentaire interne', commentaire);
    if (notePublique) history_(p.id, me.email, 'Note publique', notePublique);
    log_(me, 'MISE_A_JOUR', p.id + ' — ' + (changes.join(' · ') || 'commentaire'));
    SpreadsheetApp.flush();

    if (nouveauReferent) notifyReassign_(p.id, nouveauReferent, row[idx['Catégorie']]);
  } finally {
    lock.releaseLock();
  }
  return getAlert(p.id);
}

function notifyReassign_(id, email, categorie) {
  const url = prop_('APP_URL');
  try {
    MailApp.sendEmail({
      to: email,
      subject: '[Alerte] Alerte ' + id + ' qui vous est confiée',
      name: 'Dispositif d’alerte – Fracarro Tunisie',
      body: [
        'L’alerte ' + id + ' (' + categorie + ') vous a été confiée.',
        '',
        'Pour des raisons de confidentialité, son contenu ne figure pas dans cet e-mail.',
        url ? 'Consulter : ' + url + '?id=' + encodeURIComponent(id) : 'Consultez l’espace référents.'
      ].join('\n')
    });
  } catch (e) { /* non bloquant */ }
}

/** Journal d'audit (administrateurs) */
function listJournal() {
  const me = me_();
  if (!me.isAdmin) throw new Error('Réservé aux administrateurs.');
  const t = readTable_('JOURNAL');
  return t.rows.slice(-300).reverse().map(r => ({
    date: iso_(r[t.idx['Date']]),
    utilisateur: String(r[t.idx['Utilisateur']]),
    action: String(r[t.idx['Action']]),
    detail: String(r[t.idx['Détail']])
  }));
}

/** Test depuis l'éditeur */
function testerAcces() {
  Logger.log(getSession());
  Logger.log(getDashboard());
}
