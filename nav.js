(function () {
  var REDUCE_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

  function syncBodyNavState() {
    if (!document.body) {
      return;
    }
    var hasOpenNav = !!document.querySelector(".nav.is-open");
    document.body.classList.toggle("nav-open", hasOpenNav);
  }

  function closeNav(nav) {
    nav.classList.remove("is-open");
    var toggle = nav.querySelector(".nav-toggle");
    if (toggle) {
      toggle.setAttribute("aria-expanded", "false");
    }
    syncBodyNavState();
  }

  function closeAllNavs() {
    document.querySelectorAll(".nav.is-open").forEach(function (nav) {
      nav.classList.remove("is-open");
      var toggle = nav.querySelector(".nav-toggle");
      if (toggle) {
        toggle.setAttribute("aria-expanded", "false");
      }
    });
    syncBodyNavState();
  }

  function ensureNavBackdrop() {
    var existing = document.querySelector(".nav-backdrop");
    if (existing) {
      return existing;
    }
    var backdrop = document.createElement("button");
    backdrop.className = "nav-backdrop";
    backdrop.type = "button";
    backdrop.setAttribute("aria-label", "Close menu");
    backdrop.tabIndex = -1;
    document.body.appendChild(backdrop);
    return backdrop;
  }

  function setupMobileNav() {
    var backdrop = ensureNavBackdrop();
    backdrop.addEventListener("click", function () {
      closeAllNavs();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeAllNavs();
      }
    });

    document.addEventListener("click", function (event) {
      if (window.innerWidth > 760) {
        return;
      }
      var target = event.target;
      if (!target || typeof target.closest !== "function") {
        return;
      }
      if (!target.closest(".nav")) {
        closeAllNavs();
      }
    });

    var navs = document.querySelectorAll(".nav");
    navs.forEach(function (nav) {
      var toggle = nav.querySelector(".nav-toggle");
      var links = nav.querySelector(".nav-links");
      if (!toggle || !links) {
        return;
      }

      toggle.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();

        var willOpen = !nav.classList.contains("is-open");
        closeAllNavs();

        if (willOpen) {
          nav.classList.add("is-open");
        }

        var isOpen = nav.classList.contains("is-open");
        toggle.setAttribute("aria-expanded", String(isOpen));
        syncBodyNavState();
      });

      links.addEventListener("click", function (event) {
        if (window.innerWidth > 760) {
          return;
        }

        var target = event.target;
        if (!target || typeof target.closest !== "function") {
          return;
        }

        var link = target.closest("a");
        if (!link) {
          return;
        }

        var href = (link.getAttribute("href") || "").trim();
        var isHashOnly = href.charAt(0) === "#" && href.indexOf("/") === -1;

        if (isHashOnly) {
          // Allow same-page anchor navigation first, then close menu.
          window.setTimeout(function () {
            closeNav(nav);
          }, 0);
          return;
        }

        // Do not hide/remove the tapped anchor immediately on mobile Safari.
        window.setTimeout(function () {
          closeAllNavs();
        }, 120);
      });

      window.addEventListener("resize", function () {
        if (window.innerWidth > 760) {
          closeAllNavs();
        }
      });
    });
  }

  function parseCountParts(raw) {
    var match = raw.match(/-?\d[\d,]*/);
    if (!match || typeof match.index !== "number") {
      return null;
    }

    var prefix = raw.slice(0, match.index);
    var valueText = match[0];
    var suffix = raw.slice(match.index + valueText.length);
    var target = parseInt(valueText.replace(/,/g, ""), 10);
    if (Number.isNaN(target)) {
      return null;
    }

    return {
      prefix: prefix,
      suffix: suffix,
      target: target
    };
  }

  function formatCount(value, target) {
    var rounded = Math.round(value);
    if (target >= 1000) {
      return rounded.toLocaleString("en-US");
    }
    return String(rounded);
  }

  function animateCount(el) {
    if (!el || el.dataset.countDone === "1") {
      return;
    }

    var raw = (el.textContent || "").trim();
    var parsed = parseCountParts(raw);
    if (!parsed) {
      return;
    }

    var duration = Number(el.dataset.countDuration || "2600");
    var start = performance.now();
    el.dataset.countDone = "1";

    function easeOutQuart(t) {
      return 1 - Math.pow(1 - t, 4);
    }

    function tick(now) {
      var progress = Math.min((now - start) / duration, 1);
      var eased = easeOutQuart(progress);
      var value = parsed.target * eased;
      el.textContent =
        parsed.prefix + formatCount(value, parsed.target) + parsed.suffix;

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent =
          parsed.prefix + formatCount(parsed.target, parsed.target) + parsed.suffix;
      }
    }

    requestAnimationFrame(tick);
  }

  function setRevealTarget(el, variant, duration, delay, count) {
    if (!el || el.dataset.revealReady === "1") {
      return;
    }

    var safeVariant = variant || "up";
    var isMobileMotion = window.matchMedia("(max-width: 760px)").matches;
    var durationScale = isMobileMotion ? 1.58 : 1.18;
    var delayScale = isMobileMotion ? 1.3 : 1.08;
    var finalDuration = Math.round((duration || 1500) * durationScale);
    var finalDelay = Math.round((delay || 0) * delayScale);

    el.classList.add("reveal-target", "reveal-" + safeVariant);
    el.style.setProperty("--reveal-duration", String(finalDuration) + "ms");
    el.style.setProperty("--reveal-delay", String(finalDelay) + "ms");
    el.dataset.revealReady = "1";

    if (count) {
      el.dataset.revealCount = "1";
    }
  }

  function tagRevealTargets() {
    var groups = [
      { selector: ".hero .nav", variants: ["down"], duration: 1620, step: 0 },
      {
        selector: ".hero-content > *",
        variants: ["rise", "drift-right", "tilt-left"],
        duration: 1720,
        step: 250
      },
      { selector: ".page-head > *", variants: ["rise", "drift-right"], duration: 1660, step: 220 },
      {
        selector: ".drive-head-copy > *",
        variants: ["rise", "drift-right", "rise", "tilt-right"],
        duration: 1680,
        step: 190
      },
      { selector: ".drive-head-media", variants: ["tilt-left"], duration: 1900, step: 0 },
      { selector: ".section .center > h2", variants: ["down"], duration: 1520, step: 0 },
      { selector: ".section .center > .lead", variants: ["rise"], duration: 1540, step: 0 },
      {
        selector: ".stats-grid article",
        variants: ["bloom", "rise", "tilt-right", "tilt-left"],
        duration: 1860,
        step: 210,
        count: true
      },
      {
        selector: ".vehicle-grid .vehicle-card",
        variants: ["drift-right", "bloom", "drift-left"],
        duration: 1780,
        step: 180
      },
      { selector: ".how-image", variants: ["tilt-right"], duration: 1820, step: 0 },
      {
        selector: ".how-steps article",
        variants: ["drift-left", "left", "drift-left", "left"],
        duration: 1660,
        step: 145
      },
      { selector: ".how-steps .btn", variants: ["pop"], duration: 1500, step: 0 },
      { selector: ".drive-card .drive-copy", variants: ["drift-right"], duration: 1760, step: 0 },
      { selector: ".drive-card .drive-image", variants: ["tilt-left"], duration: 1880, step: 0 },
      {
        selector: ".testimonials-grid .testimonial",
        variants: ["rise", "bloom", "curtain"],
        duration: 1740,
        step: 155
      },
      { selector: ".cta-copy", variants: ["drift-right"], duration: 1780, step: 0 },
      { selector: ".cta-phone", variants: ["tilt-left"], duration: 1940, step: 180 },
      { selector: ".inner-card", variants: ["rise", "curtain", "bloom"], duration: 1680, step: 145 },
      { selector: ".page-visual", variants: ["tilt-left", "tilt-right"], duration: 1840, step: 170 },
      {
        selector: ".de-how-steps li",
        variants: ["drift-left", "left", "drift-left", "left"],
        duration: 1600,
        step: 130
      },
      { selector: ".de-how-media", variants: ["tilt-right"], duration: 1860, step: 0 },
      {
        selector: ".de-earn-split h3",
        variants: ["bloom", "bloom"],
        duration: 1700,
        step: 200,
        count: true
      },
      { selector: ".de-earn-copy", variants: ["drift-left"], duration: 1700, step: 0 },
      {
        selector: ".de-benefits .inner-card",
        variants: ["rise", "bloom", "curtain", "rise"],
        duration: 1680,
        step: 130
      },
      { selector: ".de-easy-copy", variants: ["drift-right"], duration: 1740, step: 0 },
      { selector: ".de-easy-media", variants: ["tilt-left"], duration: 1860, step: 0 },
      { selector: ".de-final-copy", variants: ["drift-right"], duration: 1760, step: 0 },
      { selector: ".de-final-media", variants: ["tilt-left"], duration: 1980, step: 130 },

      { selector: ".blogx-hero-copy > *", variants: ["rise", "drift-right", "rise", "curtain"], duration: 1760, step: 150 },
      { selector: ".blogx-chipbar a", variants: ["pop", "pop", "pop", "pop"], duration: 1450, step: 80 },
      { selector: ".blogx-featured", variants: ["curtain"], duration: 1880, step: 0 },
      { selector: ".blogx-featured-media", variants: ["tilt-right"], duration: 1900, step: 0 },
      { selector: ".blogx-featured-body > *", variants: ["rise", "drift-left", "rise", "pop"], duration: 1720, step: 120 },
      { selector: ".blogx-section-head > *", variants: ["down", "drift-right"], duration: 1540, step: 120 },
      { selector: ".blogx-discovery > *", variants: ["rise", "curtain", "rise"], duration: 1580, step: 120 },
      { selector: ".blogx-filterbar button", variants: ["pop", "pop", "pop", "pop"], duration: 1320, step: 60 },
      { selector: ".blogx-grid .blogx-card", variants: ["drift-right", "rise", "drift-left", "bloom", "curtain"], duration: 1720, step: 90 },
      { selector: ".blogx-cta-band > *", variants: ["drift-right", "tilt-left"], duration: 1760, step: 160 },

      { selector: ".blogx-article-head > *", variants: ["rise", "drift-right", "rise", "curtain"], duration: 1720, step: 140 },
      { selector: ".blogx-article-head-media", variants: ["tilt-left"], duration: 1900, step: 0 },
      { selector: ".blogx-rail .blogx-rail-card", variants: ["drift-left", "curtain"], duration: 1700, step: 140 },
      { selector: ".blogx-takeaways", variants: ["curtain"], duration: 1660, step: 0 },
      { selector: ".blogx-snapshot", variants: ["bloom"], duration: 1740, step: 0 },
      { selector: ".blogx-prose h2", variants: ["drift-right"], duration: 1580, step: 100 },
      { selector: ".blogx-inline-media", variants: ["tilt-right", "tilt-left"], duration: 1820, step: 120 },
      { selector: ".blogx-prose .blogx-inline-cta", variants: ["pop"], duration: 1580, step: 0 },
      { selector: ".blogx-module", variants: ["rise", "curtain", "rise"], duration: 1660, step: 130 },
      { selector: ".blogx-lead-box", variants: ["bloom"], duration: 1740, step: 0 },
      { selector: ".blogx-author-box", variants: ["rise"], duration: 1660, step: 0 },
      { selector: ".blogx-related-card", variants: ["drift-right", "drift-left", "bloom"], duration: 1700, step: 130 },

      { selector: ".footer-grid > div", variants: ["rise", "rise", "curtain"], duration: 1560, step: 150 },
      { selector: ".footer-bottom", variants: ["rise"], duration: 1500, step: 0 }
    ];

    groups.forEach(function (group) {
      var nodes = Array.from(document.querySelectorAll(group.selector));
      nodes.forEach(function (el, idx) {
        var variants = group.variants || ["up"];
        var variant = variants[idx % variants.length];
        var delay = (group.baseDelay || 0) + idx * (group.step || 0);
        setRevealTarget(el, variant, group.duration, delay, group.count);
      });
    });
  }

  function scheduleCountIfNeeded(el) {
    if (!el || el.dataset.revealCount !== "1") {
      return;
    }

    var delay = Number((el.style.getPropertyValue("--reveal-delay") || "0ms").replace("ms", ""));
    window.setTimeout(function () {
      if (el.tagName === "H3") {
        animateCount(el);
      } else {
        var heading = el.querySelector("h3");
        if (heading) {
          animateCount(heading);
        }
      }
    }, delay + 180);
  }

  function setupParallaxAtmosphere() {
    var finePointer = window.matchMedia("(pointer: fine)").matches;
    if (!finePointer) {
      return;
    }

    var heroes = document.querySelectorAll(".hero, .page-hero");
    heroes.forEach(function (hero) {
      hero.addEventListener("pointermove", function (event) {
        var rect = hero.getBoundingClientRect();
        var x = (event.clientX - rect.left) / rect.width;
        var y = (event.clientY - rect.top) / rect.height;
        var dx = (x - 0.5) * 14;
        var dy = (y - 0.5) * 10;
        hero.style.setProperty("--mx", dx.toFixed(2) + "px");
        hero.style.setProperty("--my", dy.toFixed(2) + "px");
      });

      hero.addEventListener("pointerleave", function () {
        hero.style.setProperty("--mx", "0px");
        hero.style.setProperty("--my", "0px");
      });
    });
  }

  function setupLuxuryMotion() {
    if (window.matchMedia(REDUCE_MOTION_QUERY).matches) {
      return;
    }

    document.documentElement.classList.add("motion-enhanced");
    tagRevealTargets();
    setupParallaxAtmosphere();

    var targets = document.querySelectorAll(".reveal-target");
    if (!targets.length) {
      return;
    }

    var observer = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) {
            return;
          }

          var target = entry.target;
          target.classList.add("is-revealed");
          scheduleCountIfNeeded(target);
          obs.unobserve(target);
        });
      },
      {
        threshold: 0.16,
        rootMargin: "0px 0px -8% 0px"
      }
    );

    targets.forEach(function (el) {
      observer.observe(el);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    setupMobileNav();
    setupLuxuryMotion();
  });
})();
