/* ============================================
   EXPLORIA RESORTS – POCONOS CAMPAIGN
   Vanilla JS (converted from React)
   ============================================ */

/* ---- URL Param Utilities ---- */
function getDecodedParam(name) {
  const params = new URLSearchParams(window.location.search);
  const val = params.get(name);
  if (!val) return null;
  try { return atob(val); } catch { return val; }
}

function getFirstName() {
  const raw = getDecodedParam('fn');
  if (!raw) return null;
  return raw.trim().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

/* ---- Scroll to section ---- */
function scrollToSection(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const offset = 140;
  const top = el.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top, behavior: 'smooth' });
}

/* ============================================
   NAVIGATION
   ============================================ */
function initNav() {
  const hamburger = document.getElementById('nav-hamburger');
  const mobileMenu = document.getElementById('nav-mobile');

  hamburger.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
    const icon = hamburger.querySelector('svg use');
    if (mobileMenu.classList.contains('open')) {
      hamburger.querySelector('svg use').setAttribute('href', '#icon-x');
    } else {
      hamburger.querySelector('svg use').setAttribute('href', '#icon-menu');
    }
  });

  // Close mobile menu on nav link click
  document.querySelectorAll('.nav-mobile-link, .nav-link').forEach(btn => {
    btn.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      hamburger.querySelector('svg use').setAttribute('href', '#icon-menu');
    });
  });

  // Nav scroll links
  document.querySelectorAll('[data-scroll-to]').forEach(el => {
    el.addEventListener('click', () => scrollToSection(el.dataset.scrollTo));
  });
}

/* ============================================
   SCROLL EFFECTS (sticky bar, scroll-to-top, progress)
   ============================================ */
function initScrollEffects() {
  const heroSection     = document.getElementById('hero');
  const stickyBar       = document.getElementById('sticky-mobile-bar');
  const scrollTopBtn    = document.getElementById('scroll-top-btn');
  const progressCircle  = document.getElementById('scroll-progress-circle');
  const circumference   = 2 * Math.PI * 21;

  let ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const scrollY = window.scrollY;
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docH > 0 ? Math.min(scrollY / docH, 1) : 0;

      // Sticky mobile bar
      if (heroSection) {
        const heroBottom = heroSection.getBoundingClientRect().bottom;
        stickyBar.classList.toggle('visible', heroBottom < 0);
      } else {
        stickyBar.classList.toggle('visible', scrollY > 300);
      }

      // Scroll top button
      scrollTopBtn.classList.toggle('visible', progress > 0.05);

      // Progress ring
      if (progressCircle) {
        progressCircle.style.strokeDashoffset = circumference * (1 - progress);
      }

      ticking = false;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ============================================
   SCROLL ANIMATIONS (IntersectionObserver)
   ============================================ */
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.scroll-animate, .scroll-fade, .scroll-left, .scroll-right, .scroll-scale').forEach(el => {
    observer.observe(el);
  });
}

/* ============================================
   AUTO-SCROLLING GALLERY
   ============================================ */
function initGallery() {
  const track = document.getElementById('gallery-track');
  if (!track) return;

  let position = 0;
  let velocity = 0;
  let isScrolling = true;
  let isMomentum = false;
  let rafId;
  const autoSpeed = 0.5;
  const friction = 0.95;
  const minVelocity = 0.1;

  const touch = { startX: 0, startY: 0, lastX: 0, lastTime: 0, startPos: 0, direction: null };

  function getHalfWidth() { return track.scrollWidth / 2; }

  function wrapPosition() {
    const half = getHalfWidth();
    if (position <= -half) position += half;
    else if (position > 0) position -= half;
  }

  function animate() {
    if (isMomentum) {
      velocity *= friction;
      position += velocity;
      if (Math.abs(velocity) < minVelocity) { velocity = 0; isMomentum = false; isScrolling = true; }
    } else if (isScrolling) {
      position -= autoSpeed;
    }
    wrapPosition();
    track.style.transform = `translateX(${position}px)`;
    rafId = requestAnimationFrame(animate);
  }

  rafId = requestAnimationFrame(animate);

  // Mouse hover: pause
  track.addEventListener('mouseenter', () => { isScrolling = false; });
  track.addEventListener('mouseleave', () => { isScrolling = true; });

  // Touch
  track.addEventListener('touchstart', e => {
    isScrolling = false; isMomentum = false; velocity = 0;
    Object.assign(touch, {
      startX: e.touches[0].clientX, startY: e.touches[0].clientY,
      lastX: e.touches[0].clientX, lastTime: Date.now(),
      startPos: position, direction: null
    });
  }, { passive: true });

  track.addEventListener('touchmove', e => {
    const cx = e.touches[0].clientX, cy = e.touches[0].clientY;
    if (!touch.direction) {
      const dx = Math.abs(cx - touch.startX), dy = Math.abs(cy - touch.startY);
      if (dx < 5 && dy < 5) return;
      touch.direction = dx > dy ? 'horizontal' : 'vertical';
    }
    if (touch.direction === 'vertical') return;
    if (e.cancelable) e.preventDefault();
    const now = Date.now(), dt = now - touch.lastTime || 16;
    velocity = (cx - touch.lastX) / dt * 16;
    touch.lastX = cx; touch.lastTime = now;
    position = touch.startPos + (cx - touch.startX);
    wrapPosition();
    track.style.transform = `translateX(${position}px)`;
  }, { passive: false });

  track.addEventListener('touchend', () => {
    if (Math.abs(velocity) > 0.5) { isMomentum = true; } else { isScrolling = true; }
    touch.direction = null;
  });
}

/* ============================================
   GENERIC CAROUSEL
   ============================================ */
function createCarousel(wrapId, images) {
  const wrap = document.getElementById(wrapId);
  if (!wrap) return;

  const imgEl    = wrap.querySelector('.carousel-img');
  const prevBtn  = wrap.querySelector('.carousel-prev');
  const nextBtn  = wrap.querySelector('.carousel-next');
  const dotsWrap = wrap.querySelector('.carousel-dots');
  const labelEl  = wrap.querySelector('.carousel-label');
  const counterEl= wrap.querySelector('.carousel-counter');
  const thumbsWrap = wrap.querySelector('.carousel-thumbs');

  let current = 0;

  function goTo(idx) {
    current = (idx + images.length) % images.length;
    if (imgEl) { imgEl.style.opacity = 0; setTimeout(() => { imgEl.src = images[current].src; imgEl.alt = images[current].label; imgEl.style.opacity = 1; }, 150); }
    if (labelEl) labelEl.textContent = images[current].label;
    if (counterEl) counterEl.textContent = `${current + 1} of ${images.length}`;
    // Update dots
    if (dotsWrap) {
      dotsWrap.querySelectorAll('.accom-dot').forEach((d, i) => d.classList.toggle('active', i === current));
    }
    // Update thumbs
    if (thumbsWrap) {
      thumbsWrap.querySelectorAll('.thumb-btn').forEach((t, i) => t.classList.toggle('active', i === current));
    }
  }

  if (prevBtn) prevBtn.addEventListener('click', () => goTo(current - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => goTo(current + 1));

  if (dotsWrap) {
    dotsWrap.querySelectorAll('.accom-dot').forEach((dot, i) => {
      dot.addEventListener('click', () => goTo(i));
    });
  }
  if (thumbsWrap) {
    thumbsWrap.querySelectorAll('.thumb-btn').forEach((tb, i) => {
      tb.addEventListener('click', () => goTo(i));
    });
  }

  // Init
  goTo(0);
}

/* ============================================
   OFFER SHOWCASE CAROUSEL
   ============================================ */
function initOfferCarousel() {
  const showcaseImages = [
    { src: 'images/resort/living-room.webp',    label: 'Living Room' },
    { src: 'images/resort/one-bedroom.webp',    label: 'Master Bedroom' },
    { src: 'images/resort/kitchen-suite.webp',  label: 'Full Kitchen' },
    { src: 'images/resort/bathroom.webp',       label: 'Spa Bathroom' },
    { src: 'images/resort/private-balcony.webp',label: 'Patio or Balcony' },
  ];
  createCarousel('offer-carousel', showcaseImages);
}

/* ============================================
   ACCOMMODATION CAROUSELS
   ============================================ */
function initAccomCarousels() {
  const accommodationImages = [
    { src: 'images/gallery/4.webp',              label: '18-Hole Golf Course' },
    { src: 'images/resort/bed.webp',             label: '1-Bedroom Villa' },
    { src: 'images/gallery/7.webp',              label: 'Accommodations' },
    { src: 'images/resort/outdoor-activities.webp', label: 'Pool & Recreation' },
    { src: 'images/gallery/2.webp',              label: 'Accommodations' },
  ];
  const condoImages = [
    { src: 'images/resort/bed.webp',     label: 'One Bedroom Condo' },
    { src: 'images/resort/kitchen.webp', label: 'One Bedroom Condo' },
    { src: 'images/resort/sala.webp',    label: 'One Bedroom Condo' },
    { src: 'images/resort/exterior.webp',label: 'One Bedroom Condo' },
  ];
  const resortImages = [
    { src: 'images/gallery/mexico.webp',      label: 'Resort Condo Stay' },
    { src: 'images/gallery/canada.webp',      label: 'Resort Condo Stay' },
    { src: 'images/lifestyle/caribbean2.webp',label: 'Resort Condo Stay' },
    { src: 'images/lifestyle/couple.webp',    label: 'Resort Condo Stay' },
  ];
  const thingsImages = [
    { src: 'images/activities/railway.webp',      label: 'Lehigh Gorge Railway' },
    { src: 'images/activities/raceway.webp',       label: 'Pocono Raceway' },
    { src: 'images/activities/bushkill-falls.webp',label: 'Bushkill Falls' },
    { src: 'images/gallery/lehigh-river.webp',     label: 'Lehigh River' },
  ];

  createCarousel('accom-carousel-1', accommodationImages);
  createCarousel('accom-carousel-2', condoImages);
  createCarousel('accom-carousel-3', resortImages);
  createCarousel('accom-carousel-4', thingsImages);
}

/* ============================================
   FAQ ACCORDION
   ============================================ */
function initFAQ() {
  document.querySelectorAll('.faq-item').forEach(item => {
    const btn = item.querySelector('.faq-question');
    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });
}

/* ============================================
   GALLERY LIGHTBOX
   ============================================ */
const galleryImages = [
  { src: 'images/gallery/4.webp',              label: '18-Hole Golf Course' },
  { src: 'images/resort/bed.webp',             label: '1-Bedroom Villa' },
  { src: 'images/gallery/7.webp',              label: 'Accommodations' },
  { src: 'images/resort/outdoor-activities.webp', label: 'Pool & Recreation' },
  { src: 'images/gallery/2.webp',              label: 'Accommodations' },
  { src: 'images/gallery/5.webp',              label: 'Outdoor Activities' },
  { src: 'images/resort/warehouse.webp',       label: 'On-site Dining' },
  { src: 'images/gallery/6.webp',              label: 'Poconos Scenery' },
  { src: 'images/gallery/3.webp',              label: 'Resort Views' },
];

let galleryLightboxIndex = null;

function openGalleryLightbox(idx) {
  galleryLightboxIndex = ((idx % galleryImages.length) + galleryImages.length) % galleryImages.length;
  updateGalleryLightbox();
  const backdrop = document.getElementById('gallery-lightbox');
  backdrop.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeGalleryLightbox() {
  document.getElementById('gallery-lightbox').classList.remove('open');
  document.body.style.overflow = '';
  galleryLightboxIndex = null;
}

function updateGalleryLightbox() {
  if (galleryLightboxIndex === null) return;
  const img = galleryImages[galleryLightboxIndex];
  document.getElementById('gallery-lightbox-img').src = img.src;
  document.getElementById('gallery-lightbox-img').alt = img.label;
  document.getElementById('gallery-lightbox-label').textContent = img.label;
  document.getElementById('gallery-lightbox-counter').textContent = `${galleryLightboxIndex + 1} / ${galleryImages.length}`;
}

function initGalleryLightbox() {
  const backdrop = document.getElementById('gallery-lightbox');

  backdrop.addEventListener('click', e => {
    if (e.target === backdrop || e.target.classList.contains('gallery-modal-backdrop')) closeGalleryLightbox();
  });

  document.getElementById('gallery-lightbox-close').addEventListener('click', closeGalleryLightbox);
  document.getElementById('gallery-lightbox-prev').addEventListener('click', e => {
    e.stopPropagation();
    galleryLightboxIndex = (galleryLightboxIndex - 1 + galleryImages.length) % galleryImages.length;
    updateGalleryLightbox();
  });
  document.getElementById('gallery-lightbox-next').addEventListener('click', e => {
    e.stopPropagation();
    galleryLightboxIndex = (galleryLightboxIndex + 1) % galleryImages.length;
    updateGalleryLightbox();
  });

  // Gallery items click
  document.querySelectorAll('.gallery-item').forEach((item, i) => {
    item.addEventListener('click', () => openGalleryLightbox(i % galleryImages.length));
  });
}

/* ============================================
   MODALS (Terms, Privacy, Testimonial)
   ============================================ */
function openModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('open');
  document.body.style.overflow = '';
}

function initModals() {
  // Terms
  document.querySelectorAll('[data-open-modal]').forEach(btn => {
    btn.addEventListener('click', () => openModal(btn.dataset.openModal));
  });
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.closeModal));
  });

  // Close on backdrop click
  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', e => {
      if (e.target === backdrop) closeModal(backdrop.id);
    });
  });

  // ESC key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop.open, .gallery-modal-backdrop.open, .bento-lightbox.open').forEach(el => {
        el.classList.remove('open');
        document.body.style.overflow = '';
        galleryLightboxIndex = null;
      });
    }
  });
}

/* ============================================
   TESTIMONIAL MODAL
   ============================================ */
const testimonials = [
  { quote: "30+ year owner the place has never looked nicer a lot of effort went into refurbishing the units and grounds. The Warehouse restaurant has nice atmosphere and great food. Close to many Pocono attractions. There is a golf course. you can walk around the lake. the staff is friendly. the rooms are clean. the grounds are well maintained. lots of happy friendly people. great restaurants are close by.", name: "anthonymarino38", title: "Verified Owner", theme: "orange" },
  { quote: "I'm a New Owner This is a great investment for couples like my wife and I.. We love weekend getaways and Exploria makes life easy There are hundreds pf places within driving distance and now we can go anywhere is the US whenever we want", name: "kevinN6489FO", title: "Verified Owner", theme: "teal" },
  { quote: "Excellent Stay I stayed at one of the newly renovated units and was extremely impressed with the upgrade. After being an owner for approximately 10 years, I felt valued and it definitely felt like home away from home for me and my family.", name: "nnirichards", title: "Verified Owner", theme: "orange" },
  { quote: "Lovely property I've been a timeshare owner for many years and under Exploria, Pocono Mountains is again shining as a premier place to stay. The units are clean, the amenities are pretty good and the area has other activities that you may not find on the property.", name: "Helen C W", title: "Verified Owner", theme: "teal" }
];

function openTestimonialModal(t) {
  const modal = document.getElementById('testimonial-modal');
  const quoteIcon = modal.querySelector('.testimonial-modal-quote');
  const textEl = modal.querySelector('.testimonial-modal-text');
  const nameEl = modal.querySelector('.testimonial-modal-name');
  const titleEl = modal.querySelector('.testimonial-modal-title-text');

  quoteIcon.className = `testimonial-modal-quote ${t.theme}`;
  textEl.textContent = `"${t.quote}"`;
  nameEl.textContent = t.name;
  titleEl.textContent = t.title;

  openModal('testimonial-modal');
}

function initTestimonials() {
  document.querySelectorAll('.testimonial-read-more').forEach((btn, i) => {
    btn.addEventListener('click', () => openTestimonialModal(testimonials[i]));
  });
}

/* ============================================
   EXPLORE POCONOS BENTO
   ============================================ */
const bentoItems = [
  { id: 1, title: 'Lehigh Gorge Scenic Railway', image: 'images/activities/railway.webp', description: "A breathtaking railroad journey through one of Pennsylvania's most stunning natural gorges.", location: 'Jim Thorpe, PA — 45 miles from resort', highlights: ['Scenic gorge views', 'Historic Jim Thorpe', 'Seasonal excursions', 'Fall foliage rides'] },
  { id: 2, title: 'Bushkill Falls', image: 'images/activities/bushkill-falls.webp', description: "Pennsylvania's Niagara — stunning waterfalls and scenic hiking trails.", location: 'Bushkill, PA — 25 miles from resort', highlights: ['8 scenic waterfalls', 'Miles of hiking trails', 'Paddleboating', 'Nature & wildlife exhibits'] },
  { id: 3, title: 'Pocono Raceway', image: 'images/activities/raceway.webp', description: 'Home of NASCAR\'s iconic "Tricky Triangle" and unforgettable race experiences.', location: 'Long Pond, PA — 30 miles from resort', highlights: ['NASCAR race events', 'Fan Zone experiences', 'Infield access', 'Camping & tailgating'] },
  { id: 4, title: 'Kalahari Resorts', image: 'images/activities/kalahari-waterswing.webp', description: "America's largest indoor waterpark resort, perfect for family fun year-round.", location: 'Pocono Manor, PA — 10 miles from resort', highlights: ['100,000+ sq ft indoor waterpark', 'Family rides & attractions', 'Full-service spa', 'Dining & entertainment'] },
  { id: 5, title: 'Premium Outlets', image: 'images/activities/shopping.webp', description: 'Tannersville Crossings Premium Outlets and top shopping destinations nearby.', location: 'Multiple locations near Poconos', hours: 'Mon–Sat 10am–9pm, Sun 10am–7pm', highlights: ['180+ brand-name stores', 'Up to 65% off retail', 'Dining options', 'Savings on select items'] },
  { id: 6, title: 'Pocono Mountains Skiing', image: 'images/activities/skiing.webp', description: 'World-class ski resorts including Blue Mountain and Jack Frost/Big Boulder.', location: 'Poconos, PA — 15 miles from resort', hours: 'Daily 9am–9pm (hours vary by season)', highlights: ['Skiing & snowboarding', 'Snow tubing', 'Terrain parks', 'Ski & snowboard lessons'] }
];

function openBentoLightbox(item) {
  const lightbox = document.getElementById('bento-lightbox');
  lightbox.querySelector('.bento-lightbox-img img').src = item.image;
  lightbox.querySelector('.bento-lightbox-img img').alt = item.title;
  lightbox.querySelector('.bento-lightbox-img-title h3').textContent = item.title;
  lightbox.querySelector('.bento-lightbox-desc').textContent = item.description;
  lightbox.querySelector('.bento-location').textContent = item.location;

  const hoursRow = lightbox.querySelector('.bento-hours-row');
  if (item.hours) {
    hoursRow.querySelector('span').textContent = item.hours;
    hoursRow.style.display = 'flex';
  } else {
    hoursRow.style.display = 'none';
  }

  const hList = lightbox.querySelector('.bento-highlights-list');
  hList.innerHTML = item.highlights.map(h =>
    `<li class="bento-highlight"><span class="bento-highlight-dot"></span>${h}</li>`
  ).join('');

  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function initBento() {
  document.querySelectorAll('.bento-item').forEach((item, i) => {
    item.addEventListener('click', () => openBentoLightbox(bentoItems[i]));
  });

  const lightbox = document.getElementById('bento-lightbox');
  lightbox.querySelector('.bento-lightbox-backdrop').addEventListener('click', () => {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  });
  lightbox.querySelector('.bento-lightbox-close').addEventListener('click', () => {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  });
}

/* ============================================
   PERSONALIZATION (first name greeting)
   ============================================ */
function initPersonalization() {
  const firstName = getFirstName();
  document.querySelectorAll('.hero-first-name').forEach(el => {
    if (firstName) {
      el.innerHTML = `Hi, <strong style="color:#00897b">${firstName}</strong>!`;
    } else {
      el.textContent = 'Hi there!';
    }
  });
}

/* ============================================
   INIT ALL
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initScrollEffects();
  initScrollAnimations();
  initGallery();
  initOfferCarousel();
  initAccomCarousels();
  initFAQ();
  initGalleryLightbox();
  initModals();
  initTestimonials();
  initBento();
  initPersonalization();
});
