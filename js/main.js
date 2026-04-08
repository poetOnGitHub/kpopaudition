/* ============================================
   7th Room — Main JavaScript
   ============================================ */

(function () {
  'use strict';

  // --- Scroll Reveal (Staggered) ---
  function initScrollReveal() {
    var revealElements = document.querySelectorAll('.reveal');
    if (!revealElements.length) return;

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
        el.style.transitionDelay = (i * 120) + 'ms';
        el.classList.add('visible');
        // Clean up delay after animation
        setTimeout(function () { el.style.transitionDelay = ''; }, 1000 + i * 120);
      });
    }, {
      threshold: 0.08,
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

    var ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(function () {
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
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  // --- Scroll Progress Bar ---
  function initScrollProgress() {
    var bar = document.createElement('div');
    bar.className = 'scroll-progress';
    document.body.appendChild(bar);

    var ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(function () {
          var scrollTop = window.scrollY;
          var docHeight = document.documentElement.scrollHeight - window.innerHeight;
          var progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
          bar.style.width = progress + '%';
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  // --- Parallax Depth on Sections ---
  function initParallax() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var parallaxEls = document.querySelectorAll('.section-title, .chatroom-window, .step-number');
    if (!parallaxEls.length) return;

    var ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(function () {
          parallaxEls.forEach(function (el) {
            var rect = el.getBoundingClientRect();
            var windowH = window.innerHeight;
            if (rect.top < windowH && rect.bottom > 0) {
              var center = rect.top + rect.height / 2;
              var offset = (center - windowH / 2) / windowH;
              el.style.transform = 'translateY(' + (offset * -20) + 'px)';
            }
          });
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  // --- Magnetic Buttons ---
  function initMagneticButtons() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var buttons = document.querySelectorAll('.btn-glossy, .btn-submit, .nav-links a');
    buttons.forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var rect = btn.getBoundingClientRect();
        var x = e.clientX - rect.left - rect.width / 2;
        var y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = 'translate(' + (x * 0.15) + 'px, ' + (y * 0.15) + 'px)';
      });
      btn.addEventListener('mouseleave', function () {
        btn.style.transform = '';
        btn.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        setTimeout(function () { btn.style.transition = ''; }, 400);
      });
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

    var animating = false;
    var rafId = null;

    function animate() {
      if (!animating) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(function (p) {
        p.update();
        p.draw();
      });
      drawConnections();
      rafId = requestAnimationFrame(animate);
    }

    // Only animate when hero is visible
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
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
      particles.forEach(function (p) { p.draw(); });
      drawConnections();
    }
  }

  // --- Form Validation ---
  function initFormValidation() {
    var form = document.getElementById('applicationForm');
    if (!form) return;

    // Set DOB max to today dynamically
    var dobInput = document.getElementById('dob');
    if (dobInput) {
      dobInput.max = new Date().toISOString().split('T')[0];
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
        if (modalClose) modalClose.focus();
      });
      document.body.style.overflow = 'hidden';
    }

    function closeModal() {
      modal.classList.remove('active');
      setTimeout(function () {
        modal.hidden = true;
      }, 400);
      document.body.style.overflow = '';
      if (submitBtn) submitBtn.focus();
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
        console.warn('playTone error:', e);
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

    // Run the boot line sequence + sounds
    function runBootSequence() {
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

      setTimeout(function () {
        if (!introComplete) finishIntro();
      }, 6800);
    }

    // Start the boot sequence (called after user click)
    function startSequence() {
      if (sequenceStarted) return;
      sequenceStarted = true;

      // Hide the "click to enter" prompt
      if (enterPrompt) enterPrompt.classList.add('hidden');

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
    var isTyping = false;
    var messageQueue = [];
    var chatStarted = false;
    var userMsgCount = 0;

    // --- Memory & State ---
    var memory = {
      topics: [],          // what user has talked about
      mood: 'neutral',     // neutral, excited, nervous, vulnerable, hype
      userName: null,       // if they share their name
      userCountry: null,    // if they share location
      userCategory: null,   // vocal/dance/rap etc
      messagesReceived: 0,
      lastTopic: null
    };

    // --- Eliza Reflection Map ---
    // Flips pronouns/perspective so we can echo back naturally
    var reflections = {
      'i am': 'you are', 'i was': 'you were', 'i have': 'you have',
      'i will': 'you will', 'i would': 'you would', 'i can': 'you can',
      'my': 'your', 'me': 'you', 'myself': 'yourself',
      'am': 'are', 'im': 'youre'
    };

    function reflect(text) {
      var words = text.toLowerCase().split(/\s+/);
      return words.map(function (w) { return reflections[w] || w; }).join(' ');
    }

    // --- Template Engine ---
    // {0} = reflected input, {name} = user handle, {city} = user city, {topic} = extracted topic
    function fillTemplate(tpl, data) {
      return tpl.replace(/\{(\w+)\}/g, function (_, key) {
        return data[key] !== undefined ? data[key] : '';
      });
    }

    // --- Eliza Pattern Rules ---
    // Each rule: regex pattern, system response templates, user reaction templates
    // {input} = reflected user input, {extract} = captured group from regex
    var elizaRules = [
      {
        regex: /\b(?:my name is|im called|call me|i am) (\w+)/i,
        onMatch: function (m) { memory.userName = m[1]; },
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
        onMatch: function (m) { memory.lastTopic = 'feelings'; },
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
        regex: /\b(?:i.?m from|i live in|from) (\w[\w\s]*)/i,
        onMatch: function (m) { memory.userCountry = m[1].trim(); memory.topics.push('location'); },
        system: ['[SYSTEM] Geolocation locked: {extract}. Signal strength: maximum.'],
        users: [
          '{extract}!! thats so cool. we really are global',
          'no way!! i have always wanted to visit {extract}',
          'different countries same chatroom same dream. i love it',
          'the 7th room has no borders. just vibes'
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
        onMatch: function () { memory.lastTopic = 'question'; },
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
    function getContextFollowUp() {
      var opts = [];
      if (memory.userName && memory.messagesReceived === 2) {
        opts.push('[SYSTEM] ' + memory.userName + ', your signal is getting stronger.');
      }
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
    // Uses reflection to echo the user's words back contextually
    function getFallbackResponse(text) {
      var reflected = reflect(text);
      var templates = [
        'wait... ' + reflected + '? tell us more about that',
        'the way ' + reflected + '... i felt that in my soul',
        'when you say ' + reflected + ' i think everyone here relates',
        'thats interesting. what made you think about that?',
        'ok but ' + reflected + ' is such a mood',
        'i was literally just thinking about that too'
      ];
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
    var conversations = [
      [
        { text: 'hello? is anyone here?', pause: 1200 },
        { text: 'omg yes!! hi!!', pause: 800 },
        { text: 'wait how many people are in here right now', pause: 1000 }
      ],
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

    var usedHandleIndexes = [];
    var usedCityIndexes = [];

    function createUser() {
      var hi = Math.floor(Math.random() * handles.length);
      while (usedHandleIndexes.indexOf(hi) !== -1 && usedHandleIndexes.length < handles.length) {
        hi = Math.floor(Math.random() * handles.length);
      }
      usedHandleIndexes.push(hi);
      var ci = Math.floor(Math.random() * cities.length);
      while (usedCityIndexes.indexOf(ci) !== -1 && usedCityIndexes.length < cities.length) {
        ci = Math.floor(Math.random() * cities.length);
      }
      usedCityIndexes.push(ci);
      var user = { handle: handles[hi], city: cities[ci], cssClass: pickRandom(userClasses) };
      activeUsers.push(user);
      return user;
    }

    function getOrCreateUser() {
      if (activeUsers.length > 0 && Math.random() > 0.35) {
        return pickRandom(activeUsers);
      }
      return createUser();
    }

    function scrollChat() { body.scrollTop = body.scrollHeight; }

    function typeText(el, text, speed, callback) {
      var i = 0;
      function tick() {
        if (i < text.length) {
          el.textContent += text.charAt(i);
          i++;
          scrollChat();
          setTimeout(tick, speed + (Math.random() * speed * 0.5));
        } else if (callback) { callback(); }
      }
      tick();
    }

    var MAX_MESSAGES = 50;

    function addMessage(text, cssClass, typingSpeed, callback) {
      // Cap DOM elements
      while (body.children.length >= MAX_MESSAGES) {
        body.removeChild(body.firstChild);
      }
      var p = document.createElement('p');
      p.className = 'chat-msg ' + cssClass;
      body.appendChild(p);
      scrollChat();
      isTyping = true;
      typeText(p, text, typingSpeed, function () {
        isTyping = false;
        if (callback) callback();
        processQueue();
      });
    }

    function queueMessage(text, cssClass, typingSpeed, delay) {
      messageQueue.push({ text: text, cssClass: cssClass, speed: typingSpeed, delay: delay || 0 });
      if (!isTyping) processQueue();
    }

    function processQueue() {
      if (isTyping || messageQueue.length === 0) return;
      var msg = messageQueue.shift();
      setTimeout(function () { addMessage(msg.text, msg.cssClass, msg.speed); }, msg.delay);
    }

    function connectNewUser() {
      var user = createUser();
      queueMessage('[SYSTEM] ' + user.handle + ' connected from ' + user.city + '.', 'system', 16, 400);
      return user;
    }

    function playConversation(thread) {
      thread.forEach(function (line) {
        var user = getOrCreateUser();
        queueMessage(user.handle + ': ' + line.text, user.cssClass, 28, line.pause || 800);
      });
    }

    function playNextConversation() {
      if (conversationIndex >= conversations.length) {
        conversations.sort(function () { return Math.random() - 0.5; });
        conversationIndex = 0;
      }
      var thread = conversations[conversationIndex++];
      if (Math.random() > 0.5) connectNewUser();
      setTimeout(function () { playConversation(thread); }, 1200);
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
        if (m) {
          matched = true;
          extract = m[1] ? m[1].trim() : '';
          if (rule.onMatch) rule.onMatch(m);

          // Pick system response and fill template
          var data = { extract: extract, input: reflect(text) };
          systemMsg = fillTemplate(pickRandom(rule.system), data);
          userReaction = fillTemplate(pickRandom(rule.users), data);
          break;
        }
      }

      if (!matched) {
        systemMsg = pickRandom(fallbackSystem);
        userReaction = getFallbackResponse(text);
      }

      // Queue system response
      setTimeout(function () {
        queueMessage(systemMsg, 'system', 16, 400);
      }, 600);

      // Queue user reaction from a room member
      setTimeout(function () {
        var u = getOrCreateUser();
        queueMessage(u.handle + ': ' + userReaction, u.cssClass, 28, 500);
      }, 1800);

      // 50% chance second user chimes in with mood-based reaction
      if (Math.random() > 0.5) {
        setTimeout(function () {
          var u2 = getOrCreateUser();
          queueMessage(u2.handle + ': ' + getMoodReaction(), u2.cssClass, 28, 600);
        }, 3200);
      }

      // Every few messages, system drops a context-aware follow-up
      if (memory.messagesReceived % 3 === 0) {
        var followUp = getContextFollowUp();
        if (followUp) {
          setTimeout(function () {
            queueMessage(followUp, 'system', 16, 500);
          }, 4500);
        }
      }
    }

    // --- Boot Sequence ---
    function startChatSequence() {
      if (chatStarted) return;
      chatStarted = true;
      conversations.sort(function () { return Math.random() - 0.5; });

      queueMessage('[SYSTEM] Room initialized.', 'system', 16, 0);
      queueMessage('[SYSTEM] Scanning for connections...', 'system', 16, 600);

      setTimeout(function () {
        var u1 = connectNewUser();
        queueMessage(u1.handle + ': hello? is anyone here?', u1.cssClass, 28, 1000);
      }, 2200);

      setTimeout(function () {
        var u2 = connectNewUser();
        queueMessage(u2.handle + ': omg hi!! i thought i was alone', u2.cssClass, 28, 900);
      }, 5000);

      setTimeout(function () {
        var u3 = connectNewUser();
        queueMessage(u3.handle + ': wait this is real?? how did you find this?', u3.cssClass, 28, 800);
      }, 7500);

      setTimeout(function () {
        var slots = 3 + Math.floor(Math.random() * 3);
        queueMessage('[SYSTEM] ' + slots + ' of 7 slots remaining...', 'system', 16, 400);
      }, 10000);

      setTimeout(function () { playNextConversation(); }, 12000);

      setInterval(function () {
        if (!isTyping && messageQueue.length === 0) {
          playNextConversation();
        }
      }, 14000);
    }

    // --- User Input Handler ---
    function sendUserMessage() {
      var text = input.value.trim();
      if (!text || isTyping) return;
      input.value = '';

      queueMessage('you: ' + text, 'user-you', 10, 0);
      processUserInput(text);
    }

    if (input) {
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          sendUserMessage();
        }
      });
    }

    if (sendBtn) {
      sendBtn.addEventListener('click', function () {
        sendUserMessage();
        input.focus();
      });
    }

    // Start when chatroom scrolls into view
    var chatObserver = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) {
        chatObserver.disconnect();
        startChatSequence();
      }
    }, { threshold: 0.3 });

    chatObserver.observe(body);
  }

  // --- Cursor Sparkle Trail ---
  function initSparkleTrail() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var sparkles = [];
    var maxSparkles = 20;
    var throttle = 0;
    var chars = ['✦', '★', '✧', '♡', '·'];
    var colors = ['#ff69b4', '#ff1493', '#9966ff', '#00bfff', '#c9a0dc'];

    document.addEventListener('mousemove', function (e) {
      if (Date.now() - throttle < 50) return;
      throttle = Date.now();

      var spark = document.createElement('span');
      spark.className = 'sparkle-trail';
      spark.textContent = chars[Math.floor(Math.random() * chars.length)];
      spark.style.left = e.pageX + 'px';
      spark.style.top = e.pageY + 'px';
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
        }, 600);
      }, 100);
    });
  }

  // --- 3D Perspective Tilt on Cards ---
  function initCardTilt() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
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
