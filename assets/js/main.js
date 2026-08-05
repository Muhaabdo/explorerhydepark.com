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
    initFaq();
    initGallery();
    initCalculator();
    initLeadForms();
    initWhatsappLinks();
    initFloatWhatsapp();
    initRelatedCarousel();
    initYear();
  });

  /* ---------------- Floating WhatsApp: hidden over the hero, shown after it ---------------- */
  function initFloatWhatsapp() {
    var fab = document.querySelector('.float-whatsapp');
    if (!fab) return;
    // Watch the hero's own CTA row (not the whole hero section) so the
    // button reappears as soon as it would no longer cover those buttons,
    // instead of waiting for the entire 100dvh hero to scroll away.
    var watchTarget = document.querySelector('.hero__ctas') || document.querySelector('.hero');
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

    var lastY = window.scrollY;
    window.addEventListener('scroll', function () {
      var y = window.scrollY;
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

  /* ---------------- FAQ accordion ---------------- */
  function initFaq() {
    document.querySelectorAll('.faq-item__q').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var item = btn.closest('.faq-item');
        var wasOpen = item.classList.contains('is-open');
        item.parentElement.querySelectorAll('.faq-item.is-open').forEach(function (open) {
          open.classList.remove('is-open');
          var sign = open.querySelector('.faq-item__sign');
          if (sign) sign.textContent = '+';
        });
        if (!wasOpen) {
          item.classList.add('is-open');
          var sign = item.querySelector('.faq-item__sign');
          if (sign) sign.textContent = '−';
        }
      });
    });
  }

  /* ---------------- Gallery scroll buttons ---------------- */
  function initGallery() {
    document.querySelectorAll('.gallery').forEach(function (gallery) {
      var track = gallery.querySelector('.gallery__track');
      var prev = gallery.querySelector('[data-gallery-prev]');
      var next = gallery.querySelector('[data-gallery-next]');
      if (!track) return;
      var step = 280;
      if (prev) prev.addEventListener('click', function () { track.scrollBy({ left: step, behavior: 'smooth' }); });
      if (next) next.addEventListener('click', function () { track.scrollBy({ left: -step, behavior: 'smooth' }); });
    });
  }

  /* ---------------- Related-projects carousel: auto-scrolls, pauses on
     hover/touch/manual scroll, resumes shortly after; skipped entirely for
     prefers-reduced-motion (plain manual scroll still works there). ---------------- */
  function initRelatedCarousel() {
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    document.querySelectorAll('[data-auto-carousel]').forEach(function (root) {
      var track = root.querySelector('.related-carousel__track');
      if (!track || reduceMotion) return;

      var SPEED = 32; // px/sec
      var direction = -1; // matches the gallery's "next" direction in this RTL layout
      var paused = false;
      var resumeTimer = null;
      var lastTs = null;

      function maxScroll() { return track.scrollWidth - track.clientWidth; }
      function atEnd() { return Math.abs(track.scrollLeft) >= maxScroll() - 2; }
      function atStart() { return Math.abs(track.scrollLeft) <= 2; }

      function frame(ts) {
        if (lastTs == null) lastTs = ts;
        // Clamped: a backgrounded tab starves rAF, so the next tick can arrive
        // with a huge elapsed time — without this, resuming focus would jump
        // the track by that whole gap in one frame instead of just continuing.
        var dt = Math.min((ts - lastTs) / 1000, 0.05);
        lastTs = ts;
        if (!paused && maxScroll() > 4) {
          if (direction < 0 && atEnd()) direction = 1;
          else if (direction > 0 && atStart()) direction = -1;
          track.scrollLeft += direction * SPEED * dt;
        }
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);

      function pause() {
        paused = true;
        if (resumeTimer) { clearTimeout(resumeTimer); resumeTimer = null; }
      }
      function scheduleResume(delay) {
        if (resumeTimer) clearTimeout(resumeTimer);
        resumeTimer = setTimeout(function () { paused = false; lastTs = null; }, delay);
      }

      root.addEventListener('mouseenter', pause);
      root.addEventListener('mouseleave', function () { scheduleResume(300); });
      track.addEventListener('touchstart', pause, { passive: true });
      track.addEventListener('touchend', function () { scheduleResume(1500); }, { passive: true });
      track.addEventListener('pointerdown', pause);
      window.addEventListener('pointerup', function () { scheduleResume(1500); });
      track.addEventListener('wheel', function () { pause(); scheduleResume(2500); }, { passive: true });
    });
  }

  /* ---------------- Mortgage / installment calculator ---------------- */
  function initCalculator() {
    var calc = document.querySelector('[data-calculator]');
    if (!calc) return;

    var priceSelect = calc.querySelector('[data-calc-price]');
    var downRange = calc.querySelector('[data-calc-down]');
    var yearsRange = calc.querySelector('[data-calc-years]');
    var downLabel = calc.querySelector('[data-calc-down-label]');
    var yearsLabel = calc.querySelector('[data-calc-years-label]');
    var monthlyOut = calc.querySelector('[data-calc-monthly]');
    var downAmountOut = calc.querySelector('[data-calc-down-amount]');

    function fmt(n) {
      return Math.round(n).toLocaleString('en-US');
    }

    function render() {
      var price = Number(priceSelect.options[priceSelect.selectedIndex].dataset.price || 0);
      var downPct = Number(downRange.value);
      var years = Number(yearsRange.value);
      var downAmount = price * downPct / 100;
      var monthly = (price - downAmount) / (years * 12);

      downLabel.textContent = downPct + '%';
      yearsLabel.textContent = years + ' سنوات';
      monthlyOut.textContent = fmt(monthly);
      downAmountOut.textContent = fmt(downAmount);
    }

    priceSelect.addEventListener('change', render);
    downRange.addEventListener('input', render);
    yearsRange.addEventListener('input', render);
    render();
  }

  /* ---------------- WhatsApp / phone CTA links ---------------- */
  function initWhatsappLinks() {
    document.querySelectorAll('[data-whatsapp-link]').forEach(function (el) {
      var msg = el.getAttribute('data-whatsapp-message') || 'أرغب بمعرفة التفاصيل';
      el.setAttribute('href', 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(msg));
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

        var lines = [];
        if (project) lines.push('مهتم بـ: ' + isolate(project, 'ltr'));
        if (name) lines.push('الاسم: ' + isolate(name, 'auto'));
        if (phone) lines.push('الهاتف: ' + isolate(code + phone, 'ltr'));
        if (email) lines.push('البريد الإلكتروني: ' + isolate(email, 'ltr'));
        if (message) lines.push('الرسالة: ' + isolate(message, 'auto'));
        if (!lines.length) lines.push('أرغب بمعرفة التفاصيل');

        var url = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(lines.join('\n'));
        window.open(url, '_blank', 'noopener');
        window.location.href = form.getAttribute('data-success-url') || 'thank-you.html';
      });
    });
  }

  function initYear() {
    document.querySelectorAll('[data-year]').forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  }
})();
