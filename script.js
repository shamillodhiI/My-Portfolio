(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const html = document.documentElement;

  /* -----------------------------------------------------
     LOADING SCREEN
     Hides once the page has fully loaded, with a short
     minimum display time so it doesn't just flash.
  ----------------------------------------------------- */
  const loader = document.getElementById('loader');
  const MIN_LOAD_MS = 600;
  const loadStart = Date.now();

  function hideLoader() {
    if (!loader) return;
    const elapsed = Date.now() - loadStart;
    const wait = Math.max(0, MIN_LOAD_MS - elapsed);
    setTimeout(() => loader.classList.add('hidden'), wait);
  }
  window.addEventListener('load', hideLoader);
  // Fallback in case 'load' is slow to fire (e.g. slow fonts)
  setTimeout(hideLoader, 3500);

  /* -----------------------------------------------------
     DARK / LIGHT MODE
     Defaults to the visitor's OS preference. Note: this
     page can't use localStorage/sessionStorage in this
     preview environment, so the choice resets on reload —
     swap in localStorage.setItem('theme', ...) if you're
     hosting this yourself and want it to persist.
  ----------------------------------------------------- */
  const themeToggle = document.getElementById('themeToggle');
  const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  html.setAttribute('data-theme', prefersLight ? 'light' : 'dark');

  themeToggle?.addEventListener('click', () => {
    const current = html.getAttribute('data-theme');
    html.setAttribute('data-theme', current === 'dark' ? 'light' : 'dark');
  });

  /* -----------------------------------------------------
     ACCENT COLOR SWITCHER
     Swaps the site's primary accent (--gold) live between
     three palettes via the dots in the navbar. Resets on
     reload since this preview environment can't use
     localStorage — swap in localStorage.setItem(...) if
     you're self-hosting and want the choice to persist.
  ----------------------------------------------------- */
  const accentDots = document.querySelectorAll('.dot[data-accent]');
  const accentPalettes = {
    gold: { gold: '#5b8a68', soft: 'rgba(91, 138, 104, 0.14)' },
    blue: { gold: '#4a81a4', soft: 'rgba(74, 129, 164, 0.14)' },
    rose: { gold: '#946890', soft: 'rgba(148, 104, 144, 0.14)' }
  };
  accentDots.forEach(dot => {
    dot.addEventListener('click', () => {
      const key = dot.dataset.accent;
      const palette = accentPalettes[key];
      if (!palette) return;
      html.style.setProperty('--gold', palette.gold);
      html.style.setProperty('--gold-soft', palette.soft);
      accentDots.forEach(d => d.classList.toggle('active-dot', d === dot));
    });
  });

  /* -----------------------------------------------------
     3D PARALLAX TILT ON HERO TEXT
     Subtle tilt following the cursor within the hero
     section, disabled for reduced-motion users.
  ----------------------------------------------------- */
  const heroSection = document.getElementById('hero');
  const heroTiltBox = document.getElementById('heroTitleBox');
  if (heroSection && heroTiltBox && !reduceMotion) {
    heroSection.addEventListener('mousemove', e => {
      const rect = heroSection.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      heroTiltBox.style.transform = `perspective(1000px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`;
    });
    heroSection.addEventListener('mouseleave', () => {
      heroTiltBox.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg)';
    });
  }

  /* -----------------------------------------------------
     CONTINUOUS PROJECT TICKER
     Builds a duplicated, seamlessly-looping strip from the
     existing project cards and auto-scrolls it, pausing on
     hover. Clicking an item scrolls to and highlights the
     matching card in the grid above.
  ----------------------------------------------------- */
  const tickerTrack = document.getElementById('workTickerTrack');
  const sourceCards = Array.from(document.querySelectorAll('#projectsGrid .project-card'));

  if (tickerTrack && sourceCards.length) {
    const itemsData = sourceCards.map((card, i) => ({
      index: i,
      category: card.dataset.category || '',
      title: card.querySelector('h3')?.textContent || '',
      desc: card.querySelector('p')?.textContent || ''
    }));

    const doubled = [...itemsData, ...itemsData];
    tickerTrack.innerHTML = doubled.map(item => `
      <div class="ticker-item" data-index="${item.index}" tabindex="0" role="button">
        <span class="ticker-cat">${item.category}</span>
        <h4>${item.title}</h4>
        <p>${item.desc}</p>
      </div>
    `).join('');

    let tickerHovered = false;
    let tickerRaf = null;

    function tickerStep() {
      if (!tickerHovered && !reduceMotion) {
        tickerTrack.scrollLeft += 0.6;
        const halfWidth = tickerTrack.scrollWidth / 2;
        if (halfWidth > 0 && tickerTrack.scrollLeft >= halfWidth) {
          tickerTrack.scrollLeft -= halfWidth;
        }
      }
      tickerRaf = requestAnimationFrame(tickerStep);
    }
    tickerRaf = requestAnimationFrame(tickerStep);

    tickerTrack.addEventListener('mouseenter', () => { tickerHovered = true; });
    tickerTrack.addEventListener('mouseleave', () => { tickerHovered = false; });
    tickerTrack.addEventListener('focusin', () => { tickerHovered = true; });
    tickerTrack.addEventListener('focusout', () => { tickerHovered = false; });

    tickerTrack.addEventListener('click', e => {
      const item = e.target.closest('.ticker-item');
      if (!item) return;
      const idx = Number(item.dataset.index);
      const targetCard = sourceCards[idx];
      if (!targetCard) return;
      targetCard.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      targetCard.style.transition = 'box-shadow 0.3s ease, border-color 0.3s ease';
      targetCard.style.borderColor = 'var(--gold)';
      targetCard.style.boxShadow = '0 0 0 2px var(--gold-soft)';
      setTimeout(() => {
        targetCard.style.borderColor = '';
        targetCard.style.boxShadow = '';
      }, 1500);
    });
  }

  /* -----------------------------------------------------
     EXPERIENCE ACCORDION
  ----------------------------------------------------- */
  const tlItems = document.querySelectorAll('#experienceTimeline .tl-item');
  tlItems.forEach(item => {
    const head = item.querySelector('.tl-head');
    head?.addEventListener('click', () => {
      const wasActive = item.classList.contains('active');
      tlItems.forEach(i => i.classList.remove('active'));
      if (!wasActive) item.classList.add('active');
    });
  });

  /* -----------------------------------------------------
     COPY EMAIL TO CLIPBOARD
  ----------------------------------------------------- */
  const copyEmailBtn = document.getElementById('copyEmailBtn');
  copyEmailBtn?.addEventListener('click', () => {
    navigator.clipboard.writeText('shamillodhi@gmail.com').then(() => {
      const original = copyEmailBtn.textContent;
      copyEmailBtn.textContent = '✓ Copied';
      setTimeout(() => { copyEmailBtn.textContent = original; }, 2000);
    });
  });

  /* -----------------------------------------------------
     FOOTER YEAR
  ----------------------------------------------------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* -----------------------------------------------------
     MOBILE NAV TOGGLE
  ----------------------------------------------------- */
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  navToggle?.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });
  navLinks?.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      navToggle?.setAttribute('aria-expanded', 'false');
    });
  });

  /* -----------------------------------------------------
     ACTIVE NAV LINK ON SCROLL
  ----------------------------------------------------- */
  const navAnchors = Array.from(document.querySelectorAll('[data-nav]'));
  const navSections = navAnchors
    .map(a => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);

  if ('IntersectionObserver' in window && navSections.length) {
    const navObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          navAnchors.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${entry.target.id}`));
        });
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
    );
    navSections.forEach(s => navObserver.observe(s));
  }

  /* -----------------------------------------------------
     TYPING ANIMATION (hero)
  ----------------------------------------------------- */
  const typingEl = document.getElementById('typingText');
  const roles = ['fast web apps.', 'clean APIs.', 'accessible UI.', 'reliable systems.'];

  async function typeLoop() {
    if (!typingEl) return;
    if (reduceMotion) {
      typingEl.textContent = roles[0];
      return;
    }
    let roleIndex = 0;
    while (true) {
      const word = roles[roleIndex];
      for (let i = 1; i <= word.length; i++) {
        typingEl.textContent = word.slice(0, i);
        await sleep(45);
      }
      await sleep(1200);
      for (let i = word.length; i >= 0; i--) {
        typingEl.textContent = word.slice(0, i);
        await sleep(25);
      }
      await sleep(300);
      roleIndex = (roleIndex + 1) % roles.length;
    }
  }
  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
  typeLoop();

  /* -----------------------------------------------------
     STATISTICS COUNTER (count-up on scroll into view)
  ----------------------------------------------------- */
  const statNumbers = document.querySelectorAll('.stat-number');

  function animateCount(el) {
    const target = parseInt(el.dataset.target, 10) || 0;
    const suffix = el.dataset.suffix || '';
    if (reduceMotion) {
      el.textContent = target + suffix;
      return;
    }
    const duration = 1400;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  if ('IntersectionObserver' in window && statNumbers.length) {
    const statObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            statObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    statNumbers.forEach(el => statObserver.observe(el));
  }

  /* -----------------------------------------------------
     ANIMATED SKILL PROGRESS BARS
  ----------------------------------------------------- */
  const skillBars = document.querySelectorAll('.skill-bar');

  if ('IntersectionObserver' in window && skillBars.length) {
    const skillObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const bar = entry.target;
          const percent = parseInt(bar.dataset.percent, 10) || 0;
          const fill = bar.querySelector('.skill-fill');
          const label = bar.querySelector('.skill-percent');
          requestAnimationFrame(() => {
            if (fill) fill.style.width = percent + '%';
          });
          if (label) {
            if (reduceMotion) {
              label.textContent = percent + '%';
            } else {
              let current = 0;
              const step = () => {
                current += 2;
                if (current >= percent) { label.textContent = percent + '%'; return; }
                label.textContent = current + '%';
                requestAnimationFrame(step);
              };
              step();
            }
          }
          skillObserver.unobserve(bar);
        });
      },
      { threshold: 0.4 }
    );
    skillBars.forEach(bar => skillObserver.observe(bar));
  }

  /* -----------------------------------------------------
     PROJECT FILTER
  ----------------------------------------------------- */
  const filterButtons = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');
  const filterEmpty = document.getElementById('filterEmpty');

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      const filter = btn.dataset.filter;
      let visibleCount = 0;
      projectCards.forEach(card => {
        const match = filter === 'all' || card.dataset.category === filter;
        card.classList.toggle('hide', !match);
        if (match) visibleCount++;
      });
      if (filterEmpty) filterEmpty.hidden = visibleCount !== 0;
    });
  });

  /* -----------------------------------------------------
     CERTIFICATES — lightbox modal
  ----------------------------------------------------- */
  const certCards = document.querySelectorAll('.cert-card');
  const certModal = document.getElementById('certModal');
  const certModalClose = document.getElementById('certModalClose');
  const certModalTitle = document.getElementById('certModalTitle');
  const certModalIssuer = document.getElementById('certModalIssuer');
  const certModalDate = document.getElementById('certModalDate');
  const certModalSeal = document.getElementById('certModalSeal');
  let lastFocusedCert = null;

  function openCertModal(card) {
    if (!certModal) return;
    certModalTitle.textContent = card.dataset.title || '';
    certModalIssuer.textContent = card.dataset.issuer || '';
    certModalDate.textContent = card.dataset.date || '';
    certModalSeal.textContent = card.querySelector('.cert-seal')?.textContent || '★';
    lastFocusedCert = card;
    certModal.hidden = false;
    certModalClose?.focus();
  }
  function closeCertModal() {
    if (!certModal) return;
    certModal.hidden = true;
    lastFocusedCert?.focus();
  }

  certCards.forEach(card => card.addEventListener('click', () => openCertModal(card)));
  certModalClose?.addEventListener('click', closeCertModal);
  certModal?.addEventListener('click', e => { if (e.target === certModal) closeCertModal(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && certModal && !certModal.hidden) closeCertModal();
  });

  /* -----------------------------------------------------
     TESTIMONIALS SLIDER
  ----------------------------------------------------- */
  const sliderTrack = document.getElementById('sliderTrack');
  const sliderPrev = document.getElementById('sliderPrev');
  const sliderNext = document.getElementById('sliderNext');
  const sliderDotsWrap = document.getElementById('sliderDots');
  const slides = sliderTrack ? Array.from(sliderTrack.children) : [];
  let slideIndex = 0;
  let autoplayTimer = null;

  function buildDots() {
    if (!sliderDotsWrap) return;
    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.setAttribute('aria-label', `Go to testimonial ${i + 1}`);
      if (i === 0) dot.classList.add('active');
      dot.addEventListener('click', () => goToSlide(i));
      sliderDotsWrap.appendChild(dot);
    });
  }

  function goToSlide(i) {
    slideIndex = (i + slides.length) % slides.length;
    if (sliderTrack) sliderTrack.style.transform = `translateX(-${slideIndex * 100}%)`;
    sliderDotsWrap?.querySelectorAll('button').forEach((d, idx) => d.classList.toggle('active', idx === slideIndex));
  }

  function startAutoplay() {
    if (reduceMotion) return;
    stopAutoplay();
    autoplayTimer = setInterval(() => goToSlide(slideIndex + 1), 6000);
  }
  function stopAutoplay() { if (autoplayTimer) clearInterval(autoplayTimer); }

  if (slides.length) {
    buildDots();
    sliderNext?.addEventListener('click', () => { goToSlide(slideIndex + 1); startAutoplay(); });
    sliderPrev?.addEventListener('click', () => { goToSlide(slideIndex - 1); startAutoplay(); });

    const sliderEl = document.getElementById('testimonialSlider');
    sliderEl?.addEventListener('mouseenter', stopAutoplay);
    sliderEl?.addEventListener('mouseleave', startAutoplay);
    sliderEl?.addEventListener('focusin', stopAutoplay);
    sliderEl?.addEventListener('focusout', startAutoplay);

    // basic touch swipe support
    let touchStartX = 0;
    sliderEl?.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
    sliderEl?.addEventListener('touchend', e => {
      const delta = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(delta) > 40) goToSlide(slideIndex + (delta < 0 ? 1 : -1));
      startAutoplay();
    }, { passive: true });

    startAutoplay();
  }

  /* -----------------------------------------------------
     SCROLL TO TOP BUTTON
  ----------------------------------------------------- */
  const scrollTopBtn = document.getElementById('scrollTop');
  if (scrollTopBtn) {
    scrollTopBtn.hidden = false;
    window.addEventListener('scroll', () => {
      scrollTopBtn.classList.toggle('visible', window.scrollY > 500);
    });
    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* -----------------------------------------------------
     CONTACT FORM VALIDATION
  ----------------------------------------------------- */
  const form = document.getElementById('contactForm');
  const formStatus = document.getElementById('formStatus');
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function setFieldError(fieldId, message) {
    const group = document.getElementById(fieldId)?.closest('.form-group');
    const errorEl = document.getElementById(`err-${fieldId.replace('cf-', '')}`);
    if (group) group.classList.toggle('invalid', Boolean(message));
    if (errorEl) errorEl.textContent = message || '';
  }

  form?.addEventListener('submit', e => {
    e.preventDefault();
    let valid = true;

    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const subject = form.subject.value.trim();
    const message = form.message.value.trim();

    if (!name) { setFieldError('cf-name', 'Please enter your name.'); valid = false; }
    else setFieldError('cf-name', '');

    if (!email) { setFieldError('cf-email', 'Please enter your email.'); valid = false; }
    else if (!emailPattern.test(email)) { setFieldError('cf-email', 'That email address looks malformed.'); valid = false; }
    else setFieldError('cf-email', '');

    if (!subject) { setFieldError('cf-subject', 'Please add a subject.'); valid = false; }
    else setFieldError('cf-subject', '');

    if (!message || message.length < 10) { setFieldError('cf-message', 'Message should be at least 10 characters.'); valid = false; }
    else setFieldError('cf-message', '');

    if (!valid) {
      if (formStatus) {
        formStatus.textContent = 'Please fix the highlighted fields.';
        formStatus.className = 'form-status err';
      }
      return;
    }

    // No backend wired up here — replace this block with a fetch()
    // call to your own endpoint or a form service (e.g. Formspree)
    // when you deploy this for real.
    if (formStatus) {
      formStatus.textContent = `Thanks, ${name} — your message is queued. I'll reply to ${email} soon.`;
      formStatus.className = 'form-status ok';
    }
    form.reset();
  });

  /* -----------------------------------------------------
     VISITOR COUNTER
     This is a lightweight, session-only placeholder: it
     starts from a plausible base and ticks up on load, but
     it can't persist across visits without a backend (and
     this environment disallows localStorage/sessionStorage).
     To make it real, point it at a small API — e.g. a
     Cloudflare Worker + KV, or a service like CountAPI —
     that returns and increments a stored count server-side.
  ----------------------------------------------------- */
  const visitorCountEl = document.getElementById('visitorCount');
  if (visitorCountEl) {
    const baseCount = 4200 + Math.floor(Math.random() * 300);
    visitorCountEl.textContent = baseCount.toLocaleString();
  }
})();
