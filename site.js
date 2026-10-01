(() => {
  "use strict";

  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const header = document.querySelector("header");
  if (header && "ResizeObserver" in window) {
    new ResizeObserver(() => {
      document.documentElement.style.setProperty("--site-header-offset", `${header.getBoundingClientRect().height + 24}px`);
    }).observe(header);
  }

  /* ---------------------------------------------------------------------------
   * Mobile menu
   * ------------------------------------------------------------------------- */
  const mobileNavigation = document.querySelector("[data-mobile-navigation]");
  const sectionNavigation = document.querySelector("[data-section-navigation]");
  const disclosures = [mobileNavigation, sectionNavigation].filter(Boolean);

  disclosures.forEach((details) => {
    details.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", (event) => {
        details.open = false;
      });
    });
    details.addEventListener("toggle", () => {
      if (details.open) disclosures.filter((other) => other !== details).forEach((other) => { other.open = false; });
    });
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    disclosures.forEach((details) => {
      if (!details.open) return;
      details.open = false;
      details.querySelector("summary").focus();
    });
  });
  document.addEventListener("click", (event) => {
    disclosures.forEach((details) => {
      if (details.contains(event.target) || !details.open) return;
      if (details.contains(document.activeElement)) details.querySelector("summary").focus();
      details.open = false;
    });
    const link = event.target.closest("a[href]");
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target || link.hasAttribute("download")) return;
    const destination = new URL(link.href, location.href);
    if (destination.origin !== location.origin || destination.pathname !== location.pathname || destination.search !== location.search || !destination.hash) return;
    const target = document.getElementById(decodeURIComponent(destination.hash.slice(1)));
    if (!target) return;
    event.preventDefault();
    history.pushState(null, "", destination.hash);
    target.scrollIntoView({ behavior: "instant", block: "start" });
    const readingTarget = target.matches("main, h1, h2, h3") ? target : target.querySelector("h1, h2, h3") || target;
    const originalTabindex = readingTarget.getAttribute("tabindex");
    readingTarget.setAttribute("tabindex", "-1");
    readingTarget.focus({ preventScroll: true });
    if (originalTabindex === null) readingTarget.addEventListener("blur", () => readingTarget.removeAttribute("tabindex"), { once: true });
  });
  document.addEventListener("focusin", (event) => {
    disclosures.forEach((details) => {
      if (!details.contains(event.target)) details.open = false;
    });
    // Keyboard focus must never land inside a still-hidden scroll reveal.
    const reveal = event.target.closest("[data-reveal]");
    if (reveal) revealNow(reveal);
  });
  const desktopQuery = window.matchMedia("(min-width: 1024px)");
  const closeDisclosuresOnDesktop = (event) => {
    if (event.matches) disclosures.forEach((details) => {
      if (details.contains(document.activeElement)) {
        const href = document.activeElement.getAttribute("href");
        const equivalent = [...header.querySelectorAll("nav:not([data-mobile-menu]) a")].find((link) => href && link.getAttribute("href") === href);
        (equivalent || header.querySelector("a")).focus();
      }
      details.open = false;
    });
  };
  desktopQuery.addEventListener("change", closeDisclosuresOnDesktop);

  if (sectionNavigation) {
    const sectionLinks = [...sectionNavigation.querySelectorAll("a")];
    const sectionTargets = sectionLinks.map((link) => document.getElementById(link.hash.slice(1))).filter(Boolean)
      .sort((a, b) => a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
    const currentLabel = sectionNavigation.querySelector("[data-current-section]");
    const updateCurrentSection = () => {
      const target = sectionTargets.filter((section) => section.getBoundingClientRect().top < window.innerHeight * 0.45).at(-1);
      if (!target) return;
      sectionLinks.forEach((link) => {
        if (link.hash === "#" + target.id) {
          link.setAttribute("aria-current", "location");
          currentLabel.textContent = link.textContent;
        } else link.removeAttribute("aria-current");
      });
    };
    let sectionFrame;
    window.addEventListener("scroll", () => {
      if (sectionFrame) return;
      sectionFrame = requestAnimationFrame(() => {
        sectionFrame = undefined;
        updateCurrentSection();
      });
    }, { passive: true });
    window.addEventListener("hashchange", updateCurrentSection);
    updateCurrentSection();
  }

  /* ---------------------------------------------------------------------------
   * Scroll reveal
   * ------------------------------------------------------------------------- */
  const revealItems = document.querySelectorAll("[data-reveal]");

  const revealNow = (item) => {
    item.classList.remove("opacity-0", "translate-y-8");
    item.classList.add("opacity-100", "translate-y-0");
  };

  let revealObserver;
  if ("IntersectionObserver" in window && !motionPreference.matches) {
    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          revealNow(entry.target);
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.14 }
    );

    revealItems.forEach((item) => {
      // Keep the HTML readable before JavaScript runs; animate only content below the viewport.
      if (item.getBoundingClientRect().top >= window.innerHeight) {
        item.classList.add("opacity-0", "translate-y-8");
        revealObserver.observe(item);
      } else {
        revealNow(item);
      }
    });
  } else {
    revealItems.forEach(revealNow);
  }
  motionPreference.addEventListener("change", (event) => {
    if (!event.matches) return;
    revealObserver?.disconnect();
    revealItems.forEach(revealNow);
  });

  /* The room slideshow has its own keyboard-accessible pause control. */
  const roomRoot = document.querySelector("[data-room-slideshow]");
  if (roomRoot) {
    const toggle = roomRoot.querySelector("[data-room-motion-toggle]");
    const pausedRoomAnimations = new Set();
    let roomUserPaused = false;
    const bounds = roomRoot.getBoundingClientRect();
    let roomInView = bounds.bottom > 0 && bounds.top < window.innerHeight;
    const syncRoom = () => {
      const paused = roomUserPaused || motionPreference.matches || document.hidden || !roomInView;
      roomRoot.classList.toggle("is-room-paused", paused);
      if (paused) {
        roomRoot.getAnimations({ subtree: true }).filter((animation) => animation.animationName?.startsWith("room-")).forEach((animation) => {
          const position = animation.currentTime;
          pausedRoomAnimations.add(animation);
          animation.pause();
          if (position !== null) animation.currentTime = position;
        });
      } else {
        pausedRoomAnimations.forEach((animation) => {
          if (animation.playState === "paused") animation.play();
        });
        pausedRoomAnimations.clear();
      }
      toggle.hidden = motionPreference.matches;
      toggle.setAttribute("aria-label", roomUserPaused ? "Riprendi le foto della sala" : "Pausa foto della sala");
      toggle.querySelector("span").textContent = roomUserPaused ? "Riprendi" : "Pausa";
      toggle.querySelector("path").setAttribute("d", roomUserPaused ? "m9 5 10 7-10 7Z" : "M9 5v14M15 5v14");
    };
    toggle.addEventListener("click", () => { roomUserPaused = !roomUserPaused; syncRoom(); });
    document.addEventListener("visibilitychange", syncRoom);
    motionPreference.addEventListener("change", syncRoom);
    if ("IntersectionObserver" in window) new IntersectionObserver(([entry]) => {
      roomInView = entry.isIntersecting && entry.intersectionRatio >= 0.05;
      syncRoom();
    }, { threshold: [0, 0.05] }).observe(roomRoot);
    syncRoom();
  }

  /* ---------------------------------------------------------------------------
   * Hero motion: one logo sequence, then synchronized photo and wordmark layers.
   * ------------------------------------------------------------------------- */
  const heroSlides = [...document.querySelectorAll("[data-hero-slide]")];
  const heroMaskSlides = [...document.querySelectorAll("[data-hero-mask-slide]")];
  const heroRoot = document.querySelector("[data-hero-slideshow]");

  if (!heroRoot || heroSlides.length <= 1) return;

  const reduceMotion = motionPreference;
  const now = () => performance.now();
  const slideDelay = 6800;
  const motions = ["in", "out", "drift"];
  const motionToggle = heroRoot.querySelector("[data-hero-motion-toggle]");
  const motionLabel = heroRoot.querySelector("[data-hero-motion-label]");
  const motionIcon = heroRoot.querySelector("[data-hero-motion-icon]");
  const pausedAnimations = new Set();
  const imageLoads = new WeakMap();

  let activeIndex = Math.max(0, heroSlides.findIndex((slide) => slide.classList.contains("is-active")));
  let nextIndex = (activeIndex + 1) % heroSlides.length;
  let userPaused = false;
  let introComplete = false;
  let waitingForSlide = false;
  let slideTimer;
  let slideDueAt;
  let remainingDelay = slideDelay;
  const bounds = heroRoot.getBoundingClientRect();
  let heroInView = bounds.bottom > 0 && bounds.top < window.innerHeight;

  const isPaused = () => userPaused || reduceMotion.matches || document.hidden || !heroInView;

  heroSlides.forEach((slide, index) => {
    [slide, heroMaskSlides[index]].filter(Boolean).forEach((layer) => {
      layer.dataset.motion = motions[index % motions.length];
      layer.style.setProperty("--hero-duration", `${index === activeIndex ? 18000 : 10800 + (index % 4) * 450}ms`);
      layer.classList.toggle("is-active", index === activeIndex);
    });
  });

  const loadSlide = (slide) => {
    if (!slide) return Promise.resolve(false);
    if (imageLoads.has(slide)) return imageLoads.get(slide);

    const loaded = new Promise((resolve) => {
      const finish = () => {
        slide.removeEventListener("load", finish);
        slide.removeEventListener("error", finish);
        resolve(slide.naturalWidth > 0);
      };
      slide.addEventListener("load", finish, { once: true });
      slide.addEventListener("error", finish, { once: true });
      if (slide.dataset.heroLoaded !== "true" && slide.dataset.heroSrc) {
        if (slide.dataset.heroSrcset) {
          slide.sizes = slide.dataset.heroSizes || "100vw";
          slide.srcset = slide.dataset.heroSrcset;
        }
        slide.src = slide.dataset.heroSrc;
        slide.dataset.heroLoaded = "true";
      }
      if (slide.complete) finish();
    }).then(async (ready) => {
      if (ready && typeof slide.decode === "function") await slide.decode().catch(() => {});
      return ready;
    });
    imageLoads.set(slide, loaded);
    return loaded;
  };

  const preloadNext = () => {
    if (isPaused()) return;
    const preload = () => {
      if (isPaused()) return;
      loadSlide(heroSlides[nextIndex]);
      loadSlide(heroMaskSlides[nextIndex]);
    };
    if ("requestIdleCallback" in window) requestIdleCallback(preload, { timeout: 1800 });
    else window.setTimeout(preload, 250);
  };

  const showSlide = (index) => {
    const departing = [heroSlides[activeIndex], heroMaskSlides[activeIndex]].filter(Boolean);
    const arriving = [heroSlides[index], heroMaskSlides[index]].filter(Boolean);
    // Keep the outgoing pan running underneath the incoming photo's fade.
    departing.forEach((layer) => {
      layer.classList.replace("is-active", "is-exiting");
    });
    arriving.forEach((layer) => {
      layer.classList.remove("is-exiting");
      layer.classList.add("is-active");
    });
    activeIndex = index;
    // Completion follows the actual fade, including a pause halfway through it.
    const fades = arriving.flatMap((layer) => layer.getAnimations())
      .filter((animation) => animation.transitionProperty === "opacity");
    Promise.allSettled(fades.map((animation) => animation.finished)).then(() => {
      departing.forEach((layer) => {
        layer.classList.remove("is-exiting");
      });
    });
  };

  const scheduleNext = () => {
    if (!introComplete || isPaused() || slideTimer || waitingForSlide) return;
    slideDueAt = now() + remainingDelay;
    slideTimer = window.setTimeout(async () => {
      slideTimer = undefined;
      remainingDelay = 0;
      waitingForSlide = true;
      const candidate = nextIndex;
      const ready = await Promise.all([loadSlide(heroSlides[candidate]), loadSlide(heroMaskSlides[candidate])]);
      waitingForSlide = false;
      if (isPaused()) return;
      // A failed photo never replaces the visible frame; try the following one.
      if (ready.every(Boolean)) showSlide(candidate);
      nextIndex = (candidate + 1) % heroSlides.length;
      remainingDelay = slideDelay;
      preloadNext();
      scheduleNext();
    }, remainingDelay);
  };

  const syncPlayback = () => {
    const paused = isPaused();
    if (paused) {
      if (slideTimer) {
        remainingDelay = Math.max(0, slideDueAt - now());
        window.clearTimeout(slideTimer);
        slideTimer = undefined;
      }
      heroRoot.getAnimations({ subtree: true }).forEach((animation) => {
        if (animation.playState === "finished" || animation.playState === "idle") return;
        if (animation.effect?.target?.closest(".hero-motion-toggle")) return;
        const position = animation.currentTime;
        pausedAnimations.add(animation);
        animation.pause();
        // Hold this frame immediately, rather than awaiting the next paint.
        if (position !== null) animation.currentTime = position;
      });
    }
    heroRoot.classList.toggle("is-hero-paused", paused);
    if (!paused) {
      pausedAnimations.forEach((animation) => {
        if (animation.playState === "paused") animation.play();
      });
      pausedAnimations.clear();
      preloadNext();
      scheduleNext();
    }
    if (motionToggle) {
      motionToggle.hidden = reduceMotion.matches;
      motionToggle.setAttribute("aria-label", userPaused ? "Riprendi l’animazione di apertura" : "Pausa animazione di apertura");
      motionLabel.textContent = userPaused ? "Riprendi" : "Pausa";
      motionIcon.setAttribute("d", userPaused ? "m9 5 10 7-10 7Z" : "M9 5v14M15 5v14");
    }
  };

  const completeIntro = (staticIntro = false) => {
    // Static completion is reserved for reduced motion, never normal playback.
    if (staticIntro) heroRoot.classList.add("is-hero-static-intro");
    if (introComplete) return;
    introComplete = true;
    heroRoot.classList.add("is-hero-intro-complete");
    syncPlayback();
  };
  const wordmark = heroRoot.querySelector(".hero-wordmark-contrast");
  const introAnimation = wordmark?.getAnimations().find((animation) => animation.animationName === "hero-final-mask");
  if (reduceMotion.matches || !introAnimation) completeIntro(true);
  else introAnimation.finished.then(() => completeIntro()).catch(() => {
    if (reduceMotion.matches) completeIntro(true);
  });

  motionToggle?.addEventListener("click", () => {
    userPaused = !userPaused;
    syncPlayback();
  });
  document.addEventListener("visibilitychange", syncPlayback);
  if ("IntersectionObserver" in window) {
    const heroObserver = new IntersectionObserver(([entry]) => {
      heroInView = entry.isIntersecting && entry.intersectionRatio >= 0.05;
      syncPlayback();
    }, { threshold: [0, 0.05] });
    heroObserver.observe(heroRoot);
  }
  reduceMotion.addEventListener("change", () => {
    if (reduceMotion.matches) completeIntro(true);
    syncPlayback();
  });
  syncPlayback();
})();
