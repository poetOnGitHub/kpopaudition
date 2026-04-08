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

  // --- Interactive Chatroom ---
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
    var lastUserMsg = '';
    var conversationIndex = 0;

    // Conversation threads that play out naturally
    var conversations = [
      // greeting wave
      [
        { text: 'hello? is anyone here?', pause: 1200 },
        { text: 'omg yes!! hi!!', pause: 800 },
        { text: 'wait how many people are in here right now', pause: 1000 }
      ],
      // nervous energy
      [
        { text: 'is anyone else super nervous rn', pause: 900 },
        { text: 'literally shaking lol', pause: 700 },
        { text: 'same but like... the good kind of nervous?', pause: 1100 }
      ],
      // how they found it
      [
        { text: 'how did you guys find this??', pause: 1000 },
        { text: 'a friend sent me the link at like 2am', pause: 900 },
        { text: 'i saw it on tiktok and something just clicked', pause: 800 },
        { text: 'i literally googled "auditions that feel different" lol', pause: 1200 }
      ],
      // dreams
      [
        { text: 'i have been waiting for something like this my whole life', pause: 1100 },
        { text: 'fr fr. this doesnt feel like a normal audition', pause: 900 },
        { text: 'it feels like its looking for US not the other way around', pause: 1000 }
      ],
      // encouragement
      [
        { text: 'ok im actually going to apply right now', pause: 800 },
        { text: 'DO IT. we believe in you', pause: 600 },
        { text: 'sending you all the good energy', pause: 700 },
        { text: 'this room has the best vibes honestly', pause: 900 }
      ],
      // about themselves
      [
        { text: 'what category is everyone going for?', pause: 1000 },
        { text: 'vocal!! singing is literally my whole life', pause: 900 },
        { text: 'dance for me. i cant stop moving lol', pause: 800 },
        { text: 'all-rounder bc i refuse to choose', pause: 700 }
      ],
      // deep thoughts
      [
        { text: 'does anyone else feel like they were meant to find this page', pause: 1200 },
        { text: 'yes. literally yes. i cant explain it', pause: 1000 },
        { text: 'its giving fate', pause: 600 }
      ],
      // hype
      [
        { text: 'imagine if we all end up in the same group', pause: 1000 },
        { text: 'STOP i would actually cry', pause: 700 },
        { text: 'manifesting this so hard rn', pause: 800 },
        { text: 'the 7th room chose us', pause: 900 }
      ],
      // vulnerability
      [
        { text: 'not gonna lie im scared to submit my video', pause: 1100 },
        { text: 'same. but they said authenticity over perfection right?', pause: 1000 },
        { text: 'just be you. thats literally all they want', pause: 800 },
        { text: 'ok that actually made me feel better ty', pause: 700 }
      ],
      // late night energy
      [
        { text: 'its 3am here and i cant sleep bc of this', pause: 1000 },
        { text: 'lol its 4am for me. we are unhinged', pause: 800 },
        { text: 'sleep is for people who dont have dreams to chase', pause: 1000 }
      ]
    ];

    // Keyword patterns and responses when user types
    var keywordRules = [
      {
        patterns: ['sing', 'voice', 'vocal', 'song'],
        system: '[SYSTEM] Vocal frequency detected. Signal strength: high.',
        reactions: [
          'omg a vocalist!! what do you sing?',
          'vocal line rise up',
          'sing something for us!',
          'i bet your voice is amazing',
          'yesss we need more vocalists'
        ]
      },
      {
        patterns: ['dance', 'choreo', 'move', 'dancing'],
        system: '[SYSTEM] Movement signature logged.',
        reactions: [
          'dancer!! what style?',
          'dance line assemble',
          'i love dancers sm',
          'show us your moves when you get in!',
          'the stage needs you'
        ]
      },
      {
        patterns: ['rap', 'bars', 'flow', 'write'],
        system: '[SYSTEM] Lyrical frequency analyzed.',
        reactions: [
          'a rapper?? ok i see you',
          'spit some bars!',
          'rap line is gonna be insane',
          'words are powerful. respect',
          'we need that energy'
        ]
      },
      {
        patterns: ['nervous', 'scared', 'afraid', 'anxious', 'worry'],
        system: '[SYSTEM] Emotional resonance detected. You are not alone.',
        reactions: [
          'dont be!! we are all in this together',
          'same tbh but thats how you know it matters',
          'being nervous means you care. thats a good thing',
          'the fact that youre here means something',
          'we got you. this room is safe'
        ]
      },
      {
        patterns: ['hello', 'hi', 'hey', 'hii', 'hiii', 'heyyy'],
        system: '[SYSTEM] New signal acknowledged.',
        reactions: [
          'hiii!! welcome!!',
          'omg hi! where are you from?',
          'another one! the room is filling up',
          'welcome to the chaos lol',
          'heyyy!! glad youre here'
        ]
      },
      {
        patterns: ['dream', 'wish', 'hope', 'want', 'future'],
        system: '[SYSTEM] Dream frequency registered.',
        reactions: [
          'same dream different country. i love that',
          'we are all here for the same reason',
          'dreams are valid. always.',
          'this is just the beginning',
          'manifesting this for all of us'
        ]
      },
      {
        patterns: ['love', 'music', 'passion', 'heart'],
        system: '[SYSTEM] Passion signal amplified.',
        reactions: [
          'you can feel it right? this room has something special',
          'music connects everything',
          'thats exactly why we are here',
          'i love this energy so much',
          'the passion in this chat is unreal'
        ]
      },
      {
        patterns: ['age', 'old', 'young', 'year', 'born'],
        system: '[SYSTEM] Timeline data noted.',
        reactions: [
          'age doesnt matter here. only heart',
          'gen z taking over fr',
          'we are all young enough to dream',
          'its never too early and never too late'
        ]
      },
      {
        patterns: ['country', 'where', 'from', 'city', 'live'],
        system: '[SYSTEM] Geolocation inquiry logged.',
        reactions: [
          'the fact that we are all from different places makes this so cool',
          'global squad!',
          'different countries same dream',
          'thats what makes this special. 7 countries 1 room'
        ]
      },
      {
        patterns: ['apply', 'submit', 'form', 'video', 'audition'],
        system: '[SYSTEM] Application intent registered. The room is watching.',
        reactions: [
          'do it!! you wont regret it',
          'i just submitted mine. my hands are shaking',
          'go go go!! we believe in you',
          'the hardest part is clicking send. just do it',
          'we are all applying together. its a vibe'
        ]
      },
      {
        patterns: ['thank', 'thanks', 'ty', 'thx'],
        system: '[SYSTEM] Gratitude logged.',
        reactions: [
          'of course! we are all in this together',
          'this room supports each other',
          'always!! good luck to you',
          'we got each others backs'
        ]
      }
    ];

    // Generic fallback responses when no keyword matches
    var fallbackSystem = [
      '[SYSTEM] Message received. Signal strong.',
      '[SYSTEM] Voice logged. We hear you.',
      '[SYSTEM] Transmission recorded.',
      '[SYSTEM] Connection stable. Continue.',
      '[SYSTEM] The room acknowledges your presence.'
    ];

    var fallbackReactions = [
      'real talk',
      'felt that',
      'fr fr',
      'say it louder',
      'this!!',
      'honestly same',
      'vibe check: passed',
      'the energy in here rn',
      'i love this chat so much',
      'everyone here is so real'
    ];

    function pickRandom(arr) {
      return arr[Math.floor(Math.random() * arr.length)];
    }

    function pickAndRemove(arr) {
      var i = Math.floor(Math.random() * arr.length);
      return arr.splice(i, 1)[0];
    }

    function createUser() {
      var city = pickAndRemove(cities.slice());
      if (!city) city = pickRandom(cities);
      var handle = pickAndRemove(handles.slice());
      if (!handle) handle = pickRandom(handles);
      var user = {
        handle: handle,
        city: city,
        cssClass: pickRandom(userClasses)
      };
      activeUsers.push(user);
      return user;
    }

    function getOrCreateUser() {
      if (activeUsers.length > 0 && Math.random() > 0.4) {
        return pickRandom(activeUsers);
      }
      return createUser();
    }

    function scrollChat() {
      body.scrollTop = body.scrollHeight;
    }

    function typeText(el, text, speed, callback) {
      var i = 0;
      function tick() {
        if (i < text.length) {
          el.textContent += text.charAt(i);
          i++;
          scrollChat();
          setTimeout(tick, speed + (Math.random() * speed * 0.5));
        } else if (callback) {
          callback();
        }
      }
      tick();
    }

    function addMessage(text, cssClass, typingSpeed, callback) {
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
      setTimeout(function () {
        addMessage(msg.text, msg.cssClass, msg.speed);
      }, msg.delay);
    }

    // Play a full conversation thread with named users
    function playConversation(thread) {
      thread.forEach(function (line) {
        var user = getOrCreateUser();
        queueMessage(user.handle + ': ' + line.text, user.cssClass, 28, line.pause || 800);
      });
    }

    // Connect a new user with system announcement
    function connectNewUser() {
      var user = createUser();
      queueMessage('[SYSTEM] ' + user.handle + ' connected from ' + user.city + '.', 'system', 16, 400);
      return user;
    }

    // Play next conversation thread
    function playNextConversation() {
      if (conversationIndex >= conversations.length) {
        // Shuffle and restart
        conversations.sort(function () { return Math.random() - 0.5; });
        conversationIndex = 0;
      }
      var thread = conversations[conversationIndex++];

      // Sometimes connect a new user before the thread
      if (Math.random() > 0.5) {
        connectNewUser();
      }

      // Small delay then play the thread
      setTimeout(function () {
        playConversation(thread);
      }, 1200);
    }

    // Find keyword match for user input
    function findKeywordMatch(text) {
      var lower = text.toLowerCase();
      for (var i = 0; i < keywordRules.length; i++) {
        var rule = keywordRules[i];
        for (var j = 0; j < rule.patterns.length; j++) {
          if (lower.indexOf(rule.patterns[j]) !== -1) {
            return rule;
          }
        }
      }
      return null;
    }

    // Initial boot sequence
    function startChatSequence() {
      if (chatStarted) return;
      chatStarted = true;

      // Shuffle conversations
      conversations.sort(function () { return Math.random() - 0.5; });

      queueMessage('[SYSTEM] Room initialized.', 'system', 16, 0);
      queueMessage('[SYSTEM] Scanning for connections...', 'system', 16, 600);

      // First user connects
      setTimeout(function () {
        var u1 = connectNewUser();
        queueMessage(u1.handle + ': hello? is anyone here?', u1.cssClass, 28, 1000);
      }, 2200);

      // Second user connects and responds
      setTimeout(function () {
        var u2 = connectNewUser();
        queueMessage(u2.handle + ': omg hi!! i thought i was alone', u2.cssClass, 28, 900);
      }, 5000);

      // Third user + conversation starts flowing
      setTimeout(function () {
        var u3 = connectNewUser();
        queueMessage(u3.handle + ': wait this is real?? how did you find this?', u3.cssClass, 28, 800);
      }, 7500);

      // Slot count
      setTimeout(function () {
        var slots = 3 + Math.floor(Math.random() * 3);
        queueMessage('[SYSTEM] ' + slots + ' of 7 slots remaining...', 'system', 16, 400);
      }, 10000);

      // Start conversation threads
      setTimeout(function () { playNextConversation(); }, 12000);

      // Keep conversations going
      setInterval(function () {
        if (!isTyping && messageQueue.length === 0) {
          playNextConversation();
        }
      }, 12000 + Math.random() * 8000);
    }

    // Interactive: user sends a message with smart responses
    function sendUserMessage() {
      var text = input.value.trim();
      if (!text || isTyping) return;
      input.value = '';
      lastUserMsg = text;

      // Show user message
      queueMessage('you: ' + text, 'user-you', 10, 0);

      var match = findKeywordMatch(text);

      if (match) {
        // System response based on keyword
        setTimeout(function () {
          queueMessage(match.system, 'system', 16, 400);
        }, 600);

        // 1-2 other users react contextually
        setTimeout(function () {
          var u = getOrCreateUser();
          queueMessage(u.handle + ': ' + pickRandom(match.reactions), u.cssClass, 28, 500);
        }, 1800);

        if (Math.random() > 0.4) {
          setTimeout(function () {
            var u2 = getOrCreateUser();
            queueMessage(u2.handle + ': ' + pickRandom(match.reactions), u2.cssClass, 28, 600);
          }, 3200);
        }
      } else {
        // Fallback: generic system + user reaction
        setTimeout(function () {
          queueMessage(pickRandom(fallbackSystem), 'system', 16, 400);
        }, 600);

        setTimeout(function () {
          var u = getOrCreateUser();
          queueMessage(u.handle + ': ' + pickRandom(fallbackReactions), u.cssClass, 28, 500);
        }, 2000);
      }
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

  function initMain() {
    initScrollReveal();
    initNavbar();
    initSmoothScroll();
    initGlitchEffect();
    initParticles();
    initFormValidation();
    initLoreEffects();
    initChatroom();
  }

  // --- Initialize ---
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initIntro);
  } else {
    initIntro();
  }
})();
