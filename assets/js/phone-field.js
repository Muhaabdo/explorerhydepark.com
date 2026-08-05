/* Searchable country-code dropdown for phone inputs. Needs country-codes.js
   loaded first (window.HP_COUNTRIES). No dependencies. */
(function () {
  'use strict';

  // Regional-indicator emoji render as bare two-letter text on several
  // platforms (notably Windows Chrome, which ships no flag glyphs) — an
  // actual flag icon (flag-icons CDN, loaded in <head>) renders everywhere.
  function flagIcon(iso2) {
    return '<span class="fi fi-' + String(iso2).toLowerCase() + '"></span>';
  }

  function initPhoneField(root) {
    var countries = window.HP_COUNTRIES || [];
    var toggle = root.querySelector('.phone-field__toggle');
    var panel = root.querySelector('.phone-field__panel');
    var search = root.querySelector('.phone-field__search');
    var list = root.querySelector('.phone-field__list');
    var hidden = root.querySelector('input[type="hidden"]');
    var flagEl = toggle.querySelector('.flag');
    var dialEl = toggle.querySelector('.dial');
    if (!toggle || !panel || !search || !list || !hidden) return;

    function close() {
      root.classList.remove('is-open');
      panel.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
      document.removeEventListener('pointerdown', onOutside, true);
      document.removeEventListener('keydown', onEsc, true);
    }

    function select(country) {
      flagEl.innerHTML = flagIcon(country.iso2);
      dialEl.textContent = '+' + country.dial;
      hidden.value = '+' + country.dial;
      hidden.setAttribute('data-iso2', country.iso2);
      close();
    }

    function renderList(filter) {
      var q = (filter || '').trim().toLowerCase();
      var matches = !q ? countries : countries.filter(function (c) {
        return c.name.toLowerCase().indexOf(q) !== -1 ||
          (c.nameAr && c.nameAr.indexOf(q) !== -1) ||
          c.dial.indexOf(q.replace(/^\+/, '')) !== -1 ||
          c.iso2.toLowerCase() === q;
      });
      list.innerHTML = '';
      if (!matches.length) {
        var empty = document.createElement('div');
        empty.className = 'phone-field__empty';
        empty.textContent = 'مفيش نتائج';
        list.appendChild(empty);
        return;
      }
      matches.slice(0, 60).forEach(function (c) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'phone-field__option';
        btn.setAttribute('role', 'option');
        btn.innerHTML =
          '<span class="flag">' + flagIcon(c.iso2) + '</span>' +
          '<span class="name">' + (c.nameAr || c.name) + '</span>' +
          '<span class="dial">+' + c.dial + '</span>';
        btn.addEventListener('click', function () { select(c); });
        list.appendChild(btn);
      });
    }

    function onOutside(e) {
      if (!root.contains(e.target)) close();
    }
    function onEsc(e) {
      if (e.key === 'Escape') close();
    }

    function open() {
      root.classList.add('is-open');
      panel.hidden = false;
      toggle.setAttribute('aria-expanded', 'true');
      search.value = '';
      renderList('');
      setTimeout(function () { search.focus(); }, 0);
      document.addEventListener('pointerdown', onOutside, true);
      document.addEventListener('keydown', onEsc, true);
    }

    toggle.addEventListener('click', function () {
      if (panel.hidden) open(); else close();
    });
    search.addEventListener('input', function () { renderList(search.value); });
    search.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        var first = list.querySelector('.phone-field__option');
        if (first) first.click();
      }
    });

    var defaultIso = root.getAttribute('data-default') || 'EG';
    var initial = countries.filter(function (c) { return c.iso2 === defaultIso; })[0] || countries[0];
    if (initial) select(initial);
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-phone-field]').forEach(initPhoneField);
  });
})();
