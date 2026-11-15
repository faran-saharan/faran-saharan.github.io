// click a part picture to see it bigger
const viewer = document.getElementById("viewer");
const viewerImg = document.getElementById("viewer-img");
const viewerText = document.getElementById("viewer-text");

document.querySelectorAll(".part").forEach((part) => {
  part.addEventListener("click", () => {
    const img = part.querySelector("img");
    viewerImg.src = img.src;
    viewerText.textContent = img.alt;
    viewer.showModal();
  });
});

document.getElementById("close").addEventListener("click", () => viewer.close());

// clicking the dark area around the picture closes it too
viewer.addEventListener("click", (e) => {
  if (e.target === viewer) viewer.close();
});

// hovering a number or a part lights up everything with the same number
function highlight(num, on) {
  document.querySelectorAll(`[data-part="${num}"]`).forEach((el) => {
    el.classList.toggle("lit", on);
  });
}

document.querySelectorAll("[data-part]").forEach((el) => {
  el.addEventListener("mouseenter", () => highlight(el.dataset.part, true));
  el.addEventListener("mouseleave", () => highlight(el.dataset.part, false));
});
