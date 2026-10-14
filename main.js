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
let tokens = [];
let motionMoment = null;

// Invisible grid layers reserve the tallest caption at each viewport width.
for (const [index, scene] of scenes.entries()) {
  const sizing = document.createElement("div");
  sizing.className = "story-sizing";
  sizing.setAttribute("aria-hidden", "true");
  const label = document.createElement("p");
  label.className = "story-scene";
  label.textContent = `${index + 1} / ${scenes.length} - ${scene.label}`;
  const caption = document.createElement("p");
  caption.className = "scene-caption";
  caption.textContent = scene.caption;
  sizing.append(label, caption);
  story.querySelector(".story-detail").append(sizing);
}

function render({ scene, index, phase, playing, reducedMotion }) {
  story.dataset.playing = String(playing);
  if (playing) story.dataset.workStarted = "true";
  story.dataset.phase = phase;
  const check = index < 3 ? "pending" : index === 3 ? phase : "pass";
  const code = phase === "repair" ? "repair" : check === "pass" ? "corrected" : "initial";
  const feedback = index === 5 && phase !== "result";
  story.dataset.check = check;
  story.dataset.feedback = String(feedback);
  for (const variant of story.querySelectorAll("[data-check-phase]")) variant.hidden = variant.dataset.checkPhase !== check;
  for (const variant of story.querySelectorAll("[data-code-phase]")) variant.hidden = variant.dataset.codePhase !== code;
  story.querySelector("[data-next-example]").hidden = phase !== "next-approved";
  story.querySelector("[data-owner-request]").textContent = feedback
    ? '"Also name every duplicated product."'
    : '"Flag duplicate invoice lines."';
  for (const [i, step] of steps.entries()) {
    step.classList.toggle("is-current", i === scene.step);
    if (i === scene.step) selectors[i].setAttribute("aria-current", "step");
    else selectors[i].removeAttribute("aria-current");
  }
  document.getElementById("story-scene").textContent = `${index + 1} / ${scenes.length} - ${scene.label}`;
  const caption = document.getElementById("story-caption");
  if (caption.textContent !== scene.caption) caption.textContent = scene.caption;
  play.textContent = playing ? "Pause" : "Play walkthrough";
  play.hidden = reducedMotion;
  document.getElementById("story-help").textContent = reducedMotion
    ? "Reduced motion: a static story. Select stages or use Next; nothing advances automatically."
    : "Select a stage to explore. Arrow keys move between stages. Next shows each repair and feedback moment.";
  const edge = phase === "repair" ? "repair" : phase === "pass" ? "2-3" : phase === "feedback" ? "loop" : phase === "next-approved" ? null : scene.edge;
  for (const pulse of pulses) pulse.classList.toggle("is-active", pulse.dataset.edge === edge);
  const moment = `${index}:${phase}`;
  for (const token of tokens) {
    const active = token.edge === edge;
    token.element.classList.toggle("is-active", active);
  }
  // All paper paths share one clock; a new moment rewinds it.
  if (tokens.length && moment !== motionMoment) lines.setCurrentTime(0);
  if (tokens.length) motionMoment = moment;
  if (playing && !reducedMotion) lines.unpauseAnimations();
  else lines.pauseAnimations();
}
const playback = createPlayback({ onChange: render, reducedMotion: motion.matches });

function drawLines() {
  const stage = story.querySelector(".story-stage");
  const origin = stage.getBoundingClientRect();
  const boxes = steps.map(step => {
    const box = step.querySelector(".visual-artifact").getBoundingClientRect();
    return { left: box.left - origin.left, right: box.right - origin.left, top: box.top - origin.top, bottom: box.bottom - origin.top, x: (box.left + box.right) / 2 - origin.left, y: (box.top + box.bottom) / 2 - origin.top };
  });
  lines.setAttribute("viewBox", `0 0 ${origin.width} ${origin.height}`);
  lines.replaceChildren();
  lines.pauseAnimations();
  pulses = [];
  tokens = [];
  motionMoment = null;
  const namespace = "http://www.w3.org/2000/svg";
  const defs = document.createElementNS(namespace, "defs");
  for (const id of ["path-arrow", "owner-arrow", "repair-arrow"]) {
    const marker = document.createElementNS(namespace, "marker");
    for (const [name, value] of Object.entries({ id, viewBox: "0 0 8 8", refX: "7", refY: "4", markerWidth: id === "owner-arrow" ? "5" : "6", markerHeight: id === "owner-arrow" ? "5" : "6", orient: "auto" })) marker.setAttribute(name, value);
    const head = document.createElementNS(namespace, "path");
    head.setAttribute("d", "M 0 0 L 8 4 L 0 8 Z");
    head.setAttribute("class", `${id}-head`);
    marker.append(head);
    defs.append(marker);
  }
  lines.append(defs);
  function addPath(edge, d, kind = "path", tokenPath = d) {
    for (const isPulse of [false, true]) {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", d);
      path.setAttribute("class", `${isPulse ? "flow-pulse" : "flow-track"} ${kind}`);
      if (!isPulse) path.setAttribute("marker-end", `url(#${kind === "owner-loop" ? "owner-arrow" : kind === "repair" ? "repair-arrow" : "path-arrow"})`);
      lines.append(path);
      if (isPulse) {
        const length = path.getTotalLength();
        path.dataset.edge = edge;
        path.style.strokeDasharray = `14 ${length}`;
        path.style.setProperty("--travel-length", String(length + 14));
        pulses.push(path);
      }
    }
    const token = document.createElementNS(namespace, "g");
    token.setAttribute("class", "work-token");
    token.dataset.edge = edge;
    token.dataset.kind = edge === "repair" ? "failed evidence" : edge === "loop" ? "owner feedback" : edge === "0-1" || edge === "1-2" ? "request" : "evidence";
    const paper = document.createElementNS(namespace, "rect");
    for (const [name, value] of Object.entries({ x: "-10", y: "-13", width: "20", height: "26", rx: "3" })) paper.setAttribute(name, value);
    const writing = document.createElementNS(namespace, "path");
    writing.setAttribute("d", "M -5 -5 H 5 M -5 0 H 5 M -5 5 H 2");
    const animation = document.createElementNS(namespace, "animateMotion");
    for (const [name, value] of Object.entries({ path: tokenPath, dur: "6s", begin: "0s", fill: "freeze" })) animation.setAttribute(name, value);
    token.append(paper, writing, animation);
    lines.append(token);
    tokens.push({ element: token, edge });
  }
  for (let i = 0; i < boxes.length - 1; i++) {
    const a = boxes[i];
    const b = boxes[i + 1];
    const d = Math.abs(a.y - b.y) < 2
      ? `M ${b.x > a.x ? a.right : a.left} ${a.y} L ${b.x > a.x ? b.left : b.right} ${b.y}`
      : `M ${a.x} ${a.bottom} L ${b.x} ${b.top}`;
    const tokenPath = Math.abs(a.y - b.y) < 2
      ? `M ${a.x} ${a.y} L ${b.x} ${b.y}`
      : `M ${a.x} ${a.y} L ${a.x} ${a.bottom} L ${b.x} ${b.top} L ${b.x} ${b.y}`;
    addPath(`${i}-${i + 1}`, d, "path", tokenPath);
  }
  const last = boxes[5];
  const examples = boxes[1];
  const oneRow = boxes.every(box => Math.abs(box.y - boxes[0].y) < 2);
  addPath("loop", oneRow
    ? `M ${last.x} ${last.bottom} L ${last.x} ${origin.height - 12} L ${examples.x} ${origin.height - 12} L ${examples.x} ${examples.bottom}`
    : `M ${last.x} ${last.bottom} L ${last.x} ${origin.height - 12} L 5 ${origin.height - 12} L 5 8 L ${examples.left - 6} 8 L ${examples.left - 6} ${examples.y} L ${examples.left} ${examples.y}`, "owner-loop");
  const check = boxes[3];
  const implementation = boxes[2];
  const right = origin.width - 6;
  addPath("repair", Math.abs(check.y - implementation.y) < 2
    ? `M ${check.x} ${check.top} L ${check.x} ${check.top - 14} L ${implementation.x} ${implementation.top - 14} L ${implementation.x} ${implementation.top}`
    : `M ${check.right} ${check.y} L ${right} ${check.y} L ${right} ${implementation.y} L ${implementation.right} ${implementation.y}`, "repair");
  const repairLabel = document.createElementNS(namespace, "text");
  repairLabel.textContent = "repair code";
  repairLabel.setAttribute("class", "repair-label");
  repairLabel.setAttribute("font-size", "10");
  repairLabel.setAttribute("text-anchor", "middle");
  repairLabel.setAttribute("x", String(Math.abs(check.y - implementation.y) < 2 ? (check.x + implementation.x) / 2 : origin.width - 8));
  repairLabel.setAttribute("y", String(Math.abs(check.y - implementation.y) < 2 ? check.top - 20 : (check.y + implementation.y) / 2));
  if (Math.abs(check.y - implementation.y) >= 2) repairLabel.setAttribute("transform", `rotate(-90 ${origin.width - 8} ${(check.y + implementation.y) / 2})`);
  lines.append(repairLabel);
  render(playback.state());
}
for (const [index, selector] of selectors.entries()) {
  selector.disabled = false;
  selector.setAttribute("aria-controls", "story-caption");
  selector.setAttribute("aria-describedby", "story-help");
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
document.getElementById("story-replay").addEventListener("click", () => {
  motionMoment = null;
  playback.replay();
  for (const pulse of pulses) for (const animation of pulse.getAnimations()) animation.currentTime = 0;
});
document.getElementById("story-next").addEventListener("click", () => playback.next());
motion.addEventListener("change", event => playback.setReducedMotion(event.matches));
document.addEventListener("visibilitychange", () => {
  if (document.hidden) playback.pause();
});
story.querySelector(".story-controls").hidden = false;
story.querySelector(".story-detail").hidden = false;
story.dataset.enhanced = "true";
new ResizeObserver(drawLines).observe(story.querySelector(".story-stage"));
