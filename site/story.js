export const scenes = [
  { step: 0, edge: "0-1", phases: ["request"], label: "Your request", caption: '"Flag duplicate invoice lines." The invoice contains product A twice. That request starts the work.' },
  { step: 1, edge: "1-2", phases: ["approved"], label: "Agreed examples", caption: "Two lines for product A need review; one line with quantity two does not. The owner approves these examples." },
  { step: 2, edge: "2-3", phases: ["implementation"], label: "Agent builds", caption: "The coding agent implements against those agreed examples. It cannot redefine success by changing them." },
  { step: 3, edge: null, phases: ["fail", "repair", "pass"], label: "Check and repair", caption: "The check fails, returns evidence for a code repair, then passes. The approved examples stay fixed." },
  { step: 4, edge: "3-4", phases: ["review"], label: "Human review", caption: "Checks provide evidence, not permission. Repository controls and a person govern whether this change can merge." },
  { step: 5, edge: "4-5", phases: ["result", "feedback", "next-approved"], label: "Result and feedback", caption: 'The owner asks: "Also name every duplicated product." They approve new examples, starting the next round.' },
];

export function createPlayback({ onChange, schedule = setTimeout, cancel = clearTimeout, reducedMotion = false }) {
  let index = 0;
  let phaseIndex = 0;
  let playing = false;
  let timer = null;
  const state = () => ({ index, scene: scenes[index], phase: scenes[index].phases[phaseIndex], playing, reducedMotion });
  const emit = () => onChange(state());
  const atEnd = () => index === scenes.length - 1 && phaseIndex === scenes[index].phases.length - 1;
  function stop() {
    if (timer !== null) cancel(timer);
    timer = null;
    playing = false;
  }
  function advance() {
    if (atEnd()) {
      index = 0;
      phaseIndex = 0;
    } else if (phaseIndex < scenes[index].phases.length - 1) phaseIndex++;
    else { index++; phaseIndex = 0; }
  }
  function tick() {
    timer = null;
    advance();
    if (atEnd()) playing = false;
    emit();
    if (playing) timer = schedule(tick, 6000);
  }
  function play() {
    if (playing || reducedMotion) return;
    if (atEnd()) { index = 0; phaseIndex = 0; }
    playing = true;
    emit();
    timer = schedule(tick, 6000);
  }
  emit();
  return {
    state,
    play,
    pause() { stop(); emit(); },
    replay() { stop(); index = 0; phaseIndex = 0; emit(); play(); },
    next() { stop(); advance(); emit(); },
    select(step) {
      if (!Number.isInteger(step) || step < 0 || step > 5) throw new RangeError("Story step must be between 0 and 5");
      stop();
      index = step;
      phaseIndex = 0;
      emit();
    },
    setReducedMotion(value) {
      reducedMotion = value;
      if (reducedMotion) stop();
      emit();
    },
  };
}
