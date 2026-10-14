export const scenes = [
  { step: 0, edge: null, label: "Intent / the expert sets the outcome", caption: 'The owner says: "Flag duplicate invoice lines." Start with the business outcome, not the implementation.' },
  { step: 1, edge: "0-1", label: "Acceptance / examples the owner can approve", caption: "Two lines for the same product need review; one line with quantity two does not. An engineer helps make these examples executable. The owner approves their meaning." },
  { step: 2, edge: "1-2", label: "Implementation / the agent works within the target", caption: "GitHub Copilot writes the implementation against the approved examples. Acceptance stays under the owner's control." },
  { step: 3, edge: "2-3", label: "Illustrative FAIL / a repair, not a rule change", caption: "Here, a duplicate invoice still says approve. A check fails and returns evidence to the agent. This is illustrative, not a recorded trial failure." },
  { step: 2, edge: "repair", label: "Repair / back to implementation", caption: "Fix code, not the agreed examples. A needed rule change requires the owner's approval, then a new implementation session." },
  { step: 3, edge: "2-3", label: "Illustrative PASS / evidence for review", caption: "The code now meets the examples. Integrity checks compare acceptance against the fixed baseline. Local feedback is bounded; required CI independently rechecks the PR." },
  { step: 4, edge: "3-4", label: "Review / cross the repository boundary", caption: "Required CI and configured repository rules govern the PR. A person reviews the evidence and decides whether to merge. The agent's claim is not approval." },
  { step: 5, edge: "4-5", label: "The golden loop / the owner sees the real result", caption: 'The owner inspects the actual output: "Also name every duplicated product." Tests cannot replace that judgment. This feedback becomes the next intent.' },
  { step: 0, edge: "loop", label: "Next intent / back around the golden loop", caption: "The observed result returns to the owner, and their next intent goes back into the process. This loop is not the same as retrying a failed check." },
  { step: 1, edge: "0-1", label: "Next increment / approved before implementation", caption: "The owner approves new examples requiring every duplicated product to be named. Start a new implementation session against that approved baseline. The next golden path begins." },
];

export function createPlayback({ onChange, schedule = setTimeout, cancel = clearTimeout, reducedMotion = false }) {
  let index = 0;
  let playing = false;
  let timer = null;
  const state = () => ({ index, scene: scenes[index], playing, reducedMotion });
  const emit = () => onChange(state());
  function stop() {
    if (timer !== null) cancel(timer);
    timer = null;
    playing = false;
  }
  function tick() {
    timer = null;
    index++;
    if (index === scenes.length - 1) playing = false;
    emit();
    if (playing) timer = schedule(tick, 6000);
  }
  function play() {
    if (playing || reducedMotion) return;
    if (index === scenes.length - 1) index = 0;
    playing = true;
    emit();
    timer = schedule(tick, 6000);
  }
  emit();
  return {
    state,
    play,
    pause() { stop(); emit(); },
    replay() { stop(); index = 0; emit(); play(); },
    next() { stop(); index = (index + 1) % scenes.length; emit(); },
    select(step) {
      if (!Number.isInteger(step) || step < 0 || step > 5) throw new RangeError("Story step must be between 0 and 5");
      stop();
      index = scenes.findIndex(scene => scene.step === step);
      emit();
    },
    setReducedMotion(value) {
      reducedMotion = value;
      if (reducedMotion) stop();
      emit();
    },
  };
}
