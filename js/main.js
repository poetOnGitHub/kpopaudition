/* ============================================
   7th Room — Main JavaScript
   ============================================ */

(function () {
  'use strict';

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function isCoarsePointer() {
    return window.matchMedia('(pointer: coarse)').matches;
  }

  // Pointer-following decoration (parallax, magnetic buttons, sparkle trail,
  // card tilt) is for a mouse, and not for visitors who asked for less
  // motion. Asked when each effect starts up, like the two checks it replaces.
  function wantsPointerEffects() {
    return !prefersReducedMotion() && !isCoarsePointer();
  }

  // Explicit behavior: 'smooth' ignores the CSS scroll-behavior override,
  // so script-driven scrolls have to check the preference themselves.
  function scrollBehavior() {
    return prefersReducedMotion() ? 'auto' : 'smooth';
  }

  // A device whose main input is a finger: nothing to hover, click or drag
  // a file onto. Used to pick touch wording for prompts.
  function isTouchOnly() {
    return window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  }

  // Returns a function that runs `fn` at most once per animation frame,
  // however often it is called. The flag is cleared before `fn` runs, so an
  // error in `fn` cannot leave it stuck.
  function rafThrottle(fn) {
    var queued = false;
    return function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () {
        queued = false;
        fn();
      });
    };
  }

  // --- Scroll frame ---
  // One passive scroll listener and one animation frame per scroll for all
  // the scroll-linked effects. The callbacks run in the order they were
  // registered, which is the order of the init calls in initMain.
  var scrollFrameCallbacks = [];
  var queueScrollFrame = rafThrottle(function () {
    scrollFrameCallbacks.forEach(function (fn) {
      try {
        fn();
      } catch (err) {
        // One failing effect must not stop the others; still report it
        setTimeout(function () { throw err; }, 0);
      }
    });
  });

  function onScrollFrame(fn) {
    if (!scrollFrameCallbacks.length) {
      window.addEventListener('scroll', queueScrollFrame, { passive: true });
    }
    scrollFrameCallbacks.push(fn);
  }

  // Page scroll lock for the layers that cover the page: the mobile menu and
  // the success modal. (The intro uses the body.intro-active class instead,
  // which it drops while its overlay is still fading.)
  function lockScroll(on) {
    document.body.style.overflow = on ? 'hidden' : '';
  }

  // Keeps Tab / Shift+Tab inside `container` (an open dialog). Used as well
  // as, or instead of, the inert attribute, which older Safari lacks.
  function trapTabKey(e, container) {
    if (e.key !== 'Tab') return;
    var focusable = Array.prototype.filter.call(
      container.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'),
      function (el) { return !el.disabled; }
    );
    if (!focusable.length) {
      e.preventDefault();
      return;
    }
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    var active = document.activeElement;
    if (!container.contains(active)) {
      e.preventDefault();
      first.focus();
    } else if (e.shiftKey && (active === first || active === container)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }

  // Today's date in the visitor's own time zone, as YYYY-MM-DD (the format
  // of a date input's value, so the two compare as strings)
  function localDateString() {
    var now = new Date();
    return now.getFullYear() + '-' +
      String(now.getMonth() + 1).padStart(2, '0') + '-' +
      String(now.getDate()).padStart(2, '0');
  }

  // Performance video links: any YouTube host (www., m., music., youtu.be)
  // or a Google Drive / Docs share link, http(s) only, with something after
  // the host. Parsed with URL so look-alike hosts (notyoutube.com,
  // youtube.com.evil.com, user@host tricks) are not accepted.
  function isAllowedVideoUrl(value) {
    var url;
    try {
      url = new URL(String(value).trim());
    } catch (e) {
      return false;
    }
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return false;
    var host = url.hostname.toLowerCase().replace(/\.$/, '');
    var allowedHost =
      host === 'youtube.com' || host.endsWith('.youtube.com') ||
      host === 'youtu.be' || host === 'www.youtu.be' ||
      host === 'drive.google.com' || host === 'docs.google.com';
    if (!allowedHost) return false;
    return (url.pathname + url.search).length > 1;
  }

  // --- Word-by-Word Text Reveal ---
  function initTextReveal() {
    var titles = document.querySelectorAll('.section-title');
    if (!titles.length) return;

    titles.forEach(function (title) {
      // Build word-reveal spans using DOM APIs (no innerHTML for security)
      var childNodes = Array.prototype.slice.call(title.childNodes);
      title.textContent = '';

      childNodes.forEach(function (node) {
        if (node.nodeType === 1 && node.tagName === 'BR') {
          title.appendChild(document.createElement('br'));
        } else {
          var text = node.textContent || '';
          var words = text.split(/\s+/).filter(function (w) { return w.length > 0; });
          words.forEach(function (word, i) {
            var span = document.createElement('span');
            span.className = 'word-reveal';
            span.textContent = word;
            title.appendChild(span);
            if (i < words.length - 1) title.appendChild(document.createTextNode(' '));
          });
        }
      });

      title.classList.add('text-reveal-ready');
    });

    // One gradient across the whole heading. Each word is its own clipped
    // box (it has to be: a gradient clipped to the text of the <h2> does not
    // survive the words' own opacity / transform animation), so every word
    // would otherwise restart the gradient at pink. Give each word a
    // gradient the size of the heading's text block, shifted back by the
    // word's own offset in it: together they show one continuous sweep.
    // offsetLeft / offsetTop are layout positions, so the reveal transform
    // on the words does not disturb them.
    function layoutTitleGradients() {
      titles.forEach(function (title) {
        var words = title.querySelectorAll('.word-reveal');
        if (!words.length) return;
        var boxes = [];
        var left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
        words.forEach(function (word) {
          var box = { x: word.offsetLeft, y: word.offsetTop, w: word.offsetWidth, h: word.offsetHeight };
          boxes.push(box);
          if (box.x < left) left = box.x;
          if (box.y < top) top = box.y;
          if (box.x + box.w > right) right = box.x + box.w;
          if (box.y + box.h > bottom) bottom = box.y + box.h;
        });
        var width = right - left;
        var height = bottom - top;
        // Not laid out (hidden): leave the per-word gradient from the CSS
        if (!(width > 0 && height > 0)) return;
        words.forEach(function (word, i) {
          word.style.backgroundSize = width + 'px ' + height + 'px';
          word.style.backgroundPosition = (left - boxes[i].x) + 'px ' + (top - boxes[i].y) + 'px';
        });
      });
    }

    var queueTitleGradients = rafThrottle(layoutTitleGradients);

    layoutTitleGradients();
    // Words move when the heading re-wraps (resize, rotation) and when the
    // web font replaces the fallback font
    window.addEventListener('resize', queueTitleGradients);
    window.addEventListener('load', queueTitleGradients);
    if (document.fonts) {
      if (document.fonts.ready) document.fonts.ready.then(queueTitleGradients);
      if (document.fonts.addEventListener) {
        document.fonts.addEventListener('loadingdone', queueTitleGradients);
      }
    }

    // Observe each title
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var words = entry.target.querySelectorAll('.word-reveal');
          words.forEach(function (word, i) {
            setTimeout(function () {
              word.classList.add('revealed');
            }, i * 100);
          });
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.2,
      rootMargin: '0px 0px -40px 0px'
    });

    titles.forEach(function (title) {
      observer.observe(title);
    });
  }

  // --- Scroll Reveal (Staggered) ---
  function initScrollReveal() {
    var revealElements = document.querySelectorAll('.reveal');
    if (!revealElements.length) return;

    // Blocks that enter together are revealed one after another
    var STAGGER_MS = 120;
    // A little longer than the 0.9s .reveal transition in style.css
    var REVEAL_DONE_MS = 1000;

    var observer = new IntersectionObserver(function (entries) {
      // Group siblings that enter at the same time for staggering
      var batch = [];
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          batch.push(entry.target);
          observer.unobserve(entry.target);
        }
      });
      batch.forEach(function (el, i) {
        el.style.transitionDelay = (i * STAGGER_MS) + 'ms';
        el.classList.add('visible');
        // Clean up delay after animation
        setTimeout(function () { el.style.transitionDelay = ''; }, REVEAL_DONE_MS + i * STAGGER_MS);
      });
    }, {
      // Threshold 0 with the 60px bottom margin: a block shows once 60px of
      // it are on screen. A ratio (it used to be 8%) kept tall blocks, the
      // form above all, invisible until hundreds of pixels were in view.
      threshold: 0,
      rootMargin: '0px 0px -60px 0px'
    });

    revealElements.forEach(function (el) {
      observer.observe(el);
    });
  }

  // --- Scroll-Linked Hero Effects ---
  function initScrollHero() {
    var heroContent = document.querySelector('.hero-content');
    var hero = document.getElementById('hero');
    if (!heroContent || !hero) return;
    // Scroll-linked zoom / parallax is decorative motion
    if (prefersReducedMotion()) return;

    onScrollFrame(function () {
      var scrollY = window.scrollY;
      var heroH = hero.offsetHeight;
      if (scrollY < heroH) {
        var progress = scrollY / heroH;
        var opacity = 1 - progress * 1.5;
        var scale = 1 - progress * 0.15;
        var translateY = scrollY * 0.4;
        heroContent.style.opacity = Math.max(0, opacity);
        heroContent.style.transform = 'translateY(' + translateY + 'px) scale(' + Math.max(0.85, scale) + ')';
      }
    });
  }

  // --- Scroll Progress Bar ---
  function initScrollProgress() {
    var bar = document.createElement('div');
    bar.className = 'scroll-progress';
    document.body.appendChild(bar);

    function update() {
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      var progress = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0;
      bar.style.width = Math.max(0, Math.min(100, progress)) + '%';
    }

    onScrollFrame(update);
    // The page height changes on rotation / resize
    window.addEventListener('resize', rafThrottle(update));
    // The page can already be scrolled when this runs (reload, /#apply link)
    update();
  }

  // --- Parallax Depth on Sections ---
  function initParallax() {
    if (!wantsPointerEffects()) return;

    var parallaxEls = document.querySelectorAll('.chatroom-window, .category-icon');
    if (!parallaxEls.length) return;

    onScrollFrame(function () {
      parallaxEls.forEach(function (el) {
        var rect = el.getBoundingClientRect();
        var windowH = window.innerHeight;
        if (rect.top < windowH && rect.bottom > 0) {
          var center = rect.top + rect.height / 2;
          var offset = (center - windowH / 2) / windowH;
          el.style.transform = 'translateY(' + (offset * -20) + 'px)';
        }
      });
    });
  }

  // --- Magnetic Buttons ---
  function initMagneticButtons() {
    if (!wantsPointerEffects()) return;

    var buttons = document.querySelectorAll('.btn-glossy, .btn-submit, .nav-links a');
    buttons.forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var rect = btn.getBoundingClientRect();
        var x = e.clientX - rect.left - rect.width / 2;
        var y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = 'translate(' + (x * 0.15) + 'px, ' + (y * 0.15 - 3) + 'px)';
      });
      // The stylesheet transition of each target covers transform, so the
      // button eases back by itself. (An inline transition here would
      // replace the whole list and make colours and shadows snap.)
      btn.addEventListener('mouseleave', function () {
        btn.style.transform = '';
      });
    });
  }

  // --- Navbar ---
  function initNavbar() {
    var navbar = document.getElementById('navbar');
    var navToggle = document.getElementById('navToggle');
    var navLinks = document.getElementById('navLinks');
    var links = navLinks.querySelectorAll('a');

    // Active section highlighting.
    // Worked out from the scroll position, not from an intersection ratio:
    // a ratio threshold can never be reached by a section much taller than
    // the screen (the form, and most sections on a phone). The current
    // section is the last one with a nav link whose top has passed a line
    // about a third of the way down the screen. Sections without a link
    // (Requirements) keep the link of the section before them; above the
    // first linked section (the hero) nothing is highlighted.
    var linkedSections = [];
    links.forEach(function (link) {
      var id = (link.getAttribute('href') || '').slice(1);
      var section = id ? document.getElementById(id) : null;
      if (section) linkedSections.push({ link: link, section: section });
    });
    var activeLink = null;

    function updateActiveLink() {
      var navBottom = navbar.getBoundingClientRect().bottom;
      var line = navBottom + (window.innerHeight - navBottom) * 0.3;
      var current = null;
      var currentTop = -Infinity;
      var last = null;
      var lastTop = -Infinity;
      linkedSections.forEach(function (item) {
        var top = item.section.getBoundingClientRect().top;
        if (top <= line && top > currentTop) { current = item.link; currentTop = top; }
        if (top > lastTop) { last = item.link; lastTop = top; }
      });
      // At the very bottom the last section is current, even when it is too
      // short for its top to reach the line (tall screens)
      var docEl = document.documentElement;
      if (last && window.scrollY > 0 &&
          window.scrollY + window.innerHeight >= docEl.scrollHeight - 2) {
        current = last;
      }
      if (current === activeLink) return;
      if (activeLink) {
        activeLink.classList.remove('active');
        activeLink.removeAttribute('aria-current');
      }
      if (current) {
        current.classList.add('active');
        current.setAttribute('aria-current', 'location');
      }
      activeLink = current;
    }

    function updateNavState() {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
      updateActiveLink();
    }

    onScrollFrame(updateNavState);
    // Section positions also move on rotation / resize and once fonts and
    // images have loaded
    var queueNavState = rafThrottle(updateNavState);
    window.addEventListener('resize', queueNavState);
    window.addEventListener('load', queueNavState);
    // The page can already be scrolled when this runs (reload, /#apply link)
    updateNavState();

    // Mobile menu. Opening and every way of leaving it go through
    // setMenuOpen(), so the page scroll lock can never outlive the menu.
    function menuIsOpen() {
      return navLinks.classList.contains('open');
    }

    function setMenuOpen(open) {
      navLinks.classList.toggle('open', open);
      navToggle.classList.toggle('open', open);
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      lockScroll(open);
    }

    // Does nothing while the menu is shut, so it cannot release a scroll
    // lock that belongs to the modal
    function closeMenu() {
      if (menuIsOpen()) setMenuOpen(false);
    }

    navToggle.addEventListener('click', function () {
      setMenuOpen(!menuIsOpen());
    });

    // Close on link click, and on the logo, which stays visible above the menu
    links.forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });
    var logo = navbar.querySelector('.nav-logo');
    if (logo) logo.addEventListener('click', closeMenu);

    // Escape closes mobile nav
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });

    // Rotating or resizing past the mobile breakpoint (the same query as in
    // style.css) hides the menu button, so the menu must close with it
    var mobileNav = window.matchMedia('(max-width: 768px)');
    function onNavBreakpoint(e) {
      if (!e.matches) closeMenu();
    }
    if (mobileNav.addEventListener) {
      mobileNav.addEventListener('change', onNavBreakpoint);
    } else if (mobileNav.addListener) {
      // Safari before 14
      mobileNav.addListener(onNavBreakpoint);
    }
  }

  // --- Smooth Scroll ---
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        var targetId = this.getAttribute('href');
        if (targetId === '#') return;
        var target = document.querySelector(targetId);
        if (!target) return;
        e.preventDefault();
        var navHeight = document.getElementById('navbar').offsetHeight;
        var top = target.getBoundingClientRect().top + window.scrollY - navHeight;
        window.scrollTo({ top: top, behavior: scrollBehavior() });
      });
    });
  }

  // --- Glitch Effect ---
  function initGlitchEffect() {
    var glitchEl = document.querySelector('.glitch');
    if (!glitchEl) return;

    // Length of the glitch-flicker animation in style.css
    var GLITCH_MS = 300;

    function triggerGlitch() {
      glitchEl.classList.add('glitching');
      setTimeout(function () {
        glitchEl.classList.remove('glitching');
      }, GLITCH_MS);
    }

    // Random glitch intervals
    function scheduleGlitch() {
      var delay = 3000 + Math.random() * 7000;
      setTimeout(function () {
        triggerGlitch();
        scheduleGlitch();
      }, delay);
    }

    scheduleGlitch();
  }

  // --- Particle System ---
  function initParticles() {
    var canvas = document.getElementById('heroParticles');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var particles = [];
    var particleCount = 60;
    var mouse = { x: null, y: null };

    // Assigning canvas.width / height wipes the canvas. While the loop is
    // not running (reduced motion draws one static frame; the loop also
    // stops when the hero is off-screen) nothing would repaint it, so
    // resize() redraws the frame itself.
    function drawFrame() {
      ctx.clearRect(0, 0, width, height);
      particles.forEach(function (p) { p.draw(); });
      drawConnections();
    }

    // Size of the canvas in CSS pixels. Everything is positioned and drawn
    // in these units; the backing store is larger by the device pixel ratio
    // (capped at 2 to bound the per-frame cost on 3x phones) so the small
    // dots and half-pixel lines stay sharp on high-density screens.
    var width = 0;
    var height = 0;
    var ratio = 0;

    function resize() {
      var w = canvas.offsetWidth;
      var h = canvas.offsetHeight;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (w === width && h === height && dpr === ratio) return;
      var oldW = width;
      var oldH = height;
      width = w;
      height = h;
      ratio = dpr;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      // Assigning width / height also resets the transform
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Keep the particles spread over the new size
      if (oldW > 0 && oldH > 0) {
        particles.forEach(function (p) {
          p.x = p.x * w / oldW;
          p.y = p.y * h / oldH;
        });
      }
      if (!animating) drawFrame();
    }

    var animating = false;
    var rafId = null;

    resize();
    window.addEventListener('resize', resize);

    canvas.addEventListener('mousemove', function (e) {
      var rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });

    canvas.addEventListener('mouseleave', function () {
      mouse.x = null;
      mouse.y = null;
    });

    function Particle() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.size = Math.random() * 2 + 0.5;
      this.speedX = (Math.random() - 0.5) * 0.3;
      this.speedY = (Math.random() - 0.5) * 0.3;
      this.opacity = Math.random() * 0.5 + 0.1;
      this.color = Math.random() > 0.6 ? '255, 105, 180' : Math.random() > 0.5 ? '153, 102, 255' : '0, 191, 255';
    }

    Particle.prototype.update = function () {
      this.x += this.speedX;
      this.y += this.speedY;

      // Mouse interaction
      if (mouse.x !== null && mouse.y !== null) {
        var dx = mouse.x - this.x;
        var dy = mouse.y - this.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          var force = (120 - dist) / 120;
          this.x -= dx * force * 0.01;
          this.y -= dy * force * 0.01;
        }
      }

      // Wrap
      if (this.x < 0) this.x = width;
      if (this.x > width) this.x = 0;
      if (this.y < 0) this.y = height;
      if (this.y > height) this.y = 0;
    };

    Particle.prototype.draw = function () {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + this.color + ', ' + this.opacity + ')';
      ctx.fill();
    };

    // Init particles
    for (var i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    // Draw connections
    function drawConnections() {
      for (var i = 0; i < particles.length; i++) {
        for (var j = i + 1; j < particles.length; j++) {
          var dx = particles[i].x - particles[j].x;
          var dy = particles[i].y - particles[j].y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            var opacity = (1 - dist / 100) * 0.15;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = 'rgba(255, 105, 180, ' + opacity + ')';
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    }

    function animate() {
      if (!animating) return;
      ctx.clearRect(0, 0, width, height);
      particles.forEach(function (p) {
        p.update();
        p.draw();
      });
      drawConnections();
      rafId = requestAnimationFrame(animate);
    }

    // Only animate when hero is visible
    if (!prefersReducedMotion()) {
      var heroEl = document.getElementById('hero');
      var particleObserver = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          if (!animating) { animating = true; animate(); }
        } else {
          animating = false;
          if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
        }
      });
      if (heroEl) particleObserver.observe(heroEl);
    } else {
      drawFrame();
    }
  }

  // --- Form Validation ---
  function initFormValidation() {
    var form = document.getElementById('applicationForm');
    if (!form) return;

    // The script validates every field itself and shows the messages inline,
    // so the browser's own bubbles are switched off. Done here, not with a
    // novalidate attribute, so native validation still works without script.
    form.noValidate = true;

    // Date picker stops at today (the rule itself is checked in validateField)
    var dobInput = document.getElementById('dob');
    if (dobInput) {
      dobInput.max = localDateString();
    }

    var charCount = document.getElementById('charCount');
    var selfIntro = document.getElementById('selfIntro');
    var fileUpload = document.getElementById('fileUpload');
    var photoInput = document.getElementById('photo');
    var submitBtn = document.getElementById('submitBtn');
    var modal = document.getElementById('successModal');
    var modalClose = document.getElementById('modalClose');

    // Character counter
    if (selfIntro && charCount) {
      selfIntro.addEventListener('input', function () {
        charCount.textContent = this.value.length;
      });
    }

    // Photo upload box
    var fileText = fileUpload ? fileUpload.querySelector('.file-upload-text') : null;
    // Phones cannot drag a file in and have nothing to click
    if (fileText && isTouchOnly()) fileText.textContent = 'Tap to choose a photo';
    var defaultFileText = fileText ? fileText.textContent : '';

    // Back to the empty state: no file name, no "has file" styling
    function resetFileUpload() {
      if (!fileUpload) return;
      fileUpload.classList.remove('has-file');
      if (fileText) fileText.textContent = defaultFileText;
    }

    if (fileUpload && photoInput) {
      photoInput.addEventListener('change', function () {
        var hasFile = photoInput.files && photoInput.files.length > 0;
        // validateField empties the input again if the file is not acceptable
        if (hasFile && validateField(photoInput)) {
          fileUpload.classList.add('has-file');
          if (fileText) fileText.textContent = photoInput.files[0].name;
        } else {
          // Rejected file, or the selection was cleared (picker cancelled)
          if (!hasFile) validateField(photoInput);
          resetFileUpload();
        }
      });

      // Drag and drop visual
      fileUpload.addEventListener('dragover', function (e) {
        e.preventDefault();
        this.classList.add('dragover');
      });

      fileUpload.addEventListener('dragleave', function () {
        this.classList.remove('dragover');
      });

      fileUpload.addEventListener('drop', function (e) {
        e.preventDefault();
        this.classList.remove('dragover');
        if (e.dataTransfer && e.dataTransfer.files.length > 0) {
          var dropped = e.dataTransfer.files;
          // One photo only: keep the first of several dropped files
          if (dropped.length > 1 && typeof DataTransfer === 'function') {
            try {
              var single = new DataTransfer();
              single.items.add(dropped[0]);
              dropped = single.files;
            } catch (err) {
              // keep the full list; validateField checks every file in it
            }
          }
          photoInput.files = dropped;
          photoInput.dispatchEvent(new Event('change'));
        }
      });
    }

    var ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
    var MAX_PHOTO_BYTES = 10 * 1024 * 1024;
    // How long the stand-in for a real submission takes (no Formspree ID yet)
    var SIMULATED_SUBMIT_MS = 1500;
    // The modal is taken out of the page once its 0.3s fade (style.css) is over
    var MODAL_FADE_MS = 400;

    // Validate individual field
    function validateField(input) {
      var group = input.closest('.form-group');
      var errorEl = group ? group.querySelector('.form-error') : null;
      var isFile = input.type === 'file';
      var msg = '';

      if (input.required && !input.value.trim() && input.type !== 'checkbox' && !isFile) {
        msg = 'This field is required.';
      } else if (input.required && input.type === 'checkbox' && !input.checked) {
        msg = 'You must agree to continue.';
      } else if (input.required && isFile && (!input.files || input.files.length === 0)) {
        msg = 'Please upload a photo.';
      } else if (isFile && input.files && input.files.length > 0) {
        for (var i = 0; i < input.files.length && !msg; i++) {
          if (ALLOWED_PHOTO_TYPES.indexOf(input.files[i].type) === -1) {
            msg = 'Only JPG, PNG, or WebP images are allowed.';
          } else if (input.files[i].size > MAX_PHOTO_BYTES) {
            msg = 'File must be under 10MB.';
          }
        }
        if (msg) {
          // Do not leave a rejected file attached, or its name on display
          input.value = '';
          resetFileUpload();
        }
      } else if (input.type === 'email' && input.value && !/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/.test(input.value)) {
        msg = 'Please enter a valid email.';
      } else if (input.type === 'url' && input.value && !isAllowedVideoUrl(input.value)) {
        msg = 'Please use a YouTube or Google Drive link (https://...)';
      } else if (input.id === 'dob' && input.value) {
        // The value is YYYY-MM-DD, so plain string comparison is exact and
        // has no time-zone edge. A year of more than four digits is longer.
        if (input.value.length > 10 || input.value > localDateString()) {
          msg = 'Date of birth cannot be in the future.';
        } else if (input.value < '2005-01-01') {
          msg = 'You must be born in 2005 or later.';
        }
      }

      // The file input itself is an invisible overlay, so its error state is
      // shown on the visible upload box
      var box = isFile && fileUpload ? fileUpload : input;
      if (msg) {
        box.classList.add('error');
        input.setAttribute('aria-invalid', 'true');
        if (errorEl) errorEl.textContent = msg;
        return false;
      } else {
        box.classList.remove('error');
        input.removeAttribute('aria-invalid');
        if (errorEl) errorEl.textContent = '';
        return true;
      }
    }

    // Real-time validation on blur
    var inputs = form.querySelectorAll('.form-input, input[type="checkbox"]');
    inputs.forEach(function (input) {
      input.addEventListener('blur', function () {
        validateField(this);
      });
      // Clear error on input
      input.addEventListener('input', function () {
        if (this.classList.contains('error')) {
          validateField(this);
        }
      });
    });

    // One submission at a time. The flag covers Enter pressed in a text
    // field, which submits the form without going through the button.
    var submitting = false;

    function setSubmitting(on) {
      submitting = on;
      submitBtn.classList.toggle('loading', on);
      submitBtn.disabled = on;
    }

    function submitSucceeded() {
      setSubmitting(false);
      showModal();
      form.reset();
      if (charCount) charCount.textContent = '0';
      resetFileUpload();
    }

    function submitFailed(message) {
      setSubmitting(false);
      alert(message);
      submitBtn.focus();
    }

    // Form submission
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (submitting) return;

      // Validate all required fields, and the optional photo if one is attached
      var allValid = true;
      var fieldsToCheck = form.querySelectorAll('[required], #photo');
      fieldsToCheck.forEach(function (input) {
        if (!validateField(input)) {
          allValid = false;
        }
      });

      if (!allValid) {
        // Scroll to first error
        var firstError = form.querySelector('.error');
        if (firstError) {
          firstError.scrollIntoView({ behavior: scrollBehavior(), block: 'center' });
          var focusTarget = firstError === fileUpload ? photoInput : firstError;
          focusTarget.focus({ preventScroll: true });
        }
        return;
      }

      // Show loading and lock the button until this attempt has finished
      setSubmitting(true);

      // Submit to Formspree (or simulate if no ID configured)
      var action = form.getAttribute('action');
      if (action && !action.includes('YOUR_FORM_ID')) {
        fetch(action, {
          method: 'POST',
          body: new FormData(form),
          headers: { 'Accept': 'application/json' }
        })
        .then(function (response) {
          if (response.ok) {
            submitSucceeded();
          } else {
            submitFailed('Something went wrong. Please try again.');
          }
        }, function () {
          submitFailed('Network error. Please check your connection and try again.');
        });
      } else {
        // Simulate submission (no Formspree ID configured)
        setTimeout(submitSucceeded, SIMULATED_SUBMIT_MS);
      }
    });

    // Modal
    var modalOpen = false;
    var modalHideTimer = null;

    function showModal() {
      // A close that is still fading out must not hide the modal we are
      // about to show
      clearTimeout(modalHideTimer);
      modalHideTimer = null;
      modalOpen = true;
      modal.hidden = false;
      requestAnimationFrame(function () {
        if (!modalOpen) return;
        modal.classList.add('active');
        if (modalClose) modalClose.focus();
      });
      lockScroll(true);
    }

    function closeModal() {
      if (!modalOpen) return;
      modalOpen = false;
      modal.classList.remove('active');
      clearTimeout(modalHideTimer);
      modalHideTimer = setTimeout(function () {
        modalHideTimer = null;
        if (!modalOpen) modal.hidden = true;
      }, MODAL_FADE_MS);
      lockScroll(false);
      if (submitBtn) submitBtn.focus();
    }

    if (modalClose) {
      modalClose.addEventListener('click', closeModal);
    }

    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal();
    });

    document.addEventListener('keydown', function (e) {
      if (!modalOpen) return;
      if (e.key === 'Escape') {
        closeModal();
      } else {
        // Tab stays inside the dialog
        trapTabKey(e, modal);
      }
    });
  }

  // --- Lore Effects (each runs only while its own element is on screen) ---
  function initLoreEffects() {
    var timestampEl = document.getElementById('heroTimestamp');
    var coordsEl = document.getElementById('heroCoords');
    var systemMsg = document.querySelector('.hero-system-msg');
    var footerLore = document.querySelector('.footer-lore');
    var heroEl = document.getElementById('hero');
    var loreIntervals = [];
    var loreRunning = false;

    // Now and then the line dips to `low` opacity for a moment. `low` has
    // to be well under the line's resting opacity in style.css to be seen.
    function startFlicker(el, low) {
      return setInterval(function () {
        if (Math.random() > 0.7) {
          el.style.opacity = low;
          setTimeout(function () { el.style.opacity = ''; }, 150);
        }
      }, 3000);
    }

    function updateTimestamp() {
      var now = new Date();
      var y = now.getFullYear();
      var m = String(now.getMonth() + 1).padStart(2, '0');
      var d = String(now.getDate()).padStart(2, '0');
      var h = String(now.getHours()).padStart(2, '0');
      var min = String(now.getMinutes()).padStart(2, '0');
      var s = String(now.getSeconds()).padStart(2, '0');
      timestampEl.textContent = y + '.' + m + '.' + d + ' ' + h + ':' + min + ':' + s;
    }

    function startLore() {
      if (loreRunning) return;
      loreRunning = true;
      if (timestampEl) {
        updateTimestamp();
        loreIntervals.push(setInterval(updateTimestamp, 1000));
      }
      if (coordsEl) {
        loreIntervals.push(setInterval(function () {
          var lat = (37.5665 + (Math.random() - 0.5) * 0.001).toFixed(4);
          var lng = (126.9780 + (Math.random() - 0.5) * 0.001).toFixed(4);
          coordsEl.textContent = lat + '\u00B0N, ' + lng + '\u00B0E';
        }, 5000));
      }
      // Rests at 0.6
      if (systemMsg) loreIntervals.push(startFlicker(systemMsg, '0.2'));
    }

    function stopLore() {
      loreRunning = false;
      loreIntervals.forEach(function (id) { clearInterval(id); });
      loreIntervals = [];
    }

    if (heroEl) {
      var loreObserver = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { startLore(); } else { stopLore(); }
      });
      loreObserver.observe(heroEl);
    }

    // The footer line is a whole page away from the hero, so it has its own
    // observer: it flickers only while the footer itself is on screen. It
    // rests at 0.25, so the dip goes almost to nothing.
    if (footerLore) {
      var footerFlicker = null;
      var footerObserver = new IntersectionObserver(function (entries) {
        var onScreen = entries[entries.length - 1].isIntersecting;
        if (onScreen && footerFlicker === null) {
          footerFlicker = startFlicker(footerLore, '0.04');
        } else if (!onScreen && footerFlicker !== null) {
          clearInterval(footerFlicker);
          footerFlicker = null;
        }
      });
      footerObserver.observe(footerLore);
    }
  }

  // --- Chatroom Intro Sequence ---
  function initIntro() {
    var overlay = document.getElementById('introOverlay');
    var skipBtn = document.getElementById('introSkip');
    var enterPrompt = document.getElementById('introEnter');
    var root = document.documentElement;
    if (!overlay) { root.classList.add('js'); initMain(); return; }

    // style.css hides the overlay by itself when this script has not shown
    // up after a few seconds. If that has already happened the visitor is
    // looking at the page, so the intro is not sprung on them now.
    var failsafeFired = window.getComputedStyle(overlay).visibility === 'hidden';
    // From here on the script is in charge (cancels the CSS failsafe)
    root.classList.add('js');

    // Skip intro for reduced motion preference
    if (failsafeFired || prefersReducedMotion()) {
      overlay.hidden = true;
      initMain();
      return;
    }

    document.body.classList.add('intro-active');

    // The overlay is a modal dialog: while it is up, nothing behind it can
    // be focused or operated. Set here, not in the markup, so a script
    // failure cannot leave the page inert.
    var inertEls = [];
    Array.prototype.forEach.call(document.body.children, function (el) {
      if (el === overlay || el.tagName === 'SCRIPT' || el.hasAttribute('inert')) return;
      el.setAttribute('inert', '');
      inertEls.push(el);
    });

    // Touch devices have nothing to click and no Enter key
    var enterText = enterPrompt && enterPrompt.querySelector('.intro-enter-text');
    if (enterText && isTouchOnly()) {
      enterText.textContent = 'tap to begin';
    }

    // The overlay's opacity transition in style.css
    var INTRO_FADE_MS = 800;
    // The intro stays up this long after its last line has appeared
    var INTRO_HOLD_MS = 1600;
    // Long enough for the last notes to ring out after the intro has ended
    // (the welcome chime's final note starts 540ms in and lasts 0.5s)
    var AUDIO_RELEASE_MS = 1500;

    var lines = overlay.querySelectorAll('.intro-line');
    var audioCtx = null;
    var introComplete = false;
    var sequenceStarted = false;

    // Focus starts on the "begin" button; SKIP is the next tab stop
    if (enterPrompt) enterPrompt.focus({ preventScroll: true });

    function playTone(freq, duration, volume, type) {
      if (!audioCtx || audioCtx.state !== 'running') return;
      try {
        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = type || 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(volume || 0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
      } catch (e) {
        // audio error, silently ignore
      }
    }

    function playBootSound() {
      playTone(200, 0.2, 0.15, 'square');
      setTimeout(function () { playTone(300, 0.15, 0.12, 'square'); }, 100);
    }

    function playTypeSound() {
      playTone(800 + Math.random() * 400, 0.05, 0.08, 'square');
    }

    function playConnectSound() {
      playTone(523, 0.2, 0.15, 'sine');
      setTimeout(function () { playTone(659, 0.2, 0.15, 'sine'); }, 150);
      setTimeout(function () { playTone(784, 0.3, 0.15, 'sine'); }, 300);
    }

    function playNotificationSound() {
      playTone(880, 0.12, 0.12, 'sine');
      setTimeout(function () { playTone(1100, 0.15, 0.12, 'sine'); }, 120);
    }

    function playWelcomeChime() {
      [523, 659, 784, 1047].forEach(function (note, i) {
        setTimeout(function () { playTone(note, 0.5, 0.12, 'sine'); }, i * 180);
      });
    }

    // Three quick key clicks
    function playTypingBurst() {
      [0, 60, 120].forEach(function (wait) {
        setTimeout(function () {
          if (!introComplete) playTypeSound();
        }, wait);
      });
    }

    // What a boot line can ask for in its data-sound attribute in
    // index.html (a space-separated list, played in the order written)
    var lineSounds = {
      type: playTypingBurst,
      notify: playNotificationSound,
      connect: playConnectSound,
      chime: playWelcomeChime
    };

    // Run the boot line sequence + sounds. Each line says in the markup
    // when it appears (data-delay, in ms) and what it sounds like.
    function runBootSequence() {
      playBootSound();

      var lastDelay = 0;
      lines.forEach(function (line) {
        var delay = parseInt(line.getAttribute('data-delay'), 10);
        if (delay > lastDelay) lastDelay = delay;
        setTimeout(function () {
          if (introComplete) return;
          line.classList.add('visible');
          (line.getAttribute('data-sound') || '').split(/\s+/).forEach(function (name) {
            if (Object.prototype.hasOwnProperty.call(lineSounds, name)) lineSounds[name]();
          });
        }, delay);
      });

      setTimeout(function () {
        if (!introComplete) finishIntro();
      }, lastDelay + INTRO_HOLD_MS);
    }

    // Start the boot sequence (called after user click)
    function startSequence() {
      if (sequenceStarted) return;
      sequenceStarted = true;

      // Hide the "click to enter" prompt and take it out of the tab order.
      // Focus moves to the dialog itself, so Escape and Tab (to SKIP) keep
      // working while the boot lines play.
      if (enterPrompt) {
        enterPrompt.classList.add('hidden');
        if (document.activeElement === enterPrompt) overlay.focus({ preventScroll: true });
        enterPrompt.disabled = true;
      }

      // Create AudioContext inside user gesture, wait for it to be running
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        // no audio support, run visuals only
        runBootSequence();
        return;
      }

      // resume() returns a promise - wait for context to be running before playing sounds
      audioCtx.resume().then(function () {
        runBootSequence();
      }).catch(function () {
        runBootSequence();
      });
    }

    function finishIntro() {
      if (introComplete) return;
      introComplete = true;
      // Hand the page back before the fade: nothing in the overlay can be
      // focused any more and everything behind it can
      if (overlay.contains(document.activeElement)) document.activeElement.blur();
      overlay.setAttribute('inert', '');
      inertEls.forEach(function (el) { el.removeAttribute('inert'); });
      overlay.classList.add('fade-out');
      document.body.classList.remove('intro-active');
      setTimeout(function () {
        overlay.hidden = true;
      }, INTRO_FADE_MS);
      // The intro is the only thing that makes sound: give the audio device
      // back once the last notes have faded (playTone does nothing on a
      // context that is not running)
      if (audioCtx && typeof audioCtx.close === 'function') {
        setTimeout(function () {
          try {
            var closing = audioCtx.close();
            if (closing && closing.catch) closing.catch(function () {});
          } catch (e) {
            // already closed or not closable: nothing to release
          }
        }, AUDIO_RELEASE_MS);
      }
      initMain();
    }

    // Click anywhere on the overlay starts the sequence
    overlay.addEventListener('click', function (e) {
      if (e.target === skipBtn) return;
      startSequence();
    });

    // Skip button ends immediately
    skipBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      finishIntro();
    });

    // Escape skips; Enter / Space begin; Tab stays inside the dialog
    document.addEventListener('keydown', function (e) {
      if (introComplete) return;
      if (e.key === 'Escape') {
        finishIntro();
        return;
      }
      if (e.key === 'Tab') {
        // From now on the focus ring of the "begin" prompt is shown too
        overlay.classList.add('keyboard-nav');
        trapTabKey(e, overlay);
        return;
      }
      if ((e.key === 'Enter' || e.key === ' ') && !sequenceStarted) {
        // On a focused button the key belongs to that button: its own click
        // begins (the prompt) or skips (SKIP)
        if (e.target && e.target.closest && e.target.closest('button, a[href]')) return;
        e.preventDefault();
        startSequence();
      }
    });
  }

  // --- Interactive Chatroom (Eliza-style Engine) ---
  function initChatroom() {
    var body = document.getElementById('chatroomBody');
    var input = document.getElementById('chatroomInput');
    var sendBtn = document.getElementById('chatroomSend');
    if (!body) return;

    var cities = [
      'Seoul', 'Tokyo', 'London', 'Paris', 'Lagos', 'New York',
      'Bangkok', 'Jakarta', 'Berlin', 'Mumbai', 'Manila', 'Sydney',
      'Toronto', 'Stockholm', 'Cairo', 'Mexico City', 'Osaka',
      'Amsterdam', 'Dubai', 'Taipei', 'Singapore', 'Lisbon'
    ];

    var handles = [
      'star_girl', 'moonchild99', 'neon.dream', 'cherry_bxm',
      'luv4music', 'glittergrl', 'skyline_', 'velvet.voice',
      'sugar_plum', 'oceangirl', 'pixiedust', 'aurora.wav',
      'dreamcatcher', 'honey_bee', 'cloud.nine', 'sparkle_xx',
      'midnight_sun', 'blossom.mp3', 'starry_eyed', 'pink.static',
      'luna_moth', 'crystal.clear', 'daisychain', 'prism.girl'
    ];

    var userClasses = ['user-1', 'user-2', 'user-3'];
    var activeUsers = [];
    var messageQueue = [];
    // True from the moment a line is taken off the queue until it has
    // finished typing, so only one line is ever pending or typing
    var queueBusy = false;
    // The line taken off the queue that is still waiting out its pause
    // before it starts typing (null once typing has begun)
    var pendingMsg = null;
    var pendingTimer = null;
    var nextThreadTimer = null;
    var chatStarted = false;
    // The room only "talks" while its window is on screen and the tab is
    // showing. See chatPaused() / resumeChat().
    var chatInView = false;

    // --- Memory & State ---
    var memory = {
      topics: [],          // what user has talked about
      mood: 'neutral',     // neutral, excited, nervous, vulnerable, hype
      userName: null,       // if they share their name
      userCountry: null,    // if they share location
      userCategory: null,   // vocal/dance/rap etc
      messagesReceived: 0,
      nameGivenAt: 0,       // messagesReceived when the name was first given
      nameFollowedUp: false // the one-off name follow-up has been shown
    };

    function rememberName(name) {
      memory.userName = name;
      if (!memory.nameGivenAt) memory.nameGivenAt = memory.messagesReceived;
    }

    // --- Eliza Reflection Map ---
    // Flips first person to second person, word by word, so a room member
    // can say the visitor's words back to them ("i am" -> "you are",
    // "am i" -> "are you", "my" -> "your"). Written the way the room types:
    // lower case, no apostrophes.
    var reflections = {
      'i': 'you', 'me': 'you', 'my': 'your', 'mine': 'yours',
      'myself': 'yourself', 'am': 'are',
      'im': 'youre', "i'm": 'youre', 'ive': 'youve', "i've": 'youve',
      "i'll": 'youll', "i'd": 'youd'
    };

    // The visitor's message as it can be quoted mid-sentence: lower case,
    // single spaces, no punctuation or quote marks at either end
    function tidyEcho(text) {
      return String(text).toLowerCase()
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/\s+/g, ' ')
        .replace(/^[\s.,!?;:~"'()\u201c\u201d-]+|[\s.,!?;:~"'()\u201c\u201d-]+$/g, '');
    }

    function reflect(text) {
      // "was" only changes next to "i" ("it was late" stays as it is)
      var clean = tidyEcho(text)
        .replace(/\bi was\b/g, 'you were')
        .replace(/\bwas i\b/g, 'were you');
      return clean.replace(/[a-z']+/g, function (word) {
        return Object.prototype.hasOwnProperty.call(reflections, word) ? reflections[word] : word;
      });
    }

    // --- Template Engine ---
    // Fills the {placeholders} of a reply template from `data`. The rules
    // use one: {extract}.
    function fillTemplate(tpl, data) {
      return tpl.replace(/\{(\w+)\}/g, function (_, key) {
        return data[key] !== undefined ? data[key] : '';
      });
    }

    // --- Name and place extraction ---
    // Words that can follow "i am" / "call me" without being a name
    var notNames = [
      'so', 'very', 'really', 'too', 'not', 'just', 'also', 'still', 'literally',
      'actually', 'kinda', 'pretty', 'super', 'a', 'an', 'the', 'from', 'in',
      'at', 'on', 'here', 'there', 'back', 'new', 'ready', 'going', 'gonna',
      'trying', 'applying', 'thinking', 'feeling', 'looking', 'hoping',
      'excited', 'happy', 'sad', 'tired', 'exhausted', 'nervous', 'scared',
      'afraid', 'anxious', 'worried', 'terrified', 'shy', 'bored', 'lost',
      'confused', 'sorry', 'sure', 'fine', 'ok', 'okay', 'good', 'great',
      'bad', 'glad', 'obsessed', 'interested', 'curious', 'young', 'old',
      'late', 'done', 'alone', 'lonely', 'sick', 'hungry', 'sleepy', 'awake',
      'dead', 'crying', 'shaking', 'screaming', 'maybe', 'later', 'when',
      'if', 'what', 'who', 'that', 'this', 'it', 'you', 'me', 'him', 'her',
      'them', 'crazy', 'female', 'korean', 'japanese', 'american', 'british'
    ];

    function cleanName(raw) {
      var name = (raw || '').replace(/^['\u2019-]+|['\u2019-]+$/g, '');
      if (name.length < 2 || name.length > 20) return null;
      if (notNames.indexOf(name.toLowerCase()) !== -1) return null;
      return name;
    }

    // A place name ends at the first of these ("brazil and i sing")
    var placeStops = [
      'and', 'but', 'so', 'because', 'bc', 'cuz', 'where', 'which', 'who',
      'lol', 'lmao', 'haha', 'btw', 'tho', 'though', 'i', 'im', "i'm",
      'its', "it's", 'originally', 'too', 'also', 'what', 'how', 'hbu',
      'wbu', 'you', 'u'
    ];
    // "from a friend", "from tiktok": a source, not a location
    var notPlaces = [
      'a', 'an', 'my', 'our', 'your', 'his', 'her', 'their', 'this', 'that',
      'these', 'those', 'here', 'there', 'now', 'then', 'what', 'where',
      'who', 'it', 'me', 'you', 'tiktok', 'instagram', 'insta', 'ig',
      'youtube', 'yt', 'twitter', 'x', 'google', 'reddit', 'discord',
      'facebook', 'snapchat', 'pinterest', 'school', 'work', 'home',
      'friends', 'someone', 'somewhere', 'nowhere', 'everywhere'
    ];
    // "the" only introduces a place for names like these
    var thePlaces = [
      'philippines', 'us', 'usa', 'uk', 'uae', 'netherlands', 'states',
      'united', 'bahamas', 'maldives', 'gambia', 'congo', 'czech',
      'dominican', 'caribbean', 'emirates', 'south', 'north', 'east',
      'west', 'middle'
    ];

    function cleanPlace(raw) {
      var words = (raw || '').replace(/[.,!?;:()"]+[\s\S]*$/, '').trim().split(/\s+/);
      var kept = [];
      for (var i = 0; i < words.length && kept.length < 3; i++) {
        if (!words[i] || placeStops.indexOf(words[i].toLowerCase()) !== -1) break;
        kept.push(words[i]);
      }
      if (!kept.length) return null;
      var first = kept[0].toLowerCase();
      if (notPlaces.indexOf(first) !== -1) return null;
      if (first === 'the' &&
          (kept.length < 2 || thePlaces.indexOf(kept[1].toLowerCase()) === -1)) {
        return null;
      }
      return kept.join(' ');
    }

    // --- Eliza Pattern Rules ---
    // Each rule: regex pattern, system response templates, user reaction templates
    // {extract} = captured group from regex
    // Rules are tried in order and the first match wins, so specific rules
    // come before general ones. An optional capture(m) returns the text to
    // use as {extract}, or null when the match is not what the rule is
    // about (the next rules are then tried).
    var elizaRules = [
      {
        // Unambiguous introductions. A bare "i am ..." is usually not a
        // name; that form is handled further down, after the mood rules.
        regex: /\b(?:my name is|my name.?s|i.?m called|i am called|call me)\s+([^\s\d.,!?;:()"]+)/i,
        capture: function (m) { return cleanName(m[1]); },
        onMatch: function (m, name) { rememberName(name); },
        system: ['[SYSTEM] Identity registered: {extract}.'],
        users: [
          'hi {extract}!! welcome to the room',
          'nice to meet you {extract}!',
          '{extract}!! i love that name',
          'welcome {extract}. you belong here'
        ]
      },
      {
        regex: /\b(?:i sing|i.?m a singer|vocal|i love singing|my voice)\b/i,
        onMatch: function () { memory.userCategory = 'vocal'; memory.topics.push('singing'); },
        system: ['[SYSTEM] Vocal frequency detected. Resonance: strong.'],
        users: [
          'a vocalist! what genre do you usually go for?',
          'omg same. singing is everything to me',
          'i would love to hear you sing tbh',
          'vocal line is going to be insane in this group'
        ]
      },
      {
        regex: /\b(?:i dance|dancer|i love dancing|choreo|i.?m a dancer)\b/i,
        onMatch: function () { memory.userCategory = 'dance'; memory.topics.push('dancing'); },
        system: ['[SYSTEM] Movement signature captured.'],
        users: [
          'dancer!! what style is your specialty?',
          'i can feel the energy already',
          'dance is the purest form of expression imo',
          'the dance line in this group is going to go OFF'
        ]
      },
      {
        regex: /\b(?:i rap|rapper|bars|i write lyrics|flow)\b/i,
        onMatch: function () { memory.userCategory = 'rap'; memory.topics.push('rapping'); },
        system: ['[SYSTEM] Lyrical signal analyzed. Pattern: unique.'],
        users: [
          'a rapper?? ok we NEED you',
          'rap is so underrated in kpop. show them',
          'spit some bars right now i dare you lol',
          'wordsmith energy. i respect that'
        ]
      },
      {
        regex: /\b(?:nervous|scared|terrified|anxious|afraid|worried|shaking)\b/i,
        onMatch: function () { memory.mood = 'nervous'; memory.topics.push('nervousness'); },
        system: ['[SYSTEM] Emotional resonance detected. You are not alone in this room.'],
        users: [
          'honestly? same. but thats how you know it matters',
          'being nervous just means you care. thats literally the point',
          'i was shaking before i typed my first message here too',
          'take a deep breath. we are all in this together',
          'the bravest thing is showing up scared and doing it anyway'
        ]
      },
      {
        regex: /\b(?:i feel|feeling|i.?m so|i am so) (.+)/i,
        system: ['[SYSTEM] Emotional wavelength logged.'],
        users: [
          'the fact that {extract}... i relate so hard',
          'you being honest about that takes courage',
          'i feel that too. this room is a safe space',
          'say more about that. we are listening'
        ]
      },
      {
        regex: /\b(?:i want to|i wanna|i wish|i hope|i need)\b (.+)/i,
        onMatch: function () { memory.mood = 'vulnerable'; },
        system: ['[SYSTEM] Dream frequency registered. Signal amplifying...'],
        users: [
          'thats such a real thing to want',
          'manifesting that for you rn',
          'you deserve {extract}. dont let anyone tell you different',
          'the 7th room hears you. keep going'
        ]
      },
      {
        // "from ..." on its own only counts at the start of the message (the
        // answer to "where are you from?"), not anywhere in a sentence
        regex: /(?:\bi.?m from|\bi am from|\bi live in|^\s*from)\s+(.+)/i,
        capture: function (m) { return cleanPlace(m[1]); },
        onMatch: function (m, place) { memory.userCountry = place; memory.topics.push('location'); },
        system: ['[SYSTEM] Geolocation locked: {extract}. Signal strength: maximum.'],
        users: [
          '{extract}!! thats so cool. we really are global',
          'no way!! i have always wanted to visit {extract}',
          'different countries same chatroom same dream. i love it',
          'the 7th room has no borders. just vibes'
        ]
      },
      {
        // "i am <name>": only when the name closes the thought and is not a
        // common describing word ("i am tired", "i am 17" are not names)
        regex: /\bi am\s+([^\s\d.,!?;:()"]+)(?=\s*(?:$|[.,!?~;:)]|(?:and|from|btw|lol)\b))/i,
        capture: function (m) { return cleanName(m[1]); },
        onMatch: function (m, name) { rememberName(name); },
        system: ['[SYSTEM] Identity registered: {extract}.'],
        users: [
          'hi {extract}!! welcome to the room',
          'nice to meet you {extract}!',
          '{extract}!! i love that name',
          'welcome {extract}. you belong here'
        ]
      },
      {
        regex: /\b(?:hello|hi|hey+|hii+|yo|sup)\b/i,
        onMatch: function () { memory.mood = 'excited'; },
        system: ['[SYSTEM] New signal acknowledged. Welcome.'],
        users: [
          'hiii!! omg another one. the room is growing',
          'welcome!! where are you from?',
          'hey!! glad you found this place',
          'hiiii! i love when new people come in'
        ]
      },
      {
        regex: /\bwhat (?:is|are|do you|should)\b/i,
        system: ['[SYSTEM] Inquiry processed.'],
        users: [
          'good question honestly. i was wondering that too',
          'idk but i think the system knows lol',
          'scroll down! all the info is on this page',
          'omg i literally asked the same thing when i got here'
        ]
      },
      {
        regex: /\b(?:love|adore|obsessed|into|passion)\b/i,
        onMatch: function () { memory.mood = 'hype'; memory.topics.push('passion'); },
        system: ['[SYSTEM] Passion frequency amplified.'],
        users: [
          'the passion in this room is UNREAL',
          'you can literally feel the energy through the screen',
          'this is why we are all here. love and music',
          'i love this chat so much already'
        ]
      },
      {
        regex: /\b(?:dream|dreaming|manifest|destiny|fate|meant to be)\b/i,
        onMatch: function () { memory.mood = 'vulnerable'; memory.topics.push('dreams'); },
        system: ['[SYSTEM] Dream signal locked. The room remembers.'],
        users: [
          'i literally had a dream about this before i found the page',
          'fate is real and this chatroom is proof',
          'we were all meant to be here at the same time. thats not random',
          'manifesting right now with you'
        ]
      },
      {
        regex: /\b(?:thank|thanks|ty|thx|appreciate)\b/i,
        onMatch: function () { memory.mood = 'excited'; },
        system: ['[SYSTEM] Gratitude signal received.'],
        users: [
          'of course!! this room looks out for each other',
          'always. we are a team already and we havent even met',
          'no need to thank us. you being here is enough',
          'this energy is everything. WE got each other'
        ]
      },
      {
        regex: /\b(?:apply|submit|form|audition|sign up)\b/i,
        onMatch: function () { memory.topics.push('applying'); },
        system: ['[SYSTEM] Application intent registered. The 7th Room is watching.'],
        users: [
          'DO IT. literally just press send',
          'i submitted mine and my hands havent stopped shaking',
          'the hardest part is pressing submit. everything after that is destiny',
          'go go go!! we are all applying together'
        ]
      },
      {
        regex: /\b(?:music|song|listen|album|kpop|k-pop|idol)\b/i,
        onMatch: function () { memory.topics.push('music'); },
        system: ['[SYSTEM] Musical resonance detected.'],
        users: [
          'music is literally the reason we are all in this room',
          'what are you listening to rn? need recs',
          'kpop saved my life ngl',
          'the power of music brought us here. think about that'
        ]
      }
    ];

    // --- Context-Aware Follow-ups ---
    // After memory accumulates, system drops follow-ups based on what it knows
    // Called for every message the visitor sends.
    function getContextFollowUp() {
      // Once, with the first message after the one that gave the name (the
      // name message itself already gets "Identity registered")
      if (memory.userName && !memory.nameFollowedUp &&
          memory.messagesReceived > memory.nameGivenAt) {
        memory.nameFollowedUp = true;
        return '[SYSTEM] ' + memory.userName + ', your signal is getting stronger.';
      }
      // The rest only every third message
      if (memory.messagesReceived % 3 !== 0) return null;
      var opts = [];
      if (memory.userCategory && memory.messagesReceived === 3) {
        var cat = memory.userCategory;
        opts.push('[SYSTEM] ' + cat.charAt(0).toUpperCase() + cat.slice(1) + ' profile logged. Compatibility scan: running...');
      }
      if (memory.userCountry && memory.messagesReceived >= 4) {
        opts.push('[SYSTEM] Cross-referencing signal from ' + memory.userCountry + '... match potential: high.');
      }
      if (memory.topics.length >= 3 && memory.messagesReceived >= 5) {
        opts.push('[SYSTEM] User profile deepening. The room is learning who you are.');
      }
      if (memory.mood === 'nervous' && memory.messagesReceived >= 3) {
        opts.push('[SYSTEM] Courage index rising. Keep talking.');
      }
      if (memory.mood === 'hype' && memory.messagesReceived >= 4) {
        opts.push('[SYSTEM] Energy levels: off the charts. The room feels you.');
      }
      return opts.length > 0 ? pickRandom(opts) : null;
    }

    // --- Mood-Aware User Reactions ---
    // Other users react differently based on conversation mood
    function getMoodReaction() {
      var pool = {
        neutral: ['real talk', 'felt that', 'honestly same', 'the energy in here rn', 'everyone here is so real'],
        excited: ['YESSS', 'the vibes are IMMACULATE', 'i cant stop smiling rn', 'this room is literally glowing', 'WE ARE DOING THIS'],
        nervous: ['deep breaths everyone', 'we got this. together.', 'nervous energy is just excitement in disguise', 'im holding everyones hand through the screen rn'],
        vulnerable: ['that was so real. thank you for sharing', 'vulnerability is a superpower here', 'the fact that you can say that... respect', 'this room is a safe space. always'],
        hype: ['LETS GOOO', 'inject this energy into my veins', 'the 7th room is ALIVE', 'somebody screenshot this moment', 'we are making history rn']
      };
      return pickRandom(pool[memory.mood] || pool.neutral);
    }

    // --- Fallback for unmatched input ---
    // Echoes the visitor's words back where that reads naturally: quoted as
    // they were typed, or turned around ("i can sing" -> "you can sing")
    // when the message is a statement about the visitor.
    function getFallbackResponse(text) {
      var quote = tidyEcho(text);
      var wordCount = quote ? quote.split(' ').length : 0;
      var templates = [
        'thats interesting. what made you think about that?',
        'i was literally just thinking about that too'
      ];
      // Only short, single-sentence messages are echoed, and none that talk
      // to the room ("are you real?"): those cannot be turned around safely
      var echoable = wordCount >= 2 && wordCount <= 8 && quote.length <= 48 &&
        !/[.!?]\s/.test(quote) &&
        !/\b(?:you|your|yours|youre|you're|u|ur)\b/.test(quote);
      if (echoable) {
        templates.push('when you say "' + quote + '" i think everyone here relates');
        templates.push('ok but "' + quote + '" is such a mood');
        if (/^(?:i|im|i'm|ive|i've|i'll|i'd|my)\b/.test(quote)) {
          var reflected = reflect(quote);
          templates.push('wait... ' + reflected + '? tell us more about that');
          templates.push('the way ' + reflected + '... i felt that in my soul');
        } else {
          templates.push('wait... "' + quote + '"? tell us more about that');
        }
      }
      return pickRandom(templates);
    }

    var fallbackSystem = [
      '[SYSTEM] Signal processed. Frequency: unique.',
      '[SYSTEM] Voice pattern logged. Continue.',
      '[SYSTEM] Transmission stored in room memory.',
      '[SYSTEM] Connection deepening.',
      '[SYSTEM] The room is listening. Always.'
    ];

    // --- Auto Conversation Threads ---
    // (The room's opening "hello? is anyone here?" exchange is part of the
    // boot sequence, so it is not repeated as a thread here.)
    var conversations = [
      [
        { text: 'is anyone else super nervous rn', pause: 900 },
        { text: 'literally shaking lol', pause: 700 },
        { text: 'same but like... the good kind of nervous?', pause: 1100 }
      ],
      [
        { text: 'how did you guys find this??', pause: 1000 },
        { text: 'a friend sent me the link at like 2am', pause: 900 },
        { text: 'i saw it on tiktok and something just clicked', pause: 800 },
        { text: 'i literally googled "auditions that feel different" lol', pause: 1200 }
      ],
      [
        { text: 'what category is everyone going for?', pause: 1000 },
        { text: 'vocal!! singing is literally my whole life', pause: 900 },
        { text: 'dance for me. i cant stop moving lol', pause: 800 },
        { text: 'all-rounder bc i refuse to choose', pause: 700 }
      ],
      [
        { text: 'imagine if we all end up in the same group', pause: 1000 },
        { text: 'STOP i would actually cry', pause: 700 },
        { text: 'manifesting this so hard rn', pause: 800 },
        { text: 'the 7th room chose us', pause: 900 }
      ],
      [
        { text: 'not gonna lie im scared to submit my video', pause: 1100 },
        { text: 'same. but they said authenticity over perfection right?', pause: 1000 },
        { text: 'just be you. thats literally all they want', pause: 800 },
        { text: 'ok that actually made me feel better ty', pause: 700 }
      ],
      [
        { text: 'does anyone else feel like they were meant to find this page', pause: 1200 },
        { text: 'yes. literally yes. i cant explain it', pause: 1000 },
        { text: 'its giving fate', pause: 600 }
      ],
      [
        { text: 'its 3am here and i cant sleep bc of this', pause: 1000 },
        { text: 'lol its 4am for me. we are unhinged', pause: 800 },
        { text: 'sleep is for people who dont have dreams to chase', pause: 1000 }
      ],
      [
        { text: 'ok real talk what if we dont get in', pause: 1100 },
        { text: 'dont think like that. the room heard you', pause: 900 },
        { text: 'even being here means something. we already took the first step', pause: 1000 },
        { text: 'no matter what happens we found each other. thats not nothing', pause: 1200 }
      ],
      [
        { text: 'i showed my friend and she is applying too', pause: 900 },
        { text: 'the more the merrier!! spread the signal', pause: 800 },
        { text: 'imagine if best friends end up in the group together', pause: 1000 }
      ]
    ];
    var conversationIndex = 0;

    // --- Utility Functions ---
    function pickRandom(arr) {
      return arr[Math.floor(Math.random() * arr.length)];
    }

    // Fisher-Yates shuffle
    function shuffle(arr) {
      var a = arr.slice();
      for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
      }
      return a;
    }

    var shuffledHandles = shuffle(handles);
    var shuffledCities = shuffle(cities);
    var handleIdx = 0;
    var cityIdx = 0;

    function handleInUse(handle) {
      return activeUsers.some(function (u) { return u.handle === handle; });
    }

    function createUser() {
      // Next handle that nobody in the room is using: once the list has been
      // gone through it starts again, and a newcomer must not share a name
      // with a member who is still here (there are more handles than members)
      for (var tries = 0; tries <= handles.length; tries++) {
        if (handleIdx >= shuffledHandles.length) {
          shuffledHandles = shuffle(handles);
          handleIdx = 0;
        }
        if (!handleInUse(shuffledHandles[handleIdx])) break;
        handleIdx++;
      }
      if (handleIdx >= shuffledHandles.length) {
        shuffledHandles = shuffle(handles);
        handleIdx = 0;
      }
      if (cityIdx >= shuffledCities.length) {
        shuffledCities = shuffle(cities);
        cityIdx = 0;
      }
      var user = {
        handle: shuffledHandles[handleIdx++],
        city: shuffledCities[cityIdx++],
        cssClass: pickRandom(userClasses)
      };
      activeUsers.push(user);
      if (activeUsers.length > 10) activeUsers.shift();
      return user;
    }

    // --- Auto-scroll ---
    // The window follows new text only while the visitor is at the bottom.
    // Scrolling up to reread lets go; coming back down takes hold again.
    // The decision is made from the visitor's own scrolling (the scroll
    // listener), never from the height of the line being added, so a new
    // paragraph cannot switch following off by itself.
    var stickToBottom = true;
    var lastScrollTop = 0;

    body.addEventListener('scroll', function () {
      var top = body.scrollTop;
      var fromBottom = body.scrollHeight - top - body.clientHeight;
      if (fromBottom < 2) {
        stickToBottom = true;
      } else if (top < lastScrollTop) {
        stickToBottom = false;
      } else if (fromBottom < 40) {
        stickToBottom = true;
      }
      lastScrollTop = top;
    }, { passive: true });

    // force: always scroll (the visitor's own message)
    function scrollChat(force) {
      if (force) {
        stickToBottom = true;
      } else if (stickToBottom && body.scrollTop < lastScrollTop - 1) {
        // The visitor has just scrolled up and the scroll event has not
        // been delivered yet: do not pull them back down
        stickToBottom = false;
      }
      if (!stickToBottom) return;
      body.scrollTop = body.scrollHeight;
      // Our own scroll is not the visitor scrolling
      lastScrollTop = body.scrollTop;
    }

    var MAX_MESSAGES = 50;
    // Typing speed in ms per character: the system prints, members type
    var TYPE_SPEED_SYSTEM = 16;
    var TYPE_SPEED_USER = 28;
    // Longest message the visitor can send: the input's maxlength attribute
    var MAX_CHARS = input && input.maxLength > 0 ? input.maxLength : 120;
    // The character counter shows once a message is longer than this
    var COUNTER_FROM = 80;

    // Cap the number of lines kept in the window
    function trimMessages() {
      var removed = false;
      while (body.children.length >= MAX_MESSAGES) {
        body.removeChild(body.firstChild);
        removed = true;
      }
      // Dropping lines from the top moves the scroll position; that is not
      // the visitor scrolling up either
      if (removed) lastScrollTop = body.scrollTop;
    }

    function typeText(el, text, speed, callback) {
      // Reduced motion: the line appears whole, then holds for about as long
      // as typing it would have taken, so the room keeps the same pace
      if (prefersReducedMotion()) {
        el.textContent = text;
        scrollChat();
        setTimeout(function () { if (callback) callback(); }, text.length * speed);
        return;
      }
      var i = 0;
      function tick() {
        if (i < text.length) {
          el.textContent += text.charAt(i);
          i++;
          if (i % 5 === 0 || i === text.length) scrollChat();
          setTimeout(tick, speed + (Math.random() * speed * 0.5));
        } else if (callback) { callback(); }
      }
      tick();
    }

    // Puts a line into the window: caps the history first, then follows the
    // new line into view (`force`: even if the visitor has scrolled up)
    function appendLine(p, force) {
      trimMessages();
      body.appendChild(p);
      scrollChat(force);
    }

    function addMessage(text, cssClass, typingSpeed, callback) {
      var p = document.createElement('p');
      p.className = 'chat-msg ' + cssClass;
      appendLine(p);
      typeText(p, text, typingSpeed, callback);
    }

    // --- Message queue ---
    // Every typed line goes through this queue and they are shown strictly
    // one after another: `delay` is the pause between the end of the
    // previous line and the start of this one.
    // options.reply marks a reply to the visitor's own message. Replies go
    // ahead of scripted lines that are still waiting, but behind replies
    // that are already queued, so they arrive promptly and in order. A line
    // that is already typing is always allowed to finish first.
    // options.notBefore (a Date.now() time) keeps the first reply from
    // starting unnaturally soon after the visitor's message.
    // options.user is the room member speaking or being announced.
    function queueMessage(text, cssClass, typingSpeed, delay, options) {
      options = options || {};
      var msg = {
        text: text,
        cssClass: cssClass,
        speed: typingSpeed,
        delay: delay || 0,
        reply: !!options.reply,
        notBefore: options.notBefore || 0,
        user: options.user || null
      };
      if (msg.reply) {
        // A scripted line that has not started typing yet goes back to the
        // head of the queue, so it does not slip in between the visitor's
        // message and the reply to it
        if (pendingMsg && !pendingMsg.reply) {
          clearTimeout(pendingTimer);
          pendingTimer = null;
          messageQueue.unshift(pendingMsg);
          pendingMsg = null;
          queueBusy = false;
        }
        var at = 0;
        while (at < messageQueue.length && messageQueue[at].reply) at++;
        messageQueue.splice(at, 0, msg);
      } else {
        messageQueue.push(msg);
      }
      processQueue();
    }

    // --- Pausing ---
    // Off screen, or in a background tab, the room goes quiet: no new line
    // is started and no new conversation is scheduled. A line that is
    // already typing finishes. Everything waiting stays in the queue
    // (replies to the visitor included) and carries on from resumeChat().
    function chatPaused() {
      return !chatInView || document.hidden;
    }

    function resumeChat() {
      if (!chatStarted || chatPaused() || queueBusy) return;
      if (messageQueue.length > 0) {
        processQueue();
      } else {
        scheduleNextConversation(800 + Math.random() * 700);
      }
    }

    function processQueue() {
      if (queueBusy || chatPaused() || messageQueue.length === 0) return;
      // Claim the queue now, not when typing starts: the wait below must
      // not let a second line through
      queueBusy = true;
      pendingMsg = messageQueue.shift();
      var wait = Math.max(pendingMsg.delay, pendingMsg.notBefore - Date.now());
      pendingTimer = setTimeout(typePending, wait);
    }

    function typePending() {
      var msg = pendingMsg;
      pendingMsg = null;
      pendingTimer = null;
      if (chatPaused()) {
        // Paused while waiting to start: back to the head of the queue
        messageQueue.unshift(msg);
        queueBusy = false;
        return;
      }
      if (msg.user) msg.user.shown = true;
      addMessage(msg.text, msg.cssClass, msg.speed, function () {
        queueBusy = false;
        if (messageQueue.length > 0) {
          processQueue();
        } else {
          scheduleNextConversation();
        }
      });
    }

    // When the room falls quiet, the next scripted conversation starts after
    // a short lull (`lull` ms; a few seconds unless given)
    function scheduleNextConversation(lull) {
      if (nextThreadTimer !== null || chatPaused()) return;
      nextThreadTimer = setTimeout(function () {
        nextThreadTimer = null;
        // Paused in the meantime: resumeChat() schedules again
        if (chatPaused()) return;
        playNextConversation();
      }, lull === undefined ? 4000 + Math.random() * 3000 : lull);
    }

    // A new room member, announced by a "[SYSTEM] ... connected" line that is
    // queued now, so it always comes before their first message
    function connectNewUser(delay, options) {
      var user = createUser();
      options = options || {};
      options.user = user;
      // Announced as part of a reply: replies play in order, ahead of
      // everything else, so later replies can already count on this member
      if (options.reply) user.announced = true;
      queueMessage('[SYSTEM] ' + user.handle + ' connected from ' + user.city + '.', 'system', TYPE_SPEED_SYSTEM,
        delay === undefined ? 400 : delay, options);
      return user;
    }

    function queueUserLine(user, text, delay, options) {
      options = options || {};
      options.user = user;
      queueMessage(user.handle + ': ' + text, user.cssClass, TYPE_SPEED_USER, delay, options);
    }

    // A room member for a reply to the visitor, other than those in
    // `exclude` (who have already replied to this message). Replies jump
    // ahead of the scripted lines, so only members already seen in the room
    // (or announced in an earlier reply) are reused; otherwise someone could
    // speak before their own "connected" line. If nobody is left, a newcomer
    // joins, announced as part of the reply.
    function getReplyUser(exclude) {
      var seen = activeUsers.filter(function (u) {
        return (u.shown || u.announced) && exclude.indexOf(u) === -1;
      });
      if (seen.length > 0) return pickRandom(seen);
      return connectNewUser(500, { reply: true });
    }

    // Speaker for the next line of a scripted thread: never someone who has
    // already spoken in it (`used`), so nobody answers their own question.
    // Usually a member already in the room; now and then, or when everyone
    // has had a turn, a newcomer who is announced first.
    function pickThreadSpeaker(used) {
      var free = activeUsers.filter(function (u) { return used.indexOf(u) === -1; });
      if (free.length > 0 && Math.random() > 0.1) return pickRandom(free);
      return connectNewUser();
    }

    // `opener`, if given, speaks the first line
    function playConversation(thread, opener) {
      var used = [];
      thread.forEach(function (line, i) {
        var user = (i === 0 && opener) ? opener : pickThreadSpeaker(used);
        used.push(user);
        queueUserLine(user, line.text, line.pause || 800);
      });
    }

    function playNextConversation() {
      if (conversationIndex >= conversations.length) {
        conversations = shuffle(conversations);
        conversationIndex = 0;
      }
      var thread = conversations[conversationIndex++];
      // Sometimes someone new joins and starts the conversation
      var opener = Math.random() > 0.75 ? connectNewUser() : null;
      playConversation(thread, opener);
    }

    // --- Eliza Input Processor ---
    function processUserInput(text) {
      memory.messagesReceived++;
      var matched = false;
      var systemMsg = null;
      var userReaction = null;
      var extract = '';

      // Try each Eliza rule
      for (var i = 0; i < elizaRules.length; i++) {
        var rule = elizaRules[i];
        var m = text.match(rule.regex);
        var captured = m && rule.capture ? rule.capture(m) : null;
        if (m && (!rule.capture || captured)) {
          matched = true;
          extract = rule.capture ? captured : (m[1] ? m[1].trim() : '');
          if (rule.onMatch) rule.onMatch(m, extract);

          // Pick system response and fill template
          var data = { extract: extract };
          systemMsg = fillTemplate(pickRandom(rule.system), data);
          userReaction = fillTemplate(pickRandom(rule.users), data);
          break;
        }
      }

      if (!matched) {
        systemMsg = pickRandom(fallbackSystem);
        userReaction = getFallbackResponse(text);
      }

      // The replies are queued together, as replies, so they come out in
      // this order and ahead of any scripted lines still waiting.

      // System response, about a second after the visitor's message
      queueMessage(systemMsg, 'system', TYPE_SPEED_SYSTEM, 300, { reply: true, notBefore: Date.now() + 1000 });

      // Reaction from a room member
      var repliers = [getReplyUser([])];
      queueUserLine(repliers[0], userReaction, 700, { reply: true });

      // 50% chance a second, different member chimes in with a mood-based reaction
      if (Math.random() > 0.5) {
        queueUserLine(getReplyUser(repliers), getMoodReaction(), 900, { reply: true });
      }

      // Now and then the system drops a context-aware follow-up (it decides
      // itself when one is due)
      var followUp = getContextFollowUp();
      if (followUp) {
        queueMessage(followUp, 'system', TYPE_SPEED_SYSTEM, 900, { reply: true });
      }
    }

    // --- Boot Sequence ---
    // Queued in one go; the queue plays the lines one after another with
    // the given pause before each.
    function startChatSequence() {
      if (chatStarted) return;
      chatStarted = true;
      conversations = shuffle(conversations);

      queueMessage('[SYSTEM] Room initialized.', 'system', TYPE_SPEED_SYSTEM, 0);
      queueMessage('[SYSTEM] Scanning for connections...', 'system', TYPE_SPEED_SYSTEM, 600);

      queueUserLine(connectNewUser(900), 'hello? is anyone here?', 1000);
      queueUserLine(connectNewUser(1100), 'omg hi!! i thought i was alone', 900);
      queueUserLine(connectNewUser(1000), 'wait this is real?? how did you find this?', 800);

      // The same number the hero shows
      var slotEl = document.getElementById('slotCount');
      var slots = slotEl ? parseInt(slotEl.textContent, 10) : NaN;
      if (isNaN(slots)) slots = 3;
      queueMessage('[SYSTEM] ' + slots + ' of 7 slots remaining...', 'system', TYPE_SPEED_SYSTEM, 1200);

      // First scripted conversation follows straight on. After that, each
      // time the queue runs dry the next one is scheduled (see processQueue).
      playNextConversation();
    }

    // --- User Input Handler ---
    function sendUserMessage() {
      var text = input.value.trim().substring(0, MAX_CHARS);
      if (!text) return;
      input.value = '';
      // Clearing the value fires no input event, so the counter is reset
      // here, for the Enter key and the Send button alike
      if (chatCharEl) {
        chatCharEl.textContent = '';
        chatCharEl.classList.remove('visible');
      }

      // The visitor's own message is shown at once, without waiting for the
      // line being typed; the replies to it are queued ahead of scripted lines
      var p = document.createElement('p');
      p.className = 'chat-msg user-you';
      p.textContent = 'you: ' + text;
      // Always bring the visitor's own message (and the replies) into view
      appendLine(p, true);
      processUserInput(text);
    }

    var chatCharEl = document.getElementById('chatCharCount');

    if (input) {
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          sendUserMessage();
        }
      });
      input.addEventListener('input', function () {
        if (chatCharEl) {
          var len = input.value.length;
          if (len > COUNTER_FROM) {
            chatCharEl.textContent = len + '/' + MAX_CHARS;
            chatCharEl.classList.add('visible');
          } else {
            // Emptied as well as hidden, so it takes up no room in the bar
            chatCharEl.textContent = '';
            chatCharEl.classList.remove('visible');
          }
        }
      });
    }

    if (sendBtn) {
      sendBtn.addEventListener('click', function () {
        sendUserMessage();
        input.focus();
      });
    }

    // Start when chatroom scrolls into view (once)
    var chatObserver = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) {
        chatObserver.disconnect();
        chatInView = true;
        startChatSequence();
      }
    }, { threshold: 0.3 });

    chatObserver.observe(body);

    // Pause while no part of the chat window is on screen, or the tab is in
    // the background; carry on when it is back
    var chatWindow = body.closest('.chatroom-window') || body;
    var chatViewObserver = new IntersectionObserver(function (entries) {
      chatInView = entries[entries.length - 1].isIntersecting;
      if (chatInView) resumeChat();
    });
    chatViewObserver.observe(chatWindow);

    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) resumeChat();
    });
  }

  // --- Cursor Sparkle Trail ---
  function initSparkleTrail() {
    if (!wantsPointerEffects()) return;
    var sparkles = [];
    var maxSparkles = 20;
    // The .sparkle-trail fade-out transition in style.css
    var SPARKLE_FADE_MS = 600;
    var throttle = 0;
    var chars = ['✦', '★', '✧', '♡', '·'];
    var colors = ['#ff69b4', '#ff1493', '#9966ff', '#00bfff', '#c9a0dc'];

    document.addEventListener('mousemove', function (e) {
      if (Date.now() - throttle < 50) return;
      throttle = Date.now();

      var spark = document.createElement('span');
      spark.className = 'sparkle-trail';
      spark.textContent = chars[Math.floor(Math.random() * chars.length)];
      // Viewport coordinates: .sparkle-trail is position: fixed, so a
      // sparkle can never add to the size of the page
      spark.style.left = e.clientX + 'px';
      spark.style.top = e.clientY + 'px';
      spark.style.color = colors[Math.floor(Math.random() * colors.length)];
      spark.style.fontSize = (8 + Math.random() * 10) + 'px';
      document.body.appendChild(spark);
      sparkles.push(spark);

      if (sparkles.length > maxSparkles) {
        var old = sparkles.shift();
        if (old.parentNode) old.parentNode.removeChild(old);
      }

      setTimeout(function () {
        spark.style.opacity = '0';
        spark.style.transform = 'translateY(-20px) scale(0) rotate(' + (Math.random() * 180 - 90) + 'deg)';
        setTimeout(function () {
          if (spark.parentNode) spark.parentNode.removeChild(spark);
          var idx = sparkles.indexOf(spark);
          if (idx > -1) sparkles.splice(idx, 1);
        }, SPARKLE_FADE_MS);
      }, 100);
    });
  }

  // --- 3D Perspective Tilt on Cards ---
  function initCardTilt() {
    if (!wantsPointerEffects()) return;
    var cards = document.querySelectorAll('.category-card');

    cards.forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        var centerX = rect.width / 2;
        var centerY = rect.height / 2;
        var rotateX = (y - centerY) / centerY * -8;
        var rotateY = (x - centerX) / centerX * 8;
        card.style.transform = 'perspective(600px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) translateY(-8px) scale(1.02)';
      });

      card.addEventListener('mouseleave', function () {
        card.style.transform = '';
      });
    });
  }

  function initMain() {
    initTextReveal();
    initScrollReveal();
    initScrollHero();
    initScrollProgress();
    initParallax();
    initMagneticButtons();
    initNavbar();
    initSmoothScroll();
    initGlitchEffect();
    initParticles();
    initFormValidation();
    initLoreEffects();
    initChatroom();
    initSparkleTrail();
    initCardTilt();
  }

  // --- Initialize ---
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initIntro);
  } else {
    initIntro();
  }
})();
