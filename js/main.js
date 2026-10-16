(function () {
  "use strict";

  // tells the inline head script that this file loaded
  window.__ready = true;
  document.documentElement.classList.add("js");

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
            if (current) current.setAttribute("aria-current", "true");
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach((s) => spy.observe(s));
  }

  const toTop = document.getElementById("to-top");
  if (toTop) {
    // On narrow screens it only appears while scrolling up, then hides again, so it never sits on top of text being read.
    const narrow = window.matchMedia("(max-width: 720px)");
    const footer = document.querySelector(".site-footer");
    let atEnd = false, lastY = window.scrollY, idle;
    const update = () => {
      const y = window.scrollY, up = y < lastY;
      lastY = y;
      clearTimeout(idle);
      const show = y > 600 && !atEnd && (!narrow.matches || up);
      toTop.classList.toggle("show", show);
      if (show && narrow.matches) idle = setTimeout(() => toTop.classList.remove("show"), 2500);
    };
    window.addEventListener("scroll", update, { passive: true });
    if (footer && "IntersectionObserver" in window) {
      new IntersectionObserver((entries) => {
        atEnd = entries[0].isIntersecting;
        update();
      }).observe(footer);
    }
    update();
    toTop.addEventListener("click", () =>
      window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" })
    );
  }

  const email = "laxmipoudel311@gmail.com";
  const copyBtn = document.getElementById("copy-email");
  const copyMsg = document.getElementById("copy-status");
  if (copyBtn && navigator.clipboard) {
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(email).then(
        () => {
          copyMsg.textContent = "Copied";
          setTimeout(() => { copyMsg.textContent = ""; }, 2500);
        },
        () => {
          // clipboard blocked: show the address selected so Ctrl+C works
          copyMsg.textContent = "Couldn't copy. Press Ctrl+C on: ";
          const a = document.createElement("span");
          a.textContent = email;
          copyMsg.appendChild(a);
          const range = document.createRange();
          range.selectNodeContents(a);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        }
      );
    });
  } else if (copyBtn) {
    copyBtn.hidden = true;
  }

  const scriptURL =
    "https://script.google.com/macros/s/AKfycbzjlwJ2xRaJ1GmnVu3ViGAOoypEwBl6CH7ifqh6d-ootjngSyWye5yEQWSnf1L-CxP2Lg/exec";
  const form = document.forms["contact"];
  const msg = document.getElementById("msg");
  function say(text, isError, withMail) {
    msg.className = isError ? "error" : "";
    msg.setAttribute("role", isError ? "alert" : "status");
    msg.textContent = text;
    if (withMail) {
      const a = document.createElement("a");
      a.href = "mailto:" + email;
      a.textContent = email;
      msg.append(" Email me at ", a, ".");
    }
  }
  if (form) {
    const submitBtn = form.querySelector('button[type="submit"]');
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const honeypot = form.elements["_hp"];
      if (honeypot && honeypot.value) { form.reset(); return; }
      const name = form.elements["Name"];
      const message = form.elements["Message"];
      name.value = name.value.trim();
      message.value = message.value.trim();
      if (!name.value || !message.value) {
        say("Please enter your name and a message.", true);
        (name.value ? message : name).focus();
        return;
      }
      if (!form.checkValidity()) { form.reportValidity(); return; }
      const original = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending...";
      say("", false);

      fetch(scriptURL, { method: "POST", body: new FormData(form) })
        .then((r) => {
          if (!r.ok) throw new Error("HTTP " + r.status);
          say("Thanks, your message was sent.", false);
          form.reset();
          setTimeout(() => { msg.textContent = ""; }, 12000);
        })
        .catch((err) => {
          console.error("Contact form failed:", err);
          say("That didn't go through.", true, true);
        })
        .finally(() => {
          submitBtn.disabled = false;
          submitBtn.textContent = original;
        });
    });
  }
})();
