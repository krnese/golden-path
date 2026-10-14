import { createPlayback, scenes } from "./story.js";

const button = document.getElementById("copy-command");
const status = document.getElementById("copy-status");
if (navigator.clipboard?.writeText && window.isSecureContext) {
  button.hidden = false;
  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(document.getElementById("install-command").textContent);
      status.textContent = "Copied. Replace the placeholders before running.";
    } catch (error) {
      console.error("Could not copy installation commands:", error);
      status.textContent = "Copy failed. Select the commands above and copy them manually.";
    }
  });
}

const story = document.getElementById("walkthrough");
const steps = [...story.querySelectorAll("[data-step]")];
const selectors = [...story.querySelectorAll("[data-select]")];
const play = document.getElementById("story-play");
const motion = matchMedia("(prefers-reduced-motion: reduce)");
const lines = story.querySelector(".story-lines");
let pulses = [];

// Invisible grid layers reserve the tallest caption at each viewport width.
for (const [index, scene] of scenes.entries()) {
  const sizing = document.createElement("div");
  sizing.className = "story-sizing";
  sizing.setAttribute("aria-hidden", "true");
  const label = document.createElement("p");
  label.className = "story-scene";
  label.textContent = `${index + 1} / 10 - ${scene.label}`;
  const caption = document.createElement("p");
  caption.className = "scene-caption";
  caption.textContent = scene.caption;
  sizing.append(label, caption);
  story.querySelector(".story-detail").append(sizing);
}

function render({ scene, index, playing, reducedMotion }) {
  story.dataset.playing = String(playing);
  for (const [i, step] of steps.entries()) {
    step.classList.toggle("is-current", i === scene.step);
    if (i === scene.step) selectors[i].setAttribute("aria-current", "step");
    else selectors[i].removeAttribute("aria-current");
  }
  document.getElementById("story-scene").textContent = `${index + 1} / 10 - ${scene.label}`;
  document.getElementById("story-caption").textContent = scene.caption;
  play.textContent = playing ? "Pause" : "Play walkthrough";
  play.hidden = reducedMotion;
  document.getElementById("story-help").textContent = reducedMotion
    ? "Reduced motion: a static story. Select steps or use Next scene; nothing advances automatically."
    : "Select a step to explore. Arrow keys move between steps.";
  for (const pulse of pulses) pulse.classList.toggle("is-active", pulse.dataset.edge === scene.edge);
}
const playback = createPlayback({ onChange: render, reducedMotion: motion.matches });

function drawLines() {
  const stage = story.querySelector(".story-stage");
  const origin = stage.getBoundingClientRect();
  const boxes = steps.map(step => {
    const box = step.getBoundingClientRect();
    return { left: box.left - origin.left, right: box.right - origin.left, top: box.top - origin.top, bottom: box.bottom - origin.top, x: (box.left + box.right) / 2 - origin.left, y: (box.top + box.bottom) / 2 - origin.top };
  });
  lines.setAttribute("viewBox", `0 0 ${origin.width} ${origin.height}`);
  lines.replaceChildren();
  pulses = [];
  function addPath(edge, d, kind = "path") {
    for (const isPulse of [false, true]) {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", d);
      path.setAttribute("class", `${isPulse ? "flow-pulse" : "flow-track"} ${kind}`);
      lines.append(path);
      if (isPulse) {
        const length = path.getTotalLength();
        path.dataset.edge = edge;
        path.style.strokeDasharray = `14 ${length}`;
        path.style.setProperty("--travel-length", String(length + 14));
        pulses.push(path);
      }
    }
  }
  for (let i = 0; i < boxes.length - 1; i++) {
    const a = boxes[i];
    const b = boxes[i + 1];
    const d = Math.abs(a.y - b.y) < 2
      ? `M ${b.x > a.x ? a.right : a.left} ${a.y} L ${b.x > a.x ? b.left : b.right} ${b.y}`
      : `M ${a.x} ${a.bottom} L ${b.x} ${b.top}`;
    addPath(`${i}-${i + 1}`, d);
  }
  const first = boxes[0];
  const last = boxes[5];
  addPath("loop", `M ${last.left} ${last.y} L 6 ${last.y} L 6 ${first.y} L ${first.left} ${first.y}`, "owner-loop");
  const check = boxes[3];
  const implementation = boxes[2];
  const right = origin.width - 6;
  addPath("repair", `M ${check.right} ${check.y} L ${right} ${check.y} L ${right} ${implementation.y} L ${implementation.right} ${implementation.y}`, "repair");
  render(playback.state());
}
for (const [index, selector] of selectors.entries()) {
  selector.disabled = false;
  selector.setAttribute("aria-controls", "story-caption");
  selector.addEventListener("click", () => playback.select(index));
  selector.addEventListener("keydown", event => {
    let next;
    if (["ArrowRight", "ArrowDown"].includes(event.key)) next = (index + 1) % selectors.length;
    else if (["ArrowLeft", "ArrowUp"].includes(event.key)) next = (index + selectors.length - 1) % selectors.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = selectors.length - 1;
    else return;
    event.preventDefault();
    playback.select(next);
    selectors[next].focus();
  });
}
play.addEventListener("click", () => playback.state().playing ? playback.pause() : playback.play());
document.getElementById("story-replay").addEventListener("click", () => playback.replay());
document.getElementById("story-next").addEventListener("click", () => playback.next());
motion.addEventListener("change", event => playback.setReducedMotion(event.matches));
document.addEventListener("visibilitychange", () => {
  if (document.hidden) playback.pause();
});
story.querySelector(".story-controls").hidden = false;
story.querySelector(".story-detail").hidden = false;
story.dataset.enhanced = "true";
new ResizeObserver(drawLines).observe(story.querySelector(".story-stage"));
