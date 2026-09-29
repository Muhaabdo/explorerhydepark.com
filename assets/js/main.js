/* Explorer Hyde Park — shared site behavior (vanilla JS, no dependencies) */
(function () {
  'use strict';

  var WHATSAPP_NUMBER = '201000000000'; // TODO: replace with the real WhatsApp business number
  var PHONE_NUMBER = '01000000000'; // TODO: replace with the real phone number

  // WhatsApp messages are plain text (no HTML, so no <bdi>) — Unicode isolate
  // marks are the plain-text equivalent, keeping an embedded run's direction
  // from bleeding into the surrounding Arabic sentence.
  // ltr: known Latin/numeric content (project names, email, phone).
  // auto: unknown/mixed script (free-typed name or message) — picks its own
  // base direction from its first strong character instead of forcing one.
  function isolate(s, mode) {
    if (!s) return s;
    var open = mode === 'auto' ? '⁨' /* FSI */ : '⁦' /* LRI */;
    return open + s + '⁩' /* PDI */;
  }

  document.addEventListener('DOMContentLoaded', function () {
    initNav();
    initGallery();
    initSectionNav();
    initUnitTabs();
    initReverseCalc();
    initMultiStepForms();
    initLeadForms();
    initWhatsappLinks();
    initFloatWhatsapp();
    initYear();
  });

  /* ---------------- Floating WhatsApp: hidden over the hero, shown after it ---------------- */
  function initFloatWhatsapp() {
    var fab = document.querySelector('.float-whatsapp');
    if (!fab) return;
    // Watch the hero's own CTA row (not the whole hero section) so the
    // button reappears as soon as it would no longer cover those buttons,
    // instead of waiting for the entire 100dvh hero to scroll away.
    var watchTarget = document.querySelector('.hero__ctas') || document.querySelector('.pp-price-card') || document.querySelector('.hero');
    if (!watchTarget || !('IntersectionObserver' in window)) {
      fab.classList.add('is-visible');
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        fab.classList.toggle('is-visible', !entry.isIntersecting);
      });
    }, { threshold: 0 });
    io.observe(watchTarget);
  }

  /* ---------------- Navbar: hide on scroll-down, mobile menu ---------------- */
  function initNav() {
    var navbar = document.querySelector('.navbar');
    var toggle = document.querySelector('.navbar__toggle');
    var mobileMenu = document.querySelector('.mobile-menu');
    if (!navbar) return;

    // Project pages: the navbar is transparent over the hero image until the
    // page scrolls, and the sticky section chips park under it via --navbar-h.
    var overlay = navbar.classList.contains('navbar--overlay');
    function measureNavbar() {
      document.documentElement.style.setProperty('--navbar-h', navbar.offsetHeight + 'px');
    }
    if (overlay) {
      measureNavbar();
      navbar.classList.toggle('is-scrolled', window.scrollY > 40);
      window.addEventListener('resize', measureNavbar);
    }

    var lastY = window.scrollY;
    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      if (overlay) navbar.classList.toggle('is-scrolled', y > 40);
      var goingDown = y > lastY;
      if (goingDown && y > 80) {
        navbar.classList.add('is-hidden');
        closeMobileMenu();
      } else {
        navbar.classList.remove('is-hidden');
      }
      lastY = y;
    }, { passive: true });

    function closeMobileMenu() {
      if (mobileMenu) mobileMenu.classList.remove('is-open');
    }

    if (toggle && mobileMenu) {
      toggle.addEventListener('click', function () {
        mobileMenu.classList.toggle('is-open');
      });
      mobileMenu.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', closeMobileMenu);
      });
    }

    function syncForWidth() {
      if (window.innerWidth >= 768) closeMobileMenu();
    }
    window.addEventListener('resize', syncForWidth);
  }

  /* ---------------- Gallery: thumbnail swaps the main image ---------------- */
  function initGallery() {
    document.querySelectorAll('[data-gallery]').forEach(function (gallery) {
      var main = gallery.querySelector('[data-gallery-main]');
      var count = gallery.querySelector('[data-gallery-count] bdi') || gallery.querySelector('[data-gallery-count]');
      var thumbs = gallery.querySelectorAll('[data-gallery-thumb]');
      if (!main) return;
      thumbs.forEach(function (thumb, i) {
        thumb.addEventListener('click', function () {
          main.src = thumb.getAttribute('data-src');
          main.alt = thumb.getAttribute('data-alt');
          if (count) count.textContent = (i + 1) + ' / ' + thumbs.length;
          thumbs.forEach(function (t) { t.setAttribute('aria-pressed', t === thumb ? 'true' : 'false'); });
        });
      });
    });
  }

  /* ---------------- Section chips: highlight the section in view ---------------- */
  function initSectionNav() {
    var navEl = document.querySelector('[data-section-nav]');
    if (!navEl || !('IntersectionObserver' in window)) return;
    var chips = {};
    navEl.querySelectorAll('a[href^="#"]').forEach(function (a) {
      var target = document.getElementById(a.getAttribute('href').slice(1));
      if (target) chips[target.id] = a;
    });

    function activate(id) {
      Object.keys(chips).forEach(function (key) { chips[key].classList.toggle('is-active', key === id); });
      var chip = chips[id];
      if (chip) {
        // Scroll only the chip row horizontally, never the page.
        var navBox = navEl.getBoundingClientRect();
        var chipBox = chip.getBoundingClientRect();
        if (chipBox.left < navBox.left || chipBox.right > navBox.right) {
          navEl.scrollBy({ left: chipBox.left - navBox.left - (navBox.width - chipBox.width) / 2, behavior: 'smooth' });
        }
      }
    }

    // A section counts as "current" while it crosses a thin band in the upper
    // third of the viewport (just under the sticky navbar + chips).
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) activate(entry.target.id);
      });
    }, { rootMargin: '-30% 0px -65% 0px', threshold: 0 });
    Object.keys(chips).forEach(function (id) { io.observe(document.getElementById(id)); });
  }

  /* ---------------- Analytics: new V5 events only ----------------
     whatsapp_click and generate_lead are GTM triggers already (click on
     [data-whatsapp-link] / thank-you page view) — never push them here, or
     they double count. */
  function track(event, params) {
    window.dataLayer = window.dataLayer || [];
    var payload = { event: event };
    Object.keys(params || {}).forEach(function (k) { payload[k] = params[k]; });
    window.dataLayer.push(payload);
  }

  function fmt(n) {
    return Math.round(n).toLocaleString('en-US');
  }

  /* ---------------- Units: accessible tabs (static panels, JS only toggles) ---------------- */
  function initUnitTabs() {
    document.querySelectorAll('[data-unit-tabs]').forEach(function (list) {
      var tabs = Array.prototype.slice.call(list.querySelectorAll('[role="tab"]'));
      function select(tab, focus) {
        tabs.forEach(function (t) {
          var on = t === tab;
          t.setAttribute('aria-selected', on ? 'true' : 'false');
          t.setAttribute('tabindex', on ? '0' : '-1');
          var panel = document.getElementById(t.getAttribute('aria-controls'));
          if (panel) panel.hidden = !on;
        });
        if (focus) tab.focus();
      }
      tabs.forEach(function (tab, i) {
        tab.addEventListener('click', function () {
          if (tab.getAttribute('aria-selected') === 'true') return;
          select(tab);
          track('unit_tab_click', { unit_type: tab.getAttribute('data-unit-type') });
        });
        tab.addEventListener('keydown', function (e) {
          // RTL: ArrowLeft moves to the next tab, ArrowRight to the previous one.
          var next = { ArrowLeft: i + 1, ArrowRight: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
          if (next == null) return;
          e.preventDefault();
          var target = tabs[(next + tabs.length) % tabs.length];
          select(target, true);
          track('unit_tab_click', { unit_type: target.getAttribute('data-unit-type') });
        });
      });
    });
  }

  /* ---------------- Reverse calculator: monthly budget → required down payment ----------------
     Same formula as calcResult() in tools/build-pages.js (which renders the
     default state into the static HTML). */
  function initReverseCalc() {
    var root = document.querySelector('[data-reverse-calc]');
    if (!root) return;
    var downPct = Number(root.getAttribute('data-down-pct'));
    var months = Number(root.getAttribute('data-months'));
    var project = root.getAttribute('data-project');
    var chips = root.querySelectorAll('[data-budget]');
    var customWrap = root.querySelector('[data-calc-custom]');
    var input = root.querySelector('[data-calc-input]');
    var rows = root.querySelectorAll('[data-price]');
    var cta = root.querySelector('[data-calc-cta]');
    var ctaText = root.querySelector('[data-calc-cta-text]');
    var tracked = false;
    var trackTimer = null;

    // Accepts "85,000", "85000" and Arabic-Indic digits "٨٥٠٠٠".
    function parseAmount(v) {
      var digits = String(v || '').replace(/[٠-٩]/g, function (d) { return String(d.charCodeAt(0) - 0x0660); }).replace(/[^0-9]/g, '');
      return digits ? Number(digits) : 0;
    }

    function render(monthly) {
      rows.forEach(function (row) {
        var price = Number(row.getAttribute('data-price'));
        var detail = row.querySelector('[data-calc-detail]');
        var fit = row.querySelector('[data-calc-fit]');
        var noFit = row.querySelector('[data-calc-nofit]');
        if (!monthly) {
          detail.textContent = 'اكتب القسط وهنحسبلك المقدم';
          fit.hidden = true; noFit.hidden = true;
          return;
        }
        var dp = Math.max(price * downPct / 100, price - monthly * months);
        var pct = Math.round(dp / price * 100);
        var fits = pct <= 50;
        detail.textContent = fits
          ? 'مقدم ' + fmt(dp) + ' (' + pct + '%) · قسط ' + fmt((price - dp) / months)
          : 'محتاج مقدم ' + pct + '% من السعر';
        fit.hidden = !fits; noFit.hidden = fits;
      });
      if (monthly) {
        ctaText.textContent = 'ابعتلي الوحدات اللي على قد ' + fmt(monthly) + ' جنيه في الشهر';
        setWhatsappMessage(cta, 'عايز وحدة في ' + isolate(project, 'ltr') + ' على قد ' + fmt(monthly) + ' جنيه في الشهر. ابعتلي الوحدات المناسبة.');
      } else {
        ctaText.textContent = 'اكتب القسط الشهري الأول';
        setWhatsappMessage(cta, 'عايز أعرف الوحدات المتاحة في ' + isolate(project, 'ltr') + ' وخطط التقسيط.');
      }
    }

    function trackOnce(monthly) {
      if (tracked || !monthly) return;
      tracked = true;
      track('calculator_used', { monthly_budget: monthly });
    }

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        chips.forEach(function (c) { c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
        var v = chip.getAttribute('data-budget');
        if (v === 'custom') {
          customWrap.hidden = false;
          input.focus();
          render(parseAmount(input.value));
          return;
        }
        customWrap.hidden = true;
        render(Number(v));
        trackOnce(Number(v));
      });
    });

    input.addEventListener('input', function () {
      var monthly = parseAmount(input.value);
      render(monthly);
      // Wait until they stop typing so "8" on the way to "85000" isn't what gets recorded.
      clearTimeout(trackTimer);
      trackTimer = setTimeout(function () { trackOnce(monthly); }, 1200);
    });
  }

  /* ---------------- Multi-step lead form (progressive enhancement) ---------------- */
  function initMultiStepForms() {
    document.querySelectorAll('[data-multistep]').forEach(function (form) {
      var steps = Array.prototype.slice.call(form.querySelectorAll('[data-step]'));
      var bars = form.querySelectorAll('.pp-progress span');
      var label = form.querySelector('[data-step-label]');
      var error = form.querySelector('[data-step-error]');
      var note = form.querySelector('[data-immediate-note]');
      var current = 0;

      function answer(name) {
        var el = form.querySelector('[name="' + name + '"]:checked');
        return el ? el.value : '';
      }

      function show(i) {
        current = i;
        steps.forEach(function (s, n) { s.classList.toggle('is-current', n === i); });
        bars.forEach(function (b, n) { b.classList.toggle('is-done', n <= i); });
        if (label) label.textContent = 'خطوة ' + (i + 1) + ' من ' + steps.length;
        if (error) error.hidden = true;
      }

      function stepComplete(step) {
        var names = [];
        step.querySelectorAll('input[type="radio"]').forEach(function (r) {
          if (names.indexOf(r.name) === -1) names.push(r.name);
        });
        return names.every(function (n) { return answer(n); });
      }

      form.classList.add('is-enhanced');
      show(0);

      form.querySelectorAll('[data-step-next]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (!stepComplete(steps[current])) {
            if (error) error.hidden = false;
            return;
          }
          track('lead_form_step', { step: current + 1, purpose: answer('purpose'), budget_range: answer('budget_range') });
          show(current + 1);
          form.scrollIntoView({ block: 'start', behavior: 'smooth' });
        });
      });
      form.querySelectorAll('[data-step-back]').forEach(function (btn) {
        btn.addEventListener('click', function () { show(current - 1); });
      });

      if (note) {
        form.querySelectorAll('[name="purpose"]').forEach(function (r) {
          r.addEventListener('change', function () { note.hidden = answer('purpose') !== 'سكن فوري'; });
        });
      }
    });
  }

  /* ---------------- WhatsApp / phone CTA links ---------------- */
  function whatsappUrl(msg) {
    return 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(msg);
  }

  // For CTAs whose message changes after load (calculator).
  function setWhatsappMessage(el, msg) {
    if (!el) return;
    el.setAttribute('data-whatsapp-message', msg);
    el.setAttribute('href', whatsappUrl(msg));
  }

  function initWhatsappLinks() {
    document.querySelectorAll('[data-whatsapp-link]').forEach(function (el) {
      el.setAttribute('href', whatsappUrl(el.getAttribute('data-whatsapp-message') || 'أرغب بمعرفة التفاصيل'));
    });
    document.querySelectorAll('[data-phone-link]').forEach(function (el) {
      el.setAttribute('href', 'tel:' + PHONE_NUMBER);
    });
  }

  /* ---------------- Lead forms: submit via WhatsApp, then go to thank-you ---------------- */
  function initLeadForms() {
    document.querySelectorAll('[data-lead-form]').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var name = (form.querySelector('[name="name"]') || {}).value || '';
        var code = (form.querySelector('[name="country_code"]') || {}).value || '';
        var phone = (form.querySelector('[name="phone"]') || {}).value || '';
        var email = (form.querySelector('[name="email"]') || {}).value || '';
        var message = (form.querySelector('[name="message"]') || {}).value || '';
        var projectField = form.querySelector('[name="project"]');
        var project = (projectField && projectField.value) || form.getAttribute('data-project-name') || '';
        // Multi-step project form answers (absent on the contact form).
        function checked(n) {
          var el = form.querySelector('[name="' + n + '"]:checked');
          return el ? el.value : '';
        }
        var answers = {
          purpose: checked('purpose'),
          budget_range: checked('budget_range'),
          unit_type: checked('unit_type'),
          timing: checked('timing'),
        };

        var lines = [];
        if (project) lines.push('مهتم بـ: ' + isolate(project, 'ltr'));
        if (answers.purpose) lines.push('الغرض: ' + answers.purpose);
        if (answers.budget_range) lines.push('القسط المريح: ' + answers.budget_range);
        if (answers.unit_type) lines.push('نوع الوحدة: ' + answers.unit_type);
        if (answers.timing) lines.push('الشراء: ' + answers.timing);
        if (name) lines.push('الاسم: ' + isolate(name, 'auto'));
        if (phone) lines.push('الهاتف: ' + isolate(code + phone, 'ltr'));
        if (email) lines.push('البريد الإلكتروني: ' + isolate(email, 'ltr'));
        if (message) lines.push('الرسالة: ' + isolate(message, 'auto'));
        if (!lines.length) lines.push('أرغب بمعرفة التفاصيل');

        window.open(whatsappUrl(lines.join('\n')), '_blank', 'noopener');

        // Multi-step form: hand the answers to GTM on the thank-you page as
        // URL params (generate_lead itself stays a GTM page-view trigger).
        var successUrl = form.getAttribute('data-success-url') || 'thank-you.html';
        if (form.hasAttribute('data-multistep')) {
          var params = [];
          if (project) params.push('project=' + encodeURIComponent(project));
          Object.keys(answers).forEach(function (k) {
            if (answers[k]) params.push(k + '=' + encodeURIComponent(answers[k]));
          });
          if (params.length) successUrl += (successUrl.indexOf('?') === -1 ? '?' : '&') + params.join('&');
        }
        window.location.href = successUrl;
      });
    });
  }

  function initYear() {
    document.querySelectorAll('[data-year]').forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  }
})();
