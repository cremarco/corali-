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
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

if (heroSlides.length > 1) {
  const motions = ["in", "out", "drift"];
  let activeIndex = heroSlides.findIndex((slide) => slide.classList.contains("is-active"));
  let slideTimer;

  if (activeIndex < 0) activeIndex = 0;

  heroSlides.forEach((slide, index) => {
    slide.dataset.motion = motions[index % motions.length];
    slide.style.setProperty("--hero-duration", `${8800 + (index % 4) * 450}ms`);
    slide.classList.toggle("is-active", index === activeIndex);
  });

  const showSlide = (nextIndex) => {
    const currentSlide = heroSlides[activeIndex];
    const nextSlide = heroSlides[nextIndex];

    if (!nextSlide || nextSlide === currentSlide) return;

    currentSlide.classList.remove("is-active");
    currentSlide.classList.add("is-exiting");
    nextSlide.classList.remove("is-exiting");
    nextSlide.dataset.motion = motions[nextIndex % motions.length];

    void nextSlide.offsetWidth;
    nextSlide.classList.add("is-active");

    window.setTimeout(() => {
      currentSlide.classList.remove("is-exiting");
    }, 2600);

    activeIndex = nextIndex;
  };

  const startHeroSlideshow = () => {
    if (reduceMotion.matches || slideTimer) return;

    slideTimer = window.setInterval(() => {
      showSlide((activeIndex + 1) % heroSlides.length);
    }, 5600);
  };

  const stopHeroSlideshow = () => {
    window.clearInterval(slideTimer);
    slideTimer = undefined;
  };

  startHeroSlideshow();

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopHeroSlideshow();
    } else {
      startHeroSlideshow();
    }
  });

  const handleMotionPreferenceChange = () => {
    if (reduceMotion.matches) {
      stopHeroSlideshow();
    } else {
      startHeroSlideshow();
    }
  };

  if (typeof reduceMotion.addEventListener === "function") {
    reduceMotion.addEventListener("change", handleMotionPreferenceChange);
  } else if (typeof reduceMotion.addListener === "function") {
    reduceMotion.addListener(handleMotionPreferenceChange);
  }
}
