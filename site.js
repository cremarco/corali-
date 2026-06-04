const menuToggle = document.querySelector("[data-menu-toggle]");
const mobileMenu = document.querySelector("[data-mobile-menu]");

if (menuToggle && mobileMenu) {
  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    mobileMenu.classList.toggle("hidden", isOpen);
  });

  mobileMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      menuToggle.setAttribute("aria-expanded", "false");
      mobileMenu.classList.add("hidden");
    });
  });
}

const revealItems = document.querySelectorAll("[data-reveal]");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.remove("opacity-0", "translate-y-8");
        entry.target.classList.add("opacity-100", "translate-y-0");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.14 }
  );

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => {
    item.classList.remove("opacity-0", "translate-y-8");
    item.classList.add("opacity-100", "translate-y-0");
  });
}

const heroSlides = Array.from(document.querySelectorAll("[data-hero-slide]"));
const heroMaskSlides = Array.from(document.querySelectorAll("[data-hero-mask-slide]"));
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

if (heroSlides.length > 1) {
  const heroRoot = heroSlides[0].closest("[data-hero-slideshow]");
  const parsedIntroDelay = Number.parseInt(heroRoot?.dataset.heroIntroDelay || "0", 10);
  const heroIntroDelay = Number.isFinite(parsedIntroDelay) ? parsedIntroDelay : 0;
  const heroIntroStartedAt = window.performance ? window.performance.now() : Date.now();
  const motions = ["in", "out", "drift"];
  const slideDelay = 6800;
  const exitCleanupDelay = 1900;
  let activeIndex = heroSlides.findIndex((slide) => slide.classList.contains("is-active"));
  let slideTimer;
  let introTimer;
  let isPreparingSlide = false;
  let initialSlidesReady;

  if (activeIndex < 0) activeIndex = 0;

  heroSlides.forEach((slide, index) => {
    slide.dataset.motion = motions[index % motions.length];
    slide.style.setProperty("--hero-duration", `${10800 + (index % 4) * 450}ms`);
    slide.classList.toggle("is-active", index === activeIndex);

    const maskSlide = heroMaskSlides[index];

    if (maskSlide) {
      maskSlide.dataset.motion = motions[index % motions.length];
      maskSlide.style.setProperty("--hero-duration", `${10800 + (index % 4) * 450}ms`);
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
      const finish = () => resolve();

      slide.addEventListener("load", finish, { once: true });
      slide.addEventListener("error", finish, { once: true });
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

    isPreparingSlide = true;
    initialSlidesReady = Promise.all([
      loadSlide(heroSlides[activeIndex]),
      loadSlide(heroMaskSlides[activeIndex]),
      loadSlide(heroSlides[(activeIndex + 1) % heroSlides.length]),
      loadSlide(heroMaskSlides[(activeIndex + 1) % heroMaskSlides.length]),
    ])
      .then(() => {
        preloadSlide((activeIndex + 2) % heroSlides.length);
      })
      .finally(() => {
        isPreparingSlide = false;
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

      const currentStyle = window.getComputedStyle(slide);
      slide.style.transform = currentStyle.transform;
      slide.style.animation = "none";
      slide.classList.remove("is-active");
      slide.classList.add("is-exiting");
    });

    [nextSlide, nextMaskSlide].forEach((slide) => {
      if (!slide) return;

      slide.classList.remove("is-exiting");
      slide.dataset.motion = motions[nextIndex % motions.length];

      void slide.offsetWidth;
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

  const scheduleNextSlide = () => {
    window.clearTimeout(slideTimer);

    if (reduceMotion.matches || document.hidden) {
      slideTimer = undefined;
      return;
    }

    slideTimer = window.setTimeout(async () => {
      const nextIndex = (activeIndex + 1) % heroSlides.length;

      await Promise.all([
        loadSlide(heroSlides[nextIndex]),
        loadSlide(heroMaskSlides[nextIndex]),
      ]);

      if (!reduceMotion.matches && !document.hidden) {
        showSlide(nextIndex);
        preloadSlide((activeIndex + 1) % heroSlides.length);
      }

      scheduleNextSlide();
    }, slideDelay);
  };

  const startHeroSlideshow = () => {
    if (reduceMotion.matches || document.hidden || slideTimer) return;

    prepareInitialSlides().then(() => {
      if (!reduceMotion.matches && !document.hidden && !slideTimer) {
        scheduleNextSlide();
      }
    });
  };

  const queueHeroSlideshowStart = () => {
    window.clearTimeout(introTimer);

    if (reduceMotion.matches || document.hidden) {
      introTimer = undefined;
      return;
    }

    const now = window.performance ? window.performance.now() : Date.now();
    const remainingIntroDelay = Math.max(0, heroIntroDelay - (now - heroIntroStartedAt));

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
    isPreparingSlide = false;
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
}
