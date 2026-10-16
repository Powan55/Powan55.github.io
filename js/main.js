/* =========================================================
   Laxmi Poudel portfolio interactions (vanilla JS, no deps)
   ========================================================= */
(function () {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(hover: none)").matches;

  /* ---------- Footer year ---------- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Sticky header shadow ---------- */
  const header = document.getElementById("site-header");
  const onScrollHeader = () => header.classList.toggle("scrolled", window.scrollY > 40);
  onScrollHeader();
  window.addEventListener("scroll", onScrollHeader, { passive: true });

  /* ---------- Mobile nav ---------- */
  const navToggle = document.getElementById("nav-toggle");
  const nav = document.getElementById("primary-nav");
  const burgerIcon = navToggle ? navToggle.querySelector("i") : null;

  function setNav(open) {
    document.body.classList.toggle("nav-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    if (burgerIcon) burgerIcon.className = open ? "fa-solid fa-xmark" : "fa-solid fa-bars";
  }
  if (navToggle && nav) {
    navToggle.addEventListener("click", () =>
      setNav(!document.body.classList.contains("nav-open"))
    );
    nav.addEventListener("click", (e) => {
      if (e.target.closest("a")) setNav(false);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && document.body.classList.contains("nav-open")) {
        setNav(false);
        navToggle.focus();
      }
    });
    document.addEventListener("click", (e) => {
      if (
        document.body.classList.contains("nav-open") &&
        !nav.contains(e.target) &&
        !navToggle.contains(e.target)
      ) {
        setNav(false);
      }
    });
  }

  /* ---------- Theme toggle ---------- */
  const themeToggle = document.getElementById("theme-toggle");
  const root = document.documentElement;
  const stored = localStorage.getItem("theme");
  const initial =
    stored ||
    (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
  applyTheme(initial);

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    if (themeToggle) {
      const icon = themeToggle.querySelector("i");
      const dark = theme === "dark";
      if (icon) icon.className = dark ? "fa-solid fa-moon" : "fa-solid fa-sun";
      themeToggle.setAttribute(
        "aria-label",
        dark ? "Switch to light theme" : "Switch to dark theme"
      );
    }
  }
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next);
      localStorage.setItem("theme", next);
    });
  }

  /* ---------- Scroll reveal ---------- */
  const revealEls = document.querySelectorAll("[data-reveal]");
  if (prefersReduced || !("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("in-view"));
  } else {
    const revObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.transitionDelay = "";
            entry.target.classList.add("in-view");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    // Stagger siblings sharing a parent for a nicer cascade
    revealEls.forEach((el) => {
      const sibs = Array.from(el.parentElement.querySelectorAll(":scope > [data-reveal]"));
      const i = sibs.indexOf(el);
      if (i > 0) el.style.transitionDelay = Math.min(i * 70, 350) + "ms";
      revObserver.observe(el);
    });
  }

  /* ---------- Scroll spy ---------- */
  const sections = document.querySelectorAll("main section[id]");
  const navLinks = Array.from(document.querySelectorAll(".nav-list a"));
  if ("IntersectionObserver" in window && sections.length) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute("id");
            navLinks.forEach((a) => a.removeAttribute("aria-current"));
            const current = navLinks.find((a) => a.getAttribute("href") === "#" + id);
            if (current) current.setAttribute("aria-current", "page");
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach((s) => spy.observe(s));
  }

  /* ---------- Cursor-tracked card glow ---------- */
  if (!isTouch && !prefersReduced) {
    document.querySelectorAll(".glow-card").forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--mx", e.clientX - rect.left + "px");
        card.style.setProperty("--my", e.clientY - rect.top + "px");
      });
    });
  }

  /* ---------- Back to top ---------- */
  const toTop = document.getElementById("to-top");
  if (toTop) {
    const onScrollTop = () => toTop.classList.toggle("show", window.scrollY > 600);
    onScrollTop();
    window.addEventListener("scroll", onScrollTop, { passive: true });
    toTop.addEventListener("click", () =>
      window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" })
    );
  }

  /* ---------- Contact form → Google Apps Script (preserved endpoint) ---------- */
  const scriptURL =
    "https://script.google.com/macros/s/AKfycbzjlwJ2xRaJ1GmnVu3ViGAOoypEwBl6CH7ifqh6d-ootjngSyWye5yEQWSnf1L-CxP2Lg/exec";
  const form = document.forms["submit-to-google-sheet"];
  const msg = document.getElementById("msg");
  if (form) {
    const submitBtn = form.querySelector('button[type="submit"]');
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const honeypot = form.elements["_hp"];
      if (honeypot && honeypot.value) { form.reset(); return; }
      if (!form.checkValidity()) { form.reportValidity(); return; }
      const original = submitBtn ? submitBtn.textContent : "";
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Sending…"; }
      if (msg) { msg.className = ""; msg.textContent = ""; }

      // Apps Script replies with a cross-origin redirect the page can't read, so a
      // resolved promise is not proof of delivery. Send it opaque and say only what we know.
      fetch(scriptURL, { method: "POST", mode: "no-cors", body: new FormData(form) })
        .then(() => {
          if (msg) { msg.className = ""; msg.textContent = "Sent. If you don't hear back within a day, email me at laxmipoudel311@gmail.com."; }
          form.reset();
          setTimeout(() => { if (msg) msg.textContent = ""; }, 12000);
        })
        .catch(() => {
          if (msg) { msg.className = "error"; msg.textContent = "That didn't go through. Email me at laxmipoudel311@gmail.com."; }
        })
        .finally(() => {
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = original; }
        });
    });
  }
})();
