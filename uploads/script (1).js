/* ============================================================
   PORTFOLIO — interactions
   ============================================================ */

/* ---------- TWEAK DEFAULTS (persist via __edit_mode_set_keys) ---------- */
const TWEAKS = /*EDITMODE-BEGIN*/{
  "accent": "blue",
  "density": "airy",
  "hero": "default",
  "sectionOrder": ["about", "experience", "skills", "projects", "education"]
}/*EDITMODE-END*/;

/* ============================================================
   THEME (persistent in localStorage, with optional system match)
   ============================================================ */
const root = document.documentElement;
const savedTheme = localStorage.getItem("mb-theme");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
const initialTheme = savedTheme || (prefersDark ? "dark" : "light");
root.setAttribute("data-theme", initialTheme);

const themeToggle = document.querySelector("[data-theme-toggle]");
themeToggle?.addEventListener("click", () => {
  const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
  root.setAttribute("data-theme", next);
  localStorage.setItem("mb-theme", next);
});

/* ============================================================
   CONTACT POPOUT
   ============================================================ */
const contactWrap = document.querySelector("[data-contact]");
const contactBtn  = document.querySelector("[data-contact-btn]");
const contactMenu = document.querySelector("[data-contact-menu]");

function setContactOpen(open) {
  if (!contactBtn || !contactMenu) return;
  contactBtn.setAttribute("aria-expanded", open ? "true" : "false");
  contactMenu.setAttribute("aria-hidden", open ? "false" : "true");
}
contactBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  const isOpen = contactBtn.getAttribute("aria-expanded") === "true";
  setContactOpen(!isOpen);
});
document.addEventListener("click", (e) => {
  if (!contactWrap?.contains(e.target)) setContactOpen(false);
});
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") setContactOpen(false);
});
contactMenu?.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => setContactOpen(false))
);

/* ============================================================
   APPLY INITIAL TWEAKS
   ============================================================ */
function applyTweaks() {
  root.setAttribute("data-accent", TWEAKS.accent);
  root.setAttribute("data-density", TWEAKS.density);
  root.setAttribute("data-hero", TWEAKS.hero);
  reorderSections(TWEAKS.sectionOrder);
}

function setTweak(key, value) {
  TWEAKS[key] = value;
  applyTweaks();
  // persist to source
  try {
    window.parent.postMessage(
      { type: "__edit_mode_set_keys", edits: { [key]: value } },
      "*"
    );
  } catch (e) { /* noop */ }
}

/* ============================================================
   SECTION REORDER
   ============================================================ */
function reorderSections(order) {
  const host = document.querySelector("[data-sections-root]");
  if (!host) return;
  const map = new Map();
  host.querySelectorAll("[data-section]").forEach((el) => map.set(el.dataset.section, el));
  order.forEach((id) => {
    const el = map.get(id);
    if (el) host.appendChild(el);
  });
}

/* ============================================================
   PROJECT CARD: hover spotlight + tilt
   ============================================================ */
document.querySelectorAll(".project").forEach((card) => {
  card.addEventListener("pointermove", (e) => {
    const r = card.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    card.style.setProperty("--mx", x + "%");
    card.style.setProperty("--my", y + "%");
    // mild tilt: ±0.6deg based on horizontal position
    const tiltX = ((e.clientX - r.left) / r.width - 0.5) * 1.2;
    card.style.setProperty("--tilt", tiltX.toFixed(2) + "deg");
  });
  card.addEventListener("pointerleave", () => {
    card.style.setProperty("--tilt", "0deg");
  });
});

/* ============================================================
   SCROLL REVEAL
   ============================================================ */
const io = new IntersectionObserver(
  (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("is-in")),
  { threshold: 0.12, rootMargin: "-40px 0px" }
);
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

/* ============================================================
   SLIDEOUT — expand experience / project cards
   ============================================================ */
const slideout      = document.querySelector("[data-slideout]");
const slideoutBody  = slideout?.querySelector("[data-slideout-body]");
const slideoutKind  = slideout?.querySelector("[data-slideout-kind]");
const slideoutWhen  = slideout?.querySelector("[data-slideout-when]");
const slideoutPrev  = slideout?.querySelector("[data-slideout-prev]");
const slideoutNext  = slideout?.querySelector("[data-slideout-next]");
const slideoutCount = slideout?.querySelector("[data-slideout-counter]");

const expandables = Array.from(document.querySelectorAll("[data-expand]"));
let currentIdx = -1;

function buildPayload(card) {
  const isProject = card.classList.contains("project");
  const isRef     = card.classList.contains("ref");
  const kind      = isRef ? "Reference" : isProject ? "Design Team" : "Experience";

  const tpl     = card.querySelector("template");
  const details = tpl ? tpl.innerHTML : "";

  if (isRef) {
    const logo  = card.querySelector(".ref__logo")?.innerHTML || "";
    const quote = card.querySelector(".ref__quote")?.innerHTML || "";
    const by    = card.querySelector(".ref__by")?.innerHTML || "";
    const name  = card.querySelector(".ref__by .name")?.textContent.trim() || "";
    return {
      kind,
      when: name,
      html: `
        <div class="slideout__ref-logo">${logo}</div>
        <p class="ref__quote slideout__pull">${quote}</p>
        <p class="slideout__meta">${by}</p>
        <div class="slideout__divider"></div>
        ${details}
      `
    };
  }

  const when    = card.querySelector(".exp__when")?.textContent.trim() || "";
  const num     = card.querySelector(".project__num")?.textContent.trim() || "";
  const title   = card.querySelector(".exp__role, .project__title")?.innerHTML || "";
  const company = card.querySelector(".exp__company")?.innerHTML || "";
  const summary = card.querySelector(".exp__summary, .project__desc")?.innerHTML || "";

  const kicker = isProject ? num : when;

  return {
    kind,
    when: isProject ? num : when,
    html: `
      ${kicker ? `<div class="slideout__kicker">${kicker}</div>` : ""}
      <h3 class="slideout__title">${title}</h3>
      ${company ? `<p class="slideout__meta">${company}</p>` : ""}
      ${summary ? `<p class="slideout__lede">${summary}</p>` : ""}
      <div class="slideout__divider"></div>
      <div class="slideout__section-label">${isProject ? "Project Detail" : "What I Did"}</div>
      ${details}
    `
  };
}

function openSlideout(idx) {
  if (!slideout || idx < 0 || idx >= expandables.length) return;
  currentIdx = idx;
  const card = expandables[idx];
  const payload = buildPayload(card);
  slideoutKind.textContent  = payload.kind;
  slideoutWhen.textContent  = payload.when;
  slideoutBody.innerHTML    = payload.html;
  slideoutBody.scrollTop    = 0;
  slideoutCount.textContent = `${String(idx + 1).padStart(2, "0")} / ${String(expandables.length).padStart(2, "0")}`;
  slideoutPrev.disabled = idx === 0;
  slideoutNext.disabled = idx === expandables.length - 1;
  slideout.setAttribute("aria-hidden", "false");
  document.body.classList.add("slideout-open");
}

function closeSlideout() {
  if (!slideout) return;
  slideout.setAttribute("aria-hidden", "true");
  document.body.classList.remove("slideout-open");
  // return focus to triggering card
  if (currentIdx >= 0) expandables[currentIdx]?.focus();
  currentIdx = -1;
}

expandables.forEach((card, idx) => {
  card.addEventListener("click", (e) => {
    if (e.target.closest("a, button")) return;
    openSlideout(idx);
  });
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openSlideout(idx);
    }
  });
});

slideout?.querySelectorAll("[data-slideout-close]").forEach((el) =>
  el.addEventListener("click", closeSlideout)
);
slideoutPrev?.addEventListener("click", () => openSlideout(currentIdx - 1));
slideoutNext?.addEventListener("click", () => openSlideout(currentIdx + 1));

window.addEventListener("keydown", (e) => {
  if (slideout?.getAttribute("aria-hidden") === "true") return;
  if (e.key === "Escape")      closeSlideout();
  if (e.key === "ArrowLeft"  && currentIdx > 0)                     openSlideout(currentIdx - 1);
  if (e.key === "ArrowRight" && currentIdx < expandables.length - 1) openSlideout(currentIdx + 1);
});

/* ============================================================
   LIVE LOCATION (relative time)
   ============================================================ */
const liveEl = document.querySelector("[data-live-time]");
function updateLiveTime() {
  if (!liveEl) return;
  const now = new Date();
  const opts = { hour: "2-digit", minute: "2-digit", timeZone: "America/Toronto", hour12: false };
  liveEl.textContent = new Intl.DateTimeFormat("en-CA", opts).format(now) + " EST · WATERLOO";
}
updateLiveTime();
setInterval(updateLiveTime, 30 * 1000);

/* ============================================================
   TWEAKS PANEL — open/close + host integration
   ============================================================ */
const panel = document.querySelector(".tweaks");
function openPanel() { panel?.classList.add("is-open"); }
function closePanel() {
  panel?.classList.remove("is-open");
  try { window.parent.postMessage({ type: "__edit_mode_dismissed" }, "*"); } catch (e) {}
}

// register listener first
window.addEventListener("message", (e) => {
  const d = e.data;
  if (!d || typeof d !== "object") return;
  if (d.type === "__activate_edit_mode")   openPanel();
  if (d.type === "__deactivate_edit_mode") closePanel();
});

// then announce
try { window.parent.postMessage({ type: "__edit_mode_available" }, "*"); } catch (e) {}

document.querySelector("[data-tweaks-close]")?.addEventListener("click", closePanel);

/* ---------- SWATCHES ---------- */
function buildSwatches() {
  const host = document.querySelector("[data-swatches]");
  if (!host) return;
  const colors = [
    { name: "blue",    hex: "var(--blue)" },
    { name: "orange",  hex: "var(--orange)" },
    { name: "yellow",  hex: "var(--yellow)" },
    { name: "violet",  hex: "var(--violet)" },
    { name: "cyan",    hex: "var(--cyan)" },
    { name: "magenta", hex: "var(--magenta)" },
  ];
  host.innerHTML = colors.map((c) =>
    `<button class="swatch" data-acc="${c.name}" style="background:${c.hex}" aria-label="${c.name}"></button>`
  ).join("");
  const setActive = () => host.querySelectorAll(".swatch").forEach((b) =>
    b.classList.toggle("is-active", b.dataset.acc === TWEAKS.accent)
  );
  setActive();
  host.querySelectorAll(".swatch").forEach((b) => {
    b.addEventListener("click", () => {
      setTweak("accent", b.dataset.acc);
      setActive();
    });
  });
}

/* ---------- DENSITY ---------- */
function buildDensity() {
  const host = document.querySelector("[data-density-seg]");
  if (!host) return;
  host.querySelectorAll("button").forEach((b) => {
    b.classList.toggle("is-active", b.dataset.d === TWEAKS.density);
    b.addEventListener("click", () => {
      setTweak("density", b.dataset.d);
      host.querySelectorAll("button").forEach((x) => x.classList.toggle("is-active", x.dataset.d === b.dataset.d));
    });
  });
}

/* ---------- HERO VARIANT ---------- */
function buildHeroVariant() {
  const host = document.querySelector("[data-hero-variant]");
  if (!host) return;
  host.querySelectorAll("button").forEach((b) => {
    b.classList.toggle("is-active", b.dataset.h === TWEAKS.hero);
    b.addEventListener("click", () => {
      setTweak("hero", b.dataset.h);
      host.querySelectorAll("button").forEach((x) => x.classList.toggle("is-active", x.dataset.h === b.dataset.h));
    });
  });
}

/* ---------- SECTION REORDER ---------- */
function buildReorder() {
  const host = document.querySelector("[data-reorder]");
  if (!host) return;
  const labels = {
    about: "About", experience: "Experience", skills: "Skills",
    projects: "Projects & Design Teams", education: "Education & Awards",
  };
  function render() {
    host.innerHTML = TWEAKS.sectionOrder.map((id, i) => `
      <div class="row" data-id="${id}">
        <span>${String(i + 1).padStart(2, "0")} · ${labels[id]}</span>
        <span class="nudge">
          <button data-dir="up"   ${i === 0 ? "disabled" : ""}>↑</button>
          <button data-dir="down" ${i === TWEAKS.sectionOrder.length - 1 ? "disabled" : ""}>↓</button>
        </span>
      </div>
    `).join("");
    host.querySelectorAll("[data-dir]").forEach((b) => {
      b.addEventListener("click", () => {
        const row = b.closest(".row");
        const id = row.dataset.id;
        const i = TWEAKS.sectionOrder.indexOf(id);
        const j = b.dataset.dir === "up" ? i - 1 : i + 1;
        if (j < 0 || j >= TWEAKS.sectionOrder.length) return;
        const arr = [...TWEAKS.sectionOrder];
        [arr[i], arr[j]] = [arr[j], arr[i]];
        setTweak("sectionOrder", arr);
        render();
      });
    });
  }
  render();
}

/* ============================================================
   INIT
   ============================================================ */
applyTweaks();
buildSwatches();
buildDensity();
buildHeroVariant();
buildReorder();
