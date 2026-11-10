document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Sticky header ---------- */
  const header = document.getElementById('siteHeader');
  const backToTop = document.getElementById('backToTop');
  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
    backToTop.classList.toggle('visible', window.scrollY > 500);
  };
  window.addEventListener('scroll', onScroll);
  onScroll();

  /* ---------- Mobile nav toggle ---------- */
  const navToggle = document.getElementById('navToggle');
  const mainNav = document.getElementById('mainNav');
  navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('open');
    mainNav.classList.toggle('open');
  });
  mainNav.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      navToggle.classList.remove('open');
      mainNav.classList.remove('open');
    });
  });

  /* ---------- Active nav link on scroll ---------- */
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(l => l.classList.remove('active'));
        const active = document.querySelector(`.nav-link[href="#${entry.target.id}"]`);
        if (active) active.classList.add('active');
      }
    });
  }, { rootMargin: '-50% 0px -45% 0px' });
  sections.forEach(s => sectionObserver.observe(s));

  /* ---------- Reveal on scroll ----------
     Plain scroll/resize polling instead of IntersectionObserver: some browser
     contexts never fire the observer callback for elements that are already
     laid out, which left whole sections stuck at opacity:0. Polling on
     scroll/resize (with a small viewport margin) is slower to set up but
     can't get permanently stuck. */
  const revealEls = Array.from(document.querySelectorAll('.reveal'));
  const isNearViewport = (el, margin = 100) => {
    const r = el.getBoundingClientRect();
    return r.bottom > -margin && r.top < window.innerHeight + margin;
  };
  let pendingReveal = revealEls.slice();
  const checkReveal = () => {
    pendingReveal = pendingReveal.filter(el => {
      if (isNearViewport(el)) {
        el.classList.add('in-view');
        return false;
      }
      return true;
    });
    if (!pendingReveal.length) {
      window.removeEventListener('scroll', checkReveal);
      window.removeEventListener('resize', checkReveal);
    }
  };
  checkReveal();
  window.addEventListener('scroll', checkReveal, { passive: true });
  window.addEventListener('resize', checkReveal);
  // Safety net: force-reveal everything after 4s regardless of scroll state.
  setTimeout(() => revealEls.forEach(el => el.classList.add('in-view')), 4000);

  /* ---------- Animated hero stat counters ---------- */
  const counters = document.querySelectorAll('[data-count]');
  const animateCounter = (el) => {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimal || '0', 10);
    const duration = 1400;
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const value = target * progress;
      el.textContent = decimals ? value.toFixed(decimals) : Math.floor(value).toLocaleString('en-IN');
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = decimals ? target.toFixed(decimals) : target.toLocaleString('en-IN');
    };
    requestAnimationFrame(step);
  };
  let pendingCounters = Array.from(counters);
  const checkCounters = () => {
    pendingCounters = pendingCounters.filter(el => {
      if (isNearViewport(el, 0)) {
        animateCounter(el);
        return false;
      }
      return true;
    });
    if (!pendingCounters.length) {
      window.removeEventListener('scroll', checkCounters);
      window.removeEventListener('resize', checkCounters);
    }
  };
  checkCounters();
  window.addEventListener('scroll', checkCounters, { passive: true });
  window.addEventListener('resize', checkCounters);
  setTimeout(() => { pendingCounters.forEach(animateCounter); pendingCounters = []; }, 4000);

  /* ---------- Gallery filter ---------- */
  const filterBtns = document.querySelectorAll('.filter-btn');
  const galleryItems = document.querySelectorAll('.gallery-item');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      galleryItems.forEach(item => {
        const show = filter === 'all' || item.dataset.cat === filter;
        item.classList.toggle('hidden', !show);
      });
    });
  });

  /* ---------- Testimonial slider ---------- */
  const track = document.getElementById('testimonialTrack');
  const cards = track ? Array.from(track.children) : [];
  const dotsWrap = document.getElementById('testimonialDots');
  let current = 0;
  let autoTimer;

  cards.forEach((_, i) => {
    const dot = document.createElement('button');
    if (i === 0) dot.classList.add('active');
    dot.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(dot);
  });
  const dots = Array.from(dotsWrap.children);

  function goTo(index) {
    cards[current].classList.remove('active');
    dots[current].classList.remove('active');
    current = (index + cards.length) % cards.length;
    cards[current].classList.add('active');
    dots[current].classList.add('active');
  }

  document.getElementById('tPrev').addEventListener('click', () => { goTo(current - 1); resetAuto(); });
  document.getElementById('tNext').addEventListener('click', () => { goTo(current + 1); resetAuto(); });

  function resetAuto() {
    clearInterval(autoTimer);
    autoTimer = setInterval(() => goTo(current + 1), 6000);
  }

  if (cards.length) {
    cards[0].classList.add('active');
    resetAuto();
  }

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.accordion-item').forEach(item => {
    const trigger = item.querySelector('.accordion-trigger');
    const panel = item.querySelector('.accordion-panel');
    trigger.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.accordion-item').forEach(other => {
        other.classList.remove('open');
        other.querySelector('.accordion-panel').style.maxHeight = null;
      });
      if (!isOpen) {
        item.classList.add('open');
        panel.style.maxHeight = panel.scrollHeight + 'px';
      }
    });
  });

  /* ---------- Forms: submit leads to the admin dashboard's API ----------
     The admin dashboard is a separate ASP.NET Core app (see AdminDashboard/),
     not this Node server, so this posts cross-origin. */
  const ADMIN_API_BASE = 'http://localhost:5181';
  const submitLead = (payload) => fetch(`${ADMIN_API_BASE}/api/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(async (res) => {
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || 'Request failed');
    }
    return res.json();
  });

  const heroForm = document.getElementById('heroForm');
  const heroFormMsg = document.getElementById('heroFormMsg');
  heroForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const payload = {
      phone: heroForm.phone.value,
      city: heroForm.city.value,
      source: 'hero-quick-form',
    };
    heroFormMsg.hidden = true;
    submitLead(payload)
      .then(() => {
        alert('Thanks! Our design expert will call you shortly.');
        heroForm.reset();
      })
      .catch(() => {
        heroFormMsg.textContent = 'Something went wrong. Please try again.';
        heroFormMsg.hidden = false;
      });
  });

  const contactForm = document.getElementById('contactForm');
  const formSuccess = document.getElementById('formSuccess');
  const formError = document.getElementById('formError');
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const payload = Object.fromEntries(new FormData(contactForm).entries());
    payload.source = 'contact-form';
    formError.hidden = true;
    formSuccess.hidden = true;
    submitLead(payload)
      .then(() => {
        formSuccess.hidden = false;
        contactForm.reset();
        setTimeout(() => { formSuccess.hidden = true; }, 10000);
      })
      .catch(() => {
        formError.hidden = false;
      });
  });

  /* ---------- Back to top ---------- */
  backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* ---------- Footer year ---------- */
  document.getElementById('year').textContent = new Date().getFullYear();
});
