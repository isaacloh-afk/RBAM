/* =================================================================
   Red Beacon Asset Management Pte Ltd — script.js
   Vanilla JS only. No dependencies.

   Handles: mobile nav, navbar shadow on scroll, scroll-reveal
   animations, testimonial carousel, footer year, and the enquiry
   form (validation + FormSubmit AJAX submission).
   ================================================================= */

(function () {
  "use strict";

  /* ------------------------------------------------------------------
     1. Mobile navigation (hamburger toggle)
  ------------------------------------------------------------------ */
  const navToggle = document.getElementById("navToggle");
  const navMenu = document.getElementById("navMenu");

  function closeMenu() {
    navMenu.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
  }

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", function () {
      const isOpen = navMenu.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });

    // Close the menu after tapping any link (mobile)
    navMenu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });

    // Close on Escape for keyboard users
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });
  }

  /* ------------------------------------------------------------------
     2. Add a subtle shadow to the navbar once the page is scrolled
  ------------------------------------------------------------------ */
  const navbar = document.getElementById("navbar");

  function onScroll() {
    if (!navbar) return;
    navbar.classList.toggle("is-scrolled", window.scrollY > 8);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ------------------------------------------------------------------
     3. Scroll-in reveal animations via IntersectionObserver
  ------------------------------------------------------------------ */
  const revealEls = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target); // reveal once, then stop watching
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach(function (el) {
      io.observe(el);
    });
  } else {
    // Fallback: just show everything if IO is unavailable
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  /* ------------------------------------------------------------------
     4. Testimonial carousel (auto-rotate + prev/next + dots)
  ------------------------------------------------------------------ */
  const carousel = document.getElementById("carousel");

  if (carousel) {
    const slides = Array.prototype.slice.call(carousel.querySelectorAll(".slide"));
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");
    const dotsWrap = document.getElementById("dots");
    const ROTATE_MS = 6000;

    let index = 0;
    let timer = null;

    // Build a dot button per slide
    const dots = slides.map(function (_, i) {
      const dot = document.createElement("button");
      dot.className = "dot";
      dot.type = "button";
      dot.setAttribute("role", "tab");
      dot.setAttribute("aria-label", "Show testimonial " + (i + 1));
      dot.addEventListener("click", function () {
        goTo(i);
        restart();
      });
      dotsWrap.appendChild(dot);
      return dot;
    });

    function goTo(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        const active = i === index;
        slide.classList.toggle("is-active", active);
        slide.hidden = !active;
        dots[i].classList.toggle("is-active", active);
        dots[i].setAttribute("aria-selected", String(active));
      });
    }

    function next() {
      goTo(index + 1);
    }
    function prev() {
      goTo(index - 1);
    }

    function start() {
      timer = window.setInterval(next, ROTATE_MS);
    }
    function stop() {
      window.clearInterval(timer);
      timer = null;
    }
    function restart() {
      stop();
      start();
    }

    if (nextBtn) nextBtn.addEventListener("click", function () { next(); restart(); });
    if (prevBtn) prevBtn.addEventListener("click", function () { prev(); restart(); });

    // Pause on hover / focus within, resume on leave
    carousel.addEventListener("mouseenter", stop);
    carousel.addEventListener("mouseleave", start);
    carousel.addEventListener("focusin", stop);
    carousel.addEventListener("focusout", start);

    // Keyboard arrows when the carousel has focus
    carousel.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { next(); restart(); }
      else if (e.key === "ArrowLeft") { prev(); restart(); }
    });

    goTo(0);
    start();
  }

  /* ------------------------------------------------------------------
     5. Footer year (auto-updates)
  ------------------------------------------------------------------ */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ------------------------------------------------------------------
     6. Enquiry form — validation + FormSubmit AJAX submission

     NOTE: FormSubmit requires a ONE-TIME activation. The very first
     submission to a new email address triggers a confirmation email;
     the form only delivers messages after you click that link.
  ------------------------------------------------------------------ */

  // REPLACE_WITH_YOUR_EMAIL — drop in the address that should receive enquiries.
  const FORMSUBMIT_EMAIL = "isaac.loh@redbeaconam.com";
  const ENDPOINT = "https://formsubmit.co/ajax/" + FORMSUBMIT_EMAIL;

  const form = document.getElementById("enquiryForm");
  const submitBtn = document.getElementById("submitBtn");
  const formError = document.getElementById("formError");
  const formSuccess = document.getElementById("formSuccess");

  // Basic, pragmatic email pattern (RFC-perfect regexes are overkill here)
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Validation rules per required field
  const rules = {
    name: function (v) {
      return v.trim() ? "" : "Please enter your full name.";
    },
    email: function (v) {
      if (!v.trim()) return "Please enter your email address.";
      return EMAIL_RE.test(v.trim()) ? "" : "Please enter a valid email address.";
    },
    message: function (v) {
      return v.trim() ? "" : "Please let us know how we can help.";
    },
  };

  function setFieldError(name, msg) {
    const input = document.getElementById(name);
    const errorEl = document.getElementById(name + "-error");
    if (!input || !errorEl) return;
    const field = input.closest(".field");
    if (msg) {
      field.classList.add("is-invalid");
      input.setAttribute("aria-invalid", "true");
      errorEl.textContent = msg;
    } else {
      field.classList.remove("is-invalid");
      input.removeAttribute("aria-invalid");
      errorEl.textContent = "";
    }
  }

  function validate() {
    let firstInvalid = null;
    Object.keys(rules).forEach(function (name) {
      const input = document.getElementById(name);
      const msg = rules[name](input.value);
      setFieldError(name, msg);
      if (msg && !firstInvalid) firstInvalid = input;
    });
    if (firstInvalid) firstInvalid.focus();
    return !firstInvalid;
  }

  if (form) {
    // Clear a field's error as soon as the user corrects it
    Object.keys(rules).forEach(function (name) {
      const input = document.getElementById(name);
      if (input) {
        input.addEventListener("input", function () {
          if (input.closest(".field").classList.contains("is-invalid")) {
            setFieldError(name, rules[name](input.value));
          }
        });
      }
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      // Honeypot: if a bot filled the hidden field, silently succeed.
      const honey = document.getElementById("_honey");
      if (honey && honey.value) {
        return;
      }

      if (formError) formError.hidden = true;
      if (!validate()) return;

      // Assemble the JSON payload, including FormSubmit helper fields.
      const payload = {
        name: form.name.value.trim(),
        email: form.email.value.trim(),
        phone: form.phone.value.trim(),
        interest: form.interest.value,
        message: form.message.value.trim(),
        _subject: "New enquiry from Red Beacon Asset Management website",
        _template: "table",
        _captcha: "false",
      };

      // Enter "sending" state
      submitBtn.disabled = true;
      const originalLabel = submitBtn.textContent;
      submitBtn.textContent = "Sending…";

      fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      })
        .then(function (res) {
          if (!res.ok) throw new Error("Request failed with status " + res.status);
          return res.json();
        })
        .then(function () {
          // Success: replace the form with the thank-you panel
          form.hidden = true;
          if (formSuccess) {
            formSuccess.hidden = false;
            formSuccess.classList.add("is-visible");
            formSuccess.setAttribute("tabindex", "-1");
            formSuccess.focus();
          }
          form.reset();

          // Celebrate: speak a congratulatory message + float balloons.
          celebrateSubmission();
        })
        .catch(function () {
          // Error: surface an inline message and re-enable the button
          if (formError) {
            formError.innerHTML =
              'Sorry — something went wrong sending your message. Please try again, or email us at <a href="mailto:isaac.loh@redbeaconam.com">isaac.loh@redbeaconam.com</a>.';
            formError.hidden = false;
          }
          submitBtn.disabled = false;
          submitBtn.textContent = originalLabel;
        });
    });
  }

  /* ------------------------------------------------------------------
     6b. Submission celebration — spoken message + floating balloons

     Fired once on a successful enquiry. The Web Speech API call runs
     inside the form-submit user gesture, so browsers allow it to play.
     Both effects no-op gracefully where unsupported or when the user
     prefers reduced motion.
  ------------------------------------------------------------------ */

  const CELEBRATION_MESSAGE =
    "Well done on taking your first step towards financial freedom! " +
    "Thank you for your submission. We will get back to you within one business day.";

  function prefersReducedMotion() {
    return (
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function speakCelebration() {
    try {
      if (!("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(CELEBRATION_MESSAGE);
      utterance.rate = 1;
      utterance.pitch = 1.05;
      utterance.volume = 1;
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      /* speech is a nice-to-have; never let it break submission */
    }
  }

  function launchBalloons() {
    if (prefersReducedMotion()) return;

    // Brand-warm palette for the balloons.
    const colors = [
      "#e2603a", // beacon coral
      "#c0492f", // beacon red
      "#9c3520", // deep clay
      "#b5781a", // candlelight amber
      "#d98b3f", // warm gold
      "#7a6a5a", // warm stone
    ];
    const COUNT = 16;
    const MAX_LIFE_MS = 9000;

    const layer = document.createElement("div");
    layer.className = "balloons";
    layer.setAttribute("aria-hidden", "true");

    for (let i = 0; i < COUNT; i++) {
      const balloon = document.createElement("div");
      balloon.className = "balloon";

      // Deterministic-but-varied spread without Math.random dependence.
      const leftPct = (i / COUNT) * 100 + ((i * 7) % 6);
      const duration = 5.5 + ((i * 13) % 40) / 10; // 5.5s – 9.4s
      const delay = ((i * 11) % 18) / 10; // 0 – 1.7s
      const drift = (((i % 2 === 0 ? 1 : -1) * (20 + ((i * 9) % 60))) | 0); // ±px
      const spin = (i % 2 === 0 ? 1 : -1) * (6 + (i % 5)) + "deg";
      const scale = 0.7 + ((i * 17) % 60) / 100; // 0.7 – 1.29

      balloon.style.setProperty("--balloon-color", colors[i % colors.length]);
      balloon.style.setProperty("--rise-duration", duration + "s");
      balloon.style.setProperty("--drift", drift + "px");
      balloon.style.setProperty("--spin", spin);
      balloon.style.setProperty("--scale", String(scale));
      balloon.style.left = leftPct + "%";
      balloon.style.animationDelay = delay + "s";

      layer.appendChild(balloon);
    }

    document.body.appendChild(layer);

    // Tidy up after the longest balloon (duration + delay) has finished.
    window.setTimeout(function () {
      layer.remove();
    }, MAX_LIFE_MS);
  }

  function celebrateSubmission() {
    speakCelebration();
    launchBalloons();
  }

  /* ------------------------------------------------------------------
     7. WhatsApp chat widget — launcher, suggested queries, deep-link

     Suggested-query chips set the message; the "Open WhatsApp" link
     (and a tapped chip) deep-links to wa.me with the message prefilled.
  ------------------------------------------------------------------ */

  // Destination WhatsApp number in international format, digits only.
  const WHATSAPP_NUMBER = "6583232023";

  const waWidget = document.getElementById("waWidget");
  const waLauncher = document.getElementById("waLauncher");
  const waPanel = document.getElementById("waPanel");
  const waClose = document.getElementById("waClose");
  const waChips = document.getElementById("waChips");
  const waSend = document.getElementById("waSend");

  if (waWidget && waLauncher && waPanel && waSend) {
    const DEFAULT_MSG = "Hello Red Beacon, I'd like to find out more.";
    let currentMsg = DEFAULT_MSG;

    function waLink(message) {
      return (
        "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(message)
      );
    }

    function setMessage(message) {
      currentMsg = message;
      waSend.href = waLink(message);
    }
    setMessage(DEFAULT_MSG);

    function openPanel() {
      waPanel.hidden = false;
      waPanel.classList.add("is-entering");
      // Force reflow so the entry transition runs, then settle.
      void waPanel.offsetWidth;
      waPanel.classList.remove("is-entering");
      waWidget.classList.add("is-open");
      waLauncher.setAttribute("aria-expanded", "true");
    }

    function closePanel() {
      waWidget.classList.remove("is-open");
      waLauncher.setAttribute("aria-expanded", "false");
      waPanel.hidden = true;
    }

    function togglePanel() {
      if (waPanel.hidden) openPanel();
      else closePanel();
    }

    waLauncher.addEventListener("click", togglePanel);
    if (waClose) waClose.addEventListener("click", closePanel);

    // Chip click: highlight, set the message, and open WhatsApp directly.
    if (waChips) {
      const chips = Array.prototype.slice.call(
        waChips.querySelectorAll(".wa__chip")
      );
      chips.forEach(function (chip) {
        chip.addEventListener("click", function () {
          const query = chip.getAttribute("data-query") || DEFAULT_MSG;
          chips.forEach(function (c) {
            c.classList.toggle("is-selected", c === chip);
          });
          setMessage(query);
          window.open(waLink(query), "_blank", "noopener");
        });
      });
    }

    // Close on Escape when the panel is open
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !waPanel.hidden) {
        closePanel();
        waLauncher.focus();
      }
    });
  }
})();
