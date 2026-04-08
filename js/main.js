/* ============================================
   7th Room — Main JavaScript
   ============================================ */

(function () {
  'use strict';

  // --- Scroll Reveal ---
  function initScrollReveal() {
    var revealElements = document.querySelectorAll('.reveal');
    if (!revealElements.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(function (el) {
      observer.observe(el);
    });
  }

  // --- Navbar ---
  function initNavbar() {
    var navbar = document.getElementById('navbar');
    var navToggle = document.getElementById('navToggle');
    var navLinks = document.getElementById('navLinks');
    var links = navLinks.querySelectorAll('a');

    // Scroll effect
    var lastScroll = 0;
    window.addEventListener('scroll', function () {
      var current = window.scrollY;
      if (current > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
      lastScroll = current;
    }, { passive: true });

    // Mobile toggle
    navToggle.addEventListener('click', function () {
      var isOpen = navLinks.classList.toggle('open');
      navToggle.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close on link click
    links.forEach(function (link) {
      link.addEventListener('click', function () {
        navLinks.classList.remove('open');
        navToggle.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });

    // Active section highlighting
    var sections = document.querySelectorAll('section[id]');
    var observerNav = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var id = entry.target.getAttribute('id');
          links.forEach(function (l) { l.classList.remove('active'); });
          var activeLink = navLinks.querySelector('a[href="#' + id + '"]');
          if (activeLink) activeLink.classList.add('active');
        }
      });
    }, {
      threshold: 0.3,
      rootMargin: '-80px 0px -50% 0px'
    });

    sections.forEach(function (s) { observerNav.observe(s); });
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
        window.scrollTo({ top: top, behavior: 'smooth' });
      });
    });
  }

  // --- Glitch Effect ---
  function initGlitchEffect() {
    var glitchEl = document.querySelector('.glitch');
    if (!glitchEl) return;

    function triggerGlitch() {
      glitchEl.classList.add('glitching');
      setTimeout(function () {
        glitchEl.classList.remove('glitching');
      }, 300);
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

    function resize() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }

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
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
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
      if (this.x < 0) this.x = canvas.width;
      if (this.x > canvas.width) this.x = 0;
      if (this.y < 0) this.y = canvas.height;
      if (this.y > canvas.height) this.y = 0;
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
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(function (p) {
        p.update();
        p.draw();
      });
      drawConnections();
      requestAnimationFrame(animate);
    }

    // Only animate if user doesn't prefer reduced motion
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      animate();
    } else {
      // Static render
      particles.forEach(function (p) { p.draw(); });
      drawConnections();
    }
  }

  // --- Form Validation ---
  function initFormValidation() {
    var form = document.getElementById('applicationForm');
    if (!form) return;

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

    // File upload visual feedback
    if (fileUpload && photoInput) {
      photoInput.addEventListener('change', function () {
        if (this.files && this.files.length > 0) {
          fileUpload.classList.add('has-file');
          var text = fileUpload.querySelector('.file-upload-text');
          if (text) text.textContent = this.files[0].name;
        } else {
          fileUpload.classList.remove('has-file');
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

      fileUpload.addEventListener('drop', function () {
        this.classList.remove('dragover');
      });
    }

    // Validate individual field
    function validateField(input) {
      var errorEl = input.closest('.form-group').querySelector('.form-error');
      if (!errorEl) {
        // For checkbox
        var checkboxGroup = input.closest('.form-group');
        if (checkboxGroup) errorEl = checkboxGroup.querySelector('.form-error');
      }
      var msg = '';

      if (input.required && !input.value.trim() && input.type !== 'checkbox' && input.type !== 'file') {
        msg = 'This field is required.';
      } else if (input.required && input.type === 'checkbox' && !input.checked) {
        msg = 'You must agree to continue.';
      } else if (input.required && input.type === 'file' && (!input.files || input.files.length === 0)) {
        msg = 'Please upload a photo.';
      } else if (input.type === 'email' && input.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) {
        msg = 'Please enter a valid email.';
      } else if (input.type === 'url' && input.value && !/^https?:\/\/.+/i.test(input.value)) {
        msg = 'Please enter a valid URL (https://...)';
      }

      if (msg) {
        input.classList.add('error');
        if (errorEl) errorEl.textContent = msg;
        return false;
      } else {
        input.classList.remove('error');
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

    // Form submission
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      // Validate all fields
      var allValid = true;
      var requiredInputs = form.querySelectorAll('[required]');
      requiredInputs.forEach(function (input) {
        if (!validateField(input)) {
          allValid = false;
        }
      });

      if (!allValid) {
        // Scroll to first error
        var firstError = form.querySelector('.error');
        if (firstError) {
          firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
          firstError.focus();
        }
        return;
      }

      // Show loading
      submitBtn.classList.add('loading');

      // Collect form data
      var formData = new FormData(form);
      var data = {};
      formData.forEach(function (value, key) {
        if (key !== 'photo') {
          data[key] = value;
        }
      });

      // Submit to Formspree (or simulate if no ID configured)
      var action = form.getAttribute('action');
      if (action && !action.includes('YOUR_FORM_ID')) {
        fetch(action, {
          method: 'POST',
          body: formData,
          headers: { 'Accept': 'application/json' }
        })
        .then(function (response) {
          submitBtn.classList.remove('loading');
          if (response.ok) {
            showModal();
            form.reset();
            if (charCount) charCount.textContent = '0';
            if (fileUpload) {
              fileUpload.classList.remove('has-file');
              var text = fileUpload.querySelector('.file-upload-text');
              if (text) text.textContent = 'Drop your photo here or click to browse';
            }
          } else {
            alert('Something went wrong. Please try again.');
          }
        })
        .catch(function () {
          submitBtn.classList.remove('loading');
          alert('Network error. Please check your connection and try again.');
        });
      } else {
        // Simulate submission (no Formspree ID configured)
        setTimeout(function () {
          submitBtn.classList.remove('loading');
          data.timestamp = new Date().toISOString();
          try {
            var stored = JSON.parse(localStorage.getItem('7throom_applications') || '[]');
            stored.push(data);
            localStorage.setItem('7throom_applications', JSON.stringify(stored));
          } catch (err) {
            // localStorage not available, ignore
          }
          showModal();
          form.reset();
          if (charCount) charCount.textContent = '0';
          if (fileUpload) {
            fileUpload.classList.remove('has-file');
            var text = fileUpload.querySelector('.file-upload-text');
            if (text) text.textContent = 'Drop your photo here or click to browse';
          }
        }, 1500);
      }
    });

    // Modal
    function showModal() {
      modal.hidden = false;
      requestAnimationFrame(function () {
        modal.classList.add('active');
      });
      document.body.style.overflow = 'hidden';
    }

    function closeModal() {
      modal.classList.remove('active');
      setTimeout(function () {
        modal.hidden = true;
      }, 400);
      document.body.style.overflow = '';
    }

    if (modalClose) {
      modalClose.addEventListener('click', closeModal);
    }

    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
      }
    });
  }

  // --- Lore Effects ---
  function initLoreEffects() {
    // Update timestamp
    var timestampEl = document.getElementById('heroTimestamp');
    if (timestampEl) {
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
      updateTimestamp();
      setInterval(updateTimestamp, 1000);
    }

    // Subtle coordinate drift
    var coordsEl = document.getElementById('heroCoords');
    if (coordsEl) {
      setInterval(function () {
        var lat = (37.5665 + (Math.random() - 0.5) * 0.001).toFixed(4);
        var lng = (126.9780 + (Math.random() - 0.5) * 0.001).toFixed(4);
        coordsEl.textContent = lat + '\u00B0N, ' + lng + '\u00B0E';
      }, 5000);
    }

    // Random system message flickers
    var systemMsgs = document.querySelectorAll('.hero-system-msg, .footer-lore');
    systemMsgs.forEach(function (msg) {
      setInterval(function () {
        if (Math.random() > 0.7) {
          msg.style.opacity = '0.2';
          setTimeout(function () {
            msg.style.opacity = '';
          }, 150);
        }
      }, 3000);
    });
  }

  // --- Chatroom Intro Sequence ---
  function initIntro() {
    var overlay = document.getElementById('introOverlay');
    var skipBtn = document.getElementById('introSkip');
    var enterPrompt = document.getElementById('introEnter');
    if (!overlay) { initMain(); return; }

    // Skip intro for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      overlay.hidden = true;
      initMain();
      return;
    }

    document.body.classList.add('intro-active');
    var lines = overlay.querySelectorAll('.intro-line');
    var audioCtx = null;
    var introComplete = false;
    var sequenceStarted = false;

    // Create AudioContext only after user gesture
    function ensureAudioContext() {
      if (audioCtx) {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        return;
      }
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        // Audio not supported
      }
    }

    function playTone(freq, duration, volume, type) {
      if (!audioCtx || audioCtx.state !== 'running') return;
      try {
        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = type || 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(volume || 0.05, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
      } catch (e) {}
    }

    function playBootSound() {
      playTone(200, 0.15, 0.04, 'square');
      setTimeout(function () { playTone(300, 0.1, 0.03, 'square'); }, 80);
    }

    function playTypeSound() {
      playTone(800 + Math.random() * 400, 0.03, 0.02, 'square');
    }

    function playConnectSound() {
      playTone(523, 0.15, 0.06, 'sine');
      setTimeout(function () { playTone(659, 0.15, 0.06, 'sine'); }, 120);
      setTimeout(function () { playTone(784, 0.25, 0.06, 'sine'); }, 240);
    }

    function playNotificationSound() {
      playTone(880, 0.08, 0.04, 'sine');
      setTimeout(function () { playTone(1100, 0.12, 0.04, 'sine'); }, 100);
    }

    function playWelcomeChime() {
      [523, 659, 784, 1047].forEach(function (note, i) {
        setTimeout(function () { playTone(note, 0.4, 0.05, 'sine'); }, i * 150);
      });
    }

    // Start the boot sequence (called after user click)
    function startSequence() {
      if (sequenceStarted) return;
      sequenceStarted = true;

      // Hide the "click to enter" prompt
      if (enterPrompt) enterPrompt.classList.add('hidden');

      // Create audio context now (inside user gesture)
      ensureAudioContext();
      playBootSound();

      lines.forEach(function (line, index) {
        var delay = parseInt(line.getAttribute('data-delay'), 10);
        setTimeout(function () {
          if (introComplete) return;
          line.classList.add('visible');

          if (index < 5) {
            for (var i = 0; i < 3; i++) {
              (function (j) {
                setTimeout(function () {
                  if (!introComplete) playTypeSound();
                }, j * 60);
              })(i);
            }
          }
          if (index === 3) playNotificationSound();
          if (index === 5) playConnectSound();
          if (index === 6) playWelcomeChime();
        }, delay);
      });

      // Auto-finish after last line
      setTimeout(function () {
        if (!introComplete) finishIntro();
      }, 6800);
    }

    function finishIntro() {
      if (introComplete) return;
      introComplete = true;
      overlay.classList.add('fade-out');
      document.body.classList.remove('intro-active');
      setTimeout(function () {
        overlay.hidden = true;
      }, 800);
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

    // Escape skips
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !introComplete) finishIntro();
      // Any key starts the sequence if not started
      if (!sequenceStarted && !introComplete) startSequence();
    });
  }

  function initMain() {
    initScrollReveal();
    initNavbar();
    initSmoothScroll();
    initGlitchEffect();
    initParticles();
    initFormValidation();
    initLoreEffects();
  }

  // --- Initialize ---
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initIntro);
  } else {
    initIntro();
  }
})();
