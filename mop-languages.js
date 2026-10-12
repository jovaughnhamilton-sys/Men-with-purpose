/* Men of Purpose: English / Spanish / Portuguese interface selector.
   Does not translate Scripture or user journal entries. */
(function () {
  'use strict';
  const translations = {
    en: {Home:'Home',Journey:'Journey',Journal:'Journal',Bible:'Bible',More:'More',language:'Language',welcome:'Walk with purpose today.',settings:'Settings & Account',prayer:'My Prayer Journal'},
    es: {Home:'Inicio',Journey:'Camino',Journal:'Diario',Bible:'Biblia',More:'Más',language:'Idioma',welcome:'Camina con propósito hoy.',settings:'Configuración y cuenta',prayer:'Mi diario de oración'},
    pt: {Home:'Início',Journey:'Jornada',Journal:'Diário',Bible:'Bíblia',More:'Mais',language:'Idioma',welcome:'Caminhe com propósito hoje.',settings:'Configurações e conta',prayer:'Meu diário de oração'}
  };
  const nav = [['homeTab','Home','⌂'],['journeyTab','Journey','◫'],['journalTab','Journal','✎'],['bibleTab','Bible','✝'],['moreTab','More','⚙']];
  const phrases = {'Walk with purpose today.':'welcome','Settings & Account':'settings','My Prayer Journal':'prayer'};
  let busy = false;
  const stored = () => { try { return localStorage.getItem('mop-language') || 'en'; } catch (_) { return 'en'; } };
  const originalText = new WeakMap();
  function apply() {
    if (busy) return;
    busy = true;
    try {
      const code = translations[stored()] ? stored() : 'en', t = translations[code];
      document.documentElement.lang = code;
      const select = document.getElementById('mop-language');
      if (select) select.value = code;
      const label = document.getElementById('mop-language-label');
      if (label) label.textContent = t.language;
      for (const [id, key, symbol] of nav) {
        const node = document.getElementById(id);
        if (node) node.textContent = symbol + ' ' + t[key];
      }
      const root = document.getElementById('content');
      if (!root) return;
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        if (node.parentElement && ['TEXTAREA','SCRIPT','STYLE','OPTION'].includes(node.parentElement.tagName)) continue;
        let original = originalText.get(node);
        if (original === undefined) { original = node.nodeValue; originalText.set(node, original); }
        const trimmed = original.trim();
        if (phrases[trimmed]) node.nodeValue = original.replace(trimmed, t[phrases[trimmed]]);
      }
    } finally { busy = false; }
  }
  function start() {
    const header = document.querySelector('.app > header');
    if (!header || document.getElementById('mop-language')) return;
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;align-items:center;justify-content:flex-end;gap:8px;margin-top:12px;font-size:13px;color:white';
    const label = document.createElement('label'); label.id = 'mop-language-label'; label.htmlFor = 'mop-language';
    const select = document.createElement('select'); select.id = 'mop-language';
    select.setAttribute('aria-label', 'Select app language');
    select.style.cssText = 'width:auto;max-width:160px;padding:7px;border-radius:9px;background:white;color:#142e25;border:1px solid #c6a15b;font-size:13px';
    for (const [code,name] of [['en','🇬🇧 English'],['es','🇪🇸 Español'],['pt','🇧🇷 Português']]) {
      const opt = document.createElement('option'); opt.value=code; opt.textContent=name; select.appendChild(opt);
    }
    select.addEventListener('change', () => { try { localStorage.setItem('mop-language', select.value); } catch (_) {} apply(); });
    wrap.append('🌐 ', label, select); header.appendChild(wrap);
    const root = document.getElementById('content');
    if (root) new MutationObserver(() => { if (!busy) apply(); }).observe(root, {childList:true,subtree:true});
    apply();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
