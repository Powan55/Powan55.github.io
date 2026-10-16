(function () {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const onMedia = (mq, fn) => (mq.addEventListener ? mq.addEventListener("change", fn) : mq.addListener(fn));

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  };

  // Reveal runs first so a failure further down can never leave content hidden.
  const revealEls = document.querySelectorAll("[data-reveal]");
  if (prefersReduced || !("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("in-view"));
  } else {
    const revObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach((el) => {
      const sibs = Array.from(el.parentElement.querySelectorAll(":scope > [data-reveal]"));
      const i = sibs.indexOf(el);
      if (i > 0) el.style.setProperty("--d", Math.min(i * 70, 350) + "ms");
      revObserver.observe(el);
    });
  }

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const header = document.getElementById("site-header");
  if (header) {
    const onScrollHeader = () => header.classList.toggle("scrolled", window.scrollY > 40);
    onScrollHeader();
    window.addEventListener("scroll", onScrollHeader, { passive: true });
  }

  const navToggle = document.getElementById("nav-toggle");
  const nav = document.getElementById("primary-nav");
  const themeToggle = document.getElementById("theme-toggle");
  const burgerIcon = navToggle ? navToggle.querySelector("use") : null;
  const behind = Array.from(document.querySelectorAll("main, footer, #to-top"));

  function setNav(open, focusTarget) {
    document.body.classList.toggle("nav-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    if (burgerIcon) burgerIcon.setAttribute("href", open ? "#i-x" : "#i-menu");
    behind.forEach((el) => { el.inert = open; });
    if (focusTarget) focusTarget.focus();
  }
  if (navToggle && nav) {
    const isOpen = () => document.body.classList.contains("nav-open");
    navToggle.addEventListener("click", () =>
      isOpen() ? setNav(false, navToggle) : setNav(true, nav.querySelector("a"))
    );
    nav.addEventListener("click", (e) => {
      if (e.target.closest("a")) setNav(false);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isOpen()) setNav(false, navToggle);
    });
    // the dim backdrop is body::after, so a tap on it lands on body
    document.addEventListener("click", (e) => {
      if (isOpen() && !nav.contains(e.target) && !navToggle.contains(e.target) &&
          !(themeToggle && themeToggle.contains(e.target))) setNav(false, navToggle);
    });
    onMedia(window.matchMedia("(min-width: 901px)"), (e) => {
      if (e.matches) setNav(false);
    });
  }

  const root = document.documentElement;

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    if (themeToggle) {
      const dark = theme === "dark";
      const icon = themeToggle.querySelector("use");
      if (icon) icon.setAttribute("href", dark ? "#i-moon" : "#i-sun");
      themeToggle.setAttribute("aria-pressed", String(dark));
    }
  }
  applyTheme(
    store.get("theme") ||
      (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark")
  );
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next);
      store.set("theme", next);
    });
  }

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

  const toTop = document.getElementById("to-top");
  if (toTop) {
    const onScrollTop = () => toTop.classList.toggle("show", window.scrollY > 600);
    onScrollTop();
    window.addEventListener("scroll", onScrollTop, { passive: true });
    toTop.addEventListener("click", () =>
      window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" })
    );
  }

  const copyBtn = document.getElementById("copy-email");
  if (copyBtn && navigator.clipboard) {
    const label = copyBtn.textContent;
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(copyBtn.dataset.email).then(
        () => {
          copyBtn.textContent = "Copied";
          setTimeout(() => { copyBtn.textContent = label; }, 2000);
        },
        () => {}
      );
    });
  } else if (copyBtn) {
    copyBtn.hidden = true;
  }

  const scriptURL =
    "https://script.google.com/macros/s/AKfycbzjlwJ2xRaJ1GmnVu3ViGAOoypEwBl6CH7ifqh6d-ootjngSyWye5yEQWSnf1L-CxP2Lg/exec";
  const form = document.forms["contact"];
  const msg = document.getElementById("msg");
  const fallback = "Email me at laxmipoudel311@gmail.com.";
  if (form) {
    const submitBtn = form.querySelector('button[type="submit"]');
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const honeypot = form.elements["_hp"];
      if (honeypot && honeypot.value) { form.reset(); return; }
      if (!form.checkValidity()) { form.reportValidity(); return; }
      const original = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending...";
      msg.className = "";
      msg.textContent = "";

      fetch(scriptURL, { method: "POST", body: new FormData(form) })
        .then((r) => {
          if (!r.ok) throw new Error("HTTP " + r.status);
          msg.textContent = "Thanks, your message was sent.";
          form.reset();
          setTimeout(() => { msg.textContent = ""; }, 12000);
        })
        .catch((err) => {
          console.error("Contact form failed:", err);
          msg.className = "error";
          msg.textContent = "That didn't go through. " + fallback;
        })
        .finally(() => {
          submitBtn.disabled = false;
          submitBtn.textContent = original;
        });
    });
  }
})();
