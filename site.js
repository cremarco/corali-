(() => {
  "use strict";

  /* ---------------------------------------------------------------------------
   * Mobile menu
   * ------------------------------------------------------------------------- */
  const menuToggle = document.querySelector("[data-menu-toggle]");
  const mobileMenu = document.querySelector("[data-mobile-menu]");

  if (menuToggle && mobileMenu) {
    const desktopQuery = window.matchMedia("(min-width: 768px)");

    const isMenuOpen = () => menuToggle.getAttribute("aria-expanded") === "true";

    const setMenu = (open) => {
      menuToggle.setAttribute("aria-expanded", String(open));
      mobileMenu.classList.toggle("hidden", !open);
    };

    menuToggle.addEventListener("click", () => setMenu(!isMenuOpen()));

    mobileMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setMenu(false));
    });

    // Close on Escape and return focus to the toggle.
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && isMenuOpen()) {
        setMenu(false);
        menuToggle.focus();
      }
    });

    // Close when clicking outside the menu or the toggle.
    document.addEventListener("click", (event) => {
      if (!isMenuOpen()) return;
      if (menuToggle.contains(event.target) || mobileMenu.contains(event.target)) return;
      setMenu(false);
    });

    // Reset the menu state when growing to the desktop breakpoint.
    const handleDesktopChange = (event) => {
      if (event.matches) setMenu(false);
    };

    if (typeof desktopQuery.addEventListener === "function") {
      desktopQuery.addEventListener("change", handleDesktopChange);
    } else if (typeof desktopQuery.addListener === "function") {
      desktopQuery.addListener(handleDesktopChange);
    }
  }

  /* ---------------------------------------------------------------------------
   * Scroll reveal
   * ------------------------------------------------------------------------- */
  const revealItems = document.querySelectorAll("[data-reveal]");

  const revealNow = (item) => {
    item.classList.remove("opacity-0", "translate-y-8");
    item.classList.add("opacity-100", "translate-y-0");
  };

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          revealNow(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.14 }
    );

    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach(revealNow);
  }

  /* ---------------------------------------------------------------------------
   * Hero slideshow (homepage only)
   * ------------------------------------------------------------------------- */
  const heroSlides = Array.from(document.querySelectorAll("[data-hero-slide]"));
  const heroMaskSlides = Array.from(document.querySelectorAll("[data-hero-mask-slide]"));

  if (heroSlides.length <= 1) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const now = () => (window.performance ? window.performance.now() : Date.now());

  const heroRoot = heroSlides[0].closest("[data-hero-slideshow]");
  const parsedIntroDelay = Number.parseInt(heroRoot?.dataset.heroIntroDelay || "0", 10);
  const heroIntroDelay = Number.isFinite(parsedIntroDelay) ? parsedIntroDelay : 0;
  const heroIntroStartedAt = now();
  const motions = ["in", "out", "drift"];
  const slideDelay = 6800;
  const exitCleanupDelay = 1900;

  let activeIndex = heroSlides.findIndex((slide) => slide.classList.contains("is-active"));
  let slideTimer;
  let introTimer;
  let initialSlidesReady;

  if (activeIndex < 0) activeIndex = 0;

  const motionFor = (index) => motions[index % motions.length];
  const heroDurationFor = (index) => `${10800 + (index % 4) * 450}ms`;

  heroSlides.forEach((slide, index) => {
    slide.dataset.motion = motionFor(index);
    slide.style.setProperty("--hero-duration", heroDurationFor(index));
    slide.classList.toggle("is-active", index === activeIndex);

    const maskSlide = heroMaskSlides[index];

    if (maskSlide) {
      maskSlide.dataset.motion = motionFor(index);
      maskSlide.style.setProperty("--hero-duration", heroDurationFor(index));
      maskSlide.classList.toggle("is-active", index === activeIndex);
    }
  });

  const decodeSlide = (slide) => {
    if (typeof slide.decode !== "function") return Promise.resolve();

    return slide.decode().catch(() => {});
  };

  const loadSlide = (slide) => {
    if (!slide) return Promise.resolve();

    if (slide.dataset.heroLoaded !== "true") {
      const source = slide.dataset.heroSrc;

      if (source) {
        slide.src = source;
      }

      slide.dataset.heroLoaded = "true";
    }

    if (slide.complete && slide.naturalWidth > 0) {
      return decodeSlide(slide);
    }

    return new Promise((resolve) => {
      slide.addEventListener("load", resolve, { once: true });
      slide.addEventListener("error", resolve, { once: true });
    }).then(() => decodeSlide(slide));
  };

  const preloadSlide = (index) => {
    const run = () => {
      loadSlide(heroSlides[index]);
      loadSlide(heroMaskSlides[index]);
    };

    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(run, { timeout: 1800 });
    } else {
      window.setTimeout(run, 250);
    }
  };

  const markIntroComplete = () => {
    heroRoot?.classList.add("is-hero-intro-complete");
  };

  const prepareInitialSlides = () => {
    if (initialSlidesReady) return initialSlidesReady;

    const nextIndex = (activeIndex + 1) % heroSlides.length;

    initialSlidesReady = Promise.all([
      loadSlide(heroSlides[activeIndex]),
      loadSlide(heroMaskSlides[activeIndex]),
      loadSlide(heroSlides[nextIndex]),
      loadSlide(heroMaskSlides[nextIndex]),
    ]).then(() => {
      preloadSlide((activeIndex + 2) % heroSlides.length);
    });

    return initialSlidesReady;
  };

  const showSlide = (nextIndex) => {
    const currentSlide = heroSlides[activeIndex];
    const nextSlide = heroSlides[nextIndex];
    const currentMaskSlide = heroMaskSlides[activeIndex];
    const nextMaskSlide = heroMaskSlides[nextIndex];

    if (!nextSlide || nextSlide === currentSlide) return;

    [currentSlide, currentMaskSlide].forEach((slide) => {
      if (!slide) return;

      // Freeze the slide at its current animated transform before exiting.
      slide.style.transform = window.getComputedStyle(slide).transform;
      slide.style.animation = "none";
      slide.classList.remove("is-active");
      slide.classList.add("is-exiting");
    });

    [nextSlide, nextMaskSlide].forEach((slide) => {
      if (!slide) return;

      slide.classList.remove("is-exiting");
      slide.dataset.motion = motionFor(nextIndex);

      void slide.offsetWidth; // Force reflow so the animation restarts.
      slide.classList.add("is-active");
    });

    window.setTimeout(() => {
      [currentSlide, currentMaskSlide].forEach((slide) => {
        if (!slide) return;

        slide.classList.remove("is-exiting");
        slide.style.removeProperty("transform");
        slide.style.removeProperty("animation");
      });
    }, exitCleanupDelay);

    activeIndex = nextIndex;
  };

  const isPaused = () => reduceMotion.matches || document.hidden;

  const scheduleNextSlide = () => {
    window.clearTimeout(slideTimer);

    if (isPaused()) {
      slideTimer = undefined;
      return;
    }

    slideTimer = window.setTimeout(async () => {
      const nextIndex = (activeIndex + 1) % heroSlides.length;

      await Promise.all([
        loadSlide(heroSlides[nextIndex]),
        loadSlide(heroMaskSlides[nextIndex]),
      ]);

      if (!isPaused()) {
        showSlide(nextIndex);
        preloadSlide((activeIndex + 1) % heroSlides.length);
      }

      scheduleNextSlide();
    }, slideDelay);
  };

  const startHeroSlideshow = () => {
    if (isPaused() || slideTimer) return;

    prepareInitialSlides().then(() => {
      if (!isPaused() && !slideTimer) {
        scheduleNextSlide();
      }
    });
  };

  const queueHeroSlideshowStart = () => {
    window.clearTimeout(introTimer);

    if (isPaused()) {
      introTimer = undefined;
      return;
    }

    const remainingIntroDelay = Math.max(0, heroIntroDelay - (now() - heroIntroStartedAt));

    introTimer = window.setTimeout(() => {
      introTimer = undefined;
      markIntroComplete();
      startHeroSlideshow();
    }, remainingIntroDelay);
  };

  const stopHeroSlideshow = () => {
    window.clearTimeout(slideTimer);
    window.clearTimeout(introTimer);
    slideTimer = undefined;
    introTimer = undefined;
  };

  prepareInitialSlides();
  queueHeroSlideshowStart();

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopHeroSlideshow();
    } else {
      queueHeroSlideshowStart();
    }
  });

  const handleMotionPreferenceChange = () => {
    if (reduceMotion.matches) {
      stopHeroSlideshow();
    } else {
      prepareInitialSlides();
      queueHeroSlideshowStart();
    }
  };

  if (typeof reduceMotion.addEventListener === "function") {
    reduceMotion.addEventListener("change", handleMotionPreferenceChange);
  } else if (typeof reduceMotion.addListener === "function") {
    reduceMotion.addListener(handleMotionPreferenceChange);
  }
})();
