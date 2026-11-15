// all the moving stuff on the page

// ---------- little helpers ----------
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// if someone has "reduce motion" on, skip the animations and just show everything
const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// types text into an element one letter at a time
async function typeText(el, text, speed) {
  if (calm) {
    el.textContent = text;
    return;
  }
  el.classList.add("typing");
  for (let i = 1; i <= text.length; i++) {
    el.textContent = text.slice(0, i);
    await wait(speed);
  }
  el.classList.remove("typing");
}

// keeps the space for the text so the page doesn't jump around while it types
function saveSpace(el) {
  el.style.minHeight = el.offsetHeight + "px";
}

// slides a fake cursor to (x, y). the cursor is positioned inside its parent box
async function moveTo(cursor, x, y, time) {
  cursor.style.transition = `transform ${time}ms cubic-bezier(0.5, 0, 0.2, 1)`;
  cursor.style.transform = `translate(${x}px, ${y}px)`;
  cursor.x = x;
  cursor.y = y;
  await wait(time);
}

// same thing but aims at an element. "left" means aim near the start of it (for text boxes)
async function moveToElement(cursor, target, box, time, left) {
  const b = box.getBoundingClientRect();
  const t = target.getBoundingClientRect();
  const x = t.left - b.left + (left ? 24 : t.width / 2);
  const y = t.top - b.top + t.height / 2;
  await moveTo(cursor, x, y, time);
}

// puts the cursor somewhere instantly, without sliding
function placeAt(cursor, x, y) {
  cursor.style.transition = "none";
  cursor.style.transform = `translate(${x}px, ${y}px)`;
  cursor.x = x;
  cursor.y = y;
  cursor.offsetWidth; // makes the browser apply it right away
}

// for the cursor that's fixed to the screen: follows the target every frame,
// so it still lands on it even if the page is scrolling
function glideTo(cursor, target, time) {
  const startX = cursor.x;
  const startY = cursor.y;
  const t0 = performance.now();

  return new Promise((resolve) => {
    function step(now) {
      const k = Math.min((now - t0) / time, 1);
      const ease = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      const r = target.getBoundingClientRect();
      const x = startX + (r.left + r.width / 2 - startX) * ease;
      const y = startY + (r.top + r.height / 2 - startY) * ease;
      placeAt(cursor, x, y);
      if (k < 1) requestAnimationFrame(step);
      else resolve();
    }
    requestAnimationFrame(step);
  });
}

async function click(cursor) {
  cursor.classList.add("clicking");
  await wait(300);
  cursor.classList.remove("clicking");
}

// ---------- the intro at the top ----------
async function intro() {
  const desk = document.querySelector(".desk");
  const cursor = desk.querySelector(".fake-cursor");
  const photo = desk.querySelector(".photo-win");
  const lines = desk.querySelectorAll("[data-type]");

  if (calm) {
    lines.forEach((el) => (el.textContent = el.dataset.type));
    photo.classList.add("placed");
    document.body.classList.add("intro-done");
    return;
  }

  // cursor comes in from the bottom right corner
  placeAt(cursor, desk.offsetWidth, desk.offsetHeight);
  await wait(400);
  cursor.classList.add("on");
  await moveToElement(cursor, lines[0], desk, 900, true);
  await click(cursor);

  await typeText(lines[0], lines[0].dataset.type, 45);
  await typeText(lines[1], lines[1].dataset.type, 65);
  await typeText(lines[2], lines[2].dataset.type, 10);
  document.body.classList.add("intro-done"); // buttons fade in now

  // grab the photo window by its title bar...
  const bar = photo.querySelector(".win-bar");
  await moveToElement(cursor, bar, desk, 700);
  await click(cursor);

  // ...work out how far the bar moves once the photo is in place...
  const before = bar.getBoundingClientRect();
  photo.style.transition = "none";
  photo.classList.add("placed");
  const after = bar.getBoundingClientRect();
  photo.classList.remove("placed");
  photo.offsetWidth;

  // ...and drag both of them there together
  photo.style.transition = "transform 0.8s cubic-bezier(0.5, 0, 0.2, 1)";
  photo.classList.add("placed");
  const dx = after.left + after.width / 2 - (before.left + before.width / 2);
  const dy = after.top + after.height / 2 - (before.top + before.height / 2);
  await moveTo(cursor, cursor.x + dx, cursor.y + dy, 800);

  await wait(200);
  cursor.classList.remove("on");
}

// ---------- crosshair + coordinates on the top part ----------
const hero = document.querySelector(".hero");
const crossX = document.querySelector(".cross-x");
const crossY = document.querySelector(".cross-y");
const coords = document.querySelector(".coords");

function fourDigits(n) {
  return String(Math.max(0, Math.round(n))).padStart(4, "0");
}

hero.addEventListener("pointermove", (e) => {
  if (e.pointerType !== "mouse") return;
  const r = hero.getBoundingClientRect();
  const x = e.clientX - r.left;
  const y = e.clientY - r.top;

  hero.classList.add("aiming");
  crossX.style.top = y + "px";
  crossY.style.left = x + "px";
  coords.style.left = x + 14 + "px";
  coords.style.top = y + 10 + "px";
  // y counts up from the bottom like a normal graph, same as my robot arm project
  coords.textContent = `x ${fourDigits(x)}  y ${fourDigits(r.height - y)}`;

  // the grid moves a little the other way, makes it look 3D
  hero.style.setProperty("--px", (x / r.width - 0.5) * -24 + "px");
  hero.style.setProperty("--py", (y / r.height - 0.5) * -24 + "px");
});

hero.addEventListener("pointerleave", () => hero.classList.remove("aiming"));

// ---------- the profile form that fills itself in ----------
async function fillForm(form) {
  const cursor = form.querySelector(".fake-cursor");
  const fields = form.querySelectorAll(".field");
  const save = form.querySelector(".save");

  if (calm) {
    fields.forEach((f) => (f.textContent = f.dataset.value));
    save.textContent = "Saved";
    save.classList.add("done");
    return;
  }

  placeAt(cursor, form.offsetWidth + 40, form.offsetHeight);
  cursor.classList.add("on");

  for (const field of fields) {
    await moveToElement(cursor, field, form, 380, true);
    await click(cursor);
    field.classList.add("focus");
    await typeText(field, field.dataset.value, 22);
    field.classList.remove("focus");
  }

  await moveToElement(cursor, save, form, 380);
  await click(cursor);
  save.textContent = "Saved";
  save.classList.add("done");
  await wait(500);
  cursor.classList.remove("on");
}

// ---------- the cursor that flies in and clicks things while you scroll ----------
const tourCursor = document.querySelector(".tour-cursor");
let touring = false;

async function tour(target) {
  if (calm || touring) return;
  touring = true;

  // start off the right side of the screen
  const r = target.getBoundingClientRect();
  placeAt(tourCursor, window.innerWidth + 30, r.top + 80);
  tourCursor.classList.add("on");

  await glideTo(tourCursor, target, 900);
  click(tourCursor);

  target.classList.add("poked");
  target.dispatchEvent(new Event("mouseenter")); // lights up the matching number on the fixture
  await glideTo(tourCursor, target, 1100); // stays on it for a second
  target.dispatchEvent(new Event("mouseleave"));
  target.classList.remove("poked");

  tourCursor.classList.remove("on");
  touring = false;
}

// ---------- pictures that lean towards the mouse ----------
document.querySelectorAll(".tilt").forEach((box) => {
  box.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    const r = box.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    box.style.setProperty("--ry", x * 10 + "deg");
    box.style.setProperty("--rx", y * -10 + "deg");
  });
  box.addEventListener("pointerleave", () => {
    box.style.setProperty("--rx", "0deg");
    box.style.setProperty("--ry", "0deg");
  });
});

// ---------- scrolling: progress bar + timeline line ----------
const progress = document.querySelector(".progress");
const timeline = document.querySelector(".timeline");

function onScroll() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.transform = `scaleX(${window.scrollY / max})`;

  // the coloured timeline line fills up to about 60% down the screen
  const r = timeline.getBoundingClientRect();
  const fill = Math.min(Math.max((window.innerHeight * 0.6 - r.top) / r.height, 0), 1);
  timeline.style.setProperty("--fill", fill * 100 + "%");
}

window.addEventListener("scroll", () => requestAnimationFrame(onScroll), { passive: true });

// ---------- start everything ----------
async function start() {
  // fonts change how big the text is, so wait for them before measuring (but not forever)
  if (document.fonts) await Promise.race([document.fonts.ready, wait(1500)]);

  // take the text out so it can be typed back in
  document.querySelectorAll("[data-type]").forEach((el) => {
    el.dataset.type = el.textContent.trim();
    if (!calm) {
      saveSpace(el);
      el.textContent = "";
    }
  });
  document.querySelectorAll(".field").forEach((f) => {
    f.dataset.value = f.textContent.trim();
    f.textContent = "";
  });

  // watches for things scrolling into view, each one only happens once
  const watcher = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      watcher.unobserve(el);

      if (el.matches("h2[data-type]")) typeText(el, el.dataset.type, 60);
      else if (el.matches(".profile")) fillForm(el);
      else el.classList.add("show");
    });
  }, { threshold: 0.2 });

  document.querySelectorAll(".reveal, h2[data-type], .profile").forEach((el) => watcher.observe(el));

  // tour targets wait until they're in the top part of the screen
  const tourWatcher = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      tourWatcher.unobserve(entry.target);
      tour(entry.target);
    });
  }, { rootMargin: "0px 0px -35% 0px", threshold: 1 });

  document.querySelectorAll("[data-tour]").forEach((el) => tourWatcher.observe(el));

  onScroll();
  intro();
}

start();
