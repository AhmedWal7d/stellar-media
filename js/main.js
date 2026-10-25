/* Responsive interactions built with vanilla JavaScript; Bootstrap handles the mobile navigation. */
(() => {
  "use strict";

  const nav = document.querySelector(".site-nav");
  const navCollapse = document.getElementById("mainNav");
  const year = document.getElementById("currentYear");
  const form = document.getElementById("contactForm");
  const status = document.getElementById("formStatus");
  const loader = document.getElementById("pageLoader");
  const backToTop = document.getElementById("backToTop");

  if (year) year.textContent = new Date().getFullYear();

  // Brief intro loader. It also exits safely if the page load event already fired.
  const hideLoader = () => {
    if (!loader) return;
    window.setTimeout(() => loader.classList.add("is-hidden"), 450);
  };
  if (document.readyState === "complete") hideLoader();
  else window.addEventListener("load", hideLoader, { once: true });
  window.setTimeout(hideLoader, 1800);

  const updateScrollUI = () => {
    if (nav) nav.classList.toggle("scrolled", window.scrollY > 12);
    if (backToTop) backToTop.classList.toggle("is-visible", window.scrollY > 150);
  };
  updateScrollUI();
  window.addEventListener("scroll", updateScrollUI, { passive: true });

  if (backToTop) {
    backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  // Close the mobile navigation after selecting a section.
  if (navCollapse) {
    navCollapse.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", () => {
        const toggler = document.querySelector(".navbar-toggler");
        if (toggler && window.getComputedStyle(toggler).display !== "none" && window.bootstrap) {
          const collapse = window.bootstrap.Collapse.getInstance(navCollapse);
          if (collapse) collapse.hide();
        }
      });
    });
  }

  // Highlight the current section in the navigation while scrolling.
  const sections = document.querySelectorAll("main section[id]");
  const navLinks = document.querySelectorAll('.navbar-nav .nav-link[href^="#"]');
  if ("IntersectionObserver" in window && sections.length && navLinks.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => {
          const active = link.getAttribute("href") === `#${entry.target.id}`;
          link.classList.toggle("active", active);
          if (active) link.setAttribute("aria-current", "page");
          else link.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-35% 0px -55% 0px" });
    sections.forEach((section) => observer.observe(section));
  }

  // Reveal sections and cards as they enter the viewport.
  const motionTargets = document.querySelectorAll(
    ".section-label, .about-main, .about-principle, .services-heading, .service-row, .testimonials-heading, .testimonial-slider, .contact-panel, .footer-cta, .footer-main"
  );
  if (motionTargets.length && "IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.documentElement.classList.add("js-motion");
    motionTargets.forEach((target) => target.classList.add("reveal-on-scroll"));
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -35px 0px" });
    motionTargets.forEach((target) => revealObserver.observe(target));
  }

  // Accessible testimonial slider: 3 cards on desktop, 2 on tablet, 1 on mobile.
  const track = document.getElementById("testimonialTrack");
  const viewport = document.querySelector(".testimonial-viewport");
  const dotsContainer = document.getElementById("testimonialDots");
  const prevButton = document.getElementById("testimonialPrev");
  const nextButton = document.getElementById("testimonialNext");
  if (track && viewport && dotsContainer && prevButton && nextButton) {
    const slides = Array.from(track.querySelectorAll(".testimonial-slide"));
    let currentIndex = 0;
    let maxIndex = 0;
    let resizeTimer;

    const visibleCount = () => {
      if (!slides.length) return 1;
      const slideWidth = slides[0].getBoundingClientRect().width;
      const gap = parseFloat(window.getComputedStyle(track).gap) || 0;
      return Math.max(1, Math.round((viewport.clientWidth + gap) / (slideWidth + gap)));
    };

    const drawDots = () => {
      dotsContainer.innerHTML = "";
      for (let i = 0; i <= maxIndex; i += 1) {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "testimonial-dot";
        dot.setAttribute("aria-label", `Show testimonial group ${i + 1}`);
        dot.addEventListener("click", () => { currentIndex = i; updateSlider(); });
        dotsContainer.appendChild(dot);
      }
    };

    const updateSlider = () => {
      const gap = parseFloat(window.getComputedStyle(track).gap) || 0;
      const slideWidth = slides[0] ? slides[0].getBoundingClientRect().width : 0;
      currentIndex = Math.max(0, Math.min(currentIndex, maxIndex));
      track.style.transform = `translateX(-${currentIndex * (slideWidth + gap)}px)`;
      Array.from(dotsContainer.children).forEach((dot, index) => {
        dot.classList.toggle("is-active", index === currentIndex);
        if (index === currentIndex) dot.setAttribute("aria-current", "true");
        else dot.removeAttribute("aria-current");
      });
      prevButton.disabled = currentIndex === 0;
      nextButton.disabled = currentIndex === maxIndex;
    };

    const measureSlider = () => {
      maxIndex = Math.max(0, slides.length - visibleCount());
      currentIndex = Math.min(currentIndex, maxIndex);
      drawDots();
      updateSlider();
    };
    prevButton.addEventListener("click", () => { currentIndex -= 1; updateSlider(); });
    nextButton.addEventListener("click", () => { currentIndex += 1; updateSlider(); });
    window.addEventListener("resize", () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(measureSlider, 120);
    }, { passive: true });
    measureSlider();
  }

  // Static-host contact form: validate fields and prepare an email message.
  // Confirm this address with the agency before publishing.
  const CONTACT_EMAIL = "hello@stellarmedia.ae";
  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const data = new FormData(form);
      const subject = `Website enquiry${data.get("company") ? ` — ${data.get("company")}` : ""}`;
      const body = [
        `Name: ${data.get("name")}`,
        `Email: ${data.get("email")}`,
        `Company: ${data.get("company") || "Not provided"}`,
        `Interested in: ${data.get("service") || "Not specified"}`,
        "",
        "Project details:",
        data.get("message")
      ].join("\n");

      if (status) status.textContent = "Your email app should open with the enquiry details. Review and send the message there.";
      window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
  }
})();
