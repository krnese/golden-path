import assert from "node:assert/strict";
import { test } from "node:test";
import { createPlayback, scenes } from "../story.js";

function fixture(reducedMotion = false) {
  const timers = new Map();
  const changes = [];
  let nextId = 0;
  const playback = createPlayback({
    reducedMotion,
    onChange: state => changes.push(state),
    schedule: (callback, delay) => { const id = ++nextId; timers.set(id, { callback, delay }); return id; },
    cancel: id => timers.delete(id),
  });
  return {
    playback, timers, changes,
    tick() {
      assert.equal(timers.size, 1);
      const [id, timer] = timers.entries().next().value;
      assert.equal(timer.delay, 6000);
      timers.delete(id);
      timer.callback();
    },
  };
}

test("six visible stages each have one short caption, with repair and feedback inside their stages", () => {
  assert.deepEqual(scenes.map(scene => scene.step), [0, 1, 2, 3, 4, 5]);
  assert.deepEqual(scenes[3].phases, ["fail", "repair", "pass"]);
  assert.match(scenes[3].caption, /approved examples stay fixed/);
  assert.match(scenes[4].caption, /a person govern/);
  assert.match(scenes[5].caption, /Also name every duplicated product/);
  assert.deepEqual(scenes[5].phases, ["result", "feedback", "next-approved"]);
  for (const scene of scenes) assert.ok(scene.caption.split(/\s+/).length <= 32, "Captions must stay short");
});
test("playback is opt-in, visits each moment once and stops after the owner approves the next increment", () => {
  const { playback, timers, tick, changes } = fixture();
  assert.equal(timers.size, 0);
  assert.equal(playback.state().playing, false);
  playback.play();
  playback.play();
  assert.equal(timers.size, 1);
  const moments = scenes.flatMap(scene => scene.phases.map(phase => ({ index: scene.step, phase })));
  for (const moment of moments.slice(1)) {
    tick();
    assert.equal(playback.state().index, moment.index);
    assert.equal(playback.state().phase, moment.phase);
  }
  assert.equal(timers.size, 0);
  assert.equal(playback.state().playing, false);
  assert.deepEqual(changes.slice(2).map(state => ({ index: state.index, phase: state.phase })), moments.slice(1));
});
test("pause cancels advancement, resume keeps the current scene, and replay restarts", () => {
  const { playback, timers, tick } = fixture();
  playback.play();
  tick();
  playback.pause();
  assert.equal(timers.size, 0);
  assert.equal(playback.state().index, 1);
  playback.play();
  tick();
  assert.equal(playback.state().index, 2);
  playback.replay();
  assert.equal(playback.state().index, 0);
  assert.equal(timers.size, 1);
  playback.pause();
});
test("manual selection and next-moment navigation pause playback and reject invalid stages", () => {
  const { playback, timers } = fixture();
  playback.play();
  playback.select(3);
  assert.equal(timers.size, 0);
  assert.equal(playback.state().scene.step, 3);
  assert.equal(playback.state().index, 3);
  assert.equal(playback.state().phase, "fail");
  const caption = playback.state().scene.caption;
  playback.next();
  assert.equal(playback.state().scene.step, 3);
  assert.equal(playback.state().phase, "repair");
  assert.equal(playback.state().scene.caption, caption);
  playback.next();
  assert.equal(playback.state().phase, "pass");
  assert.equal(playback.state().scene.caption, caption);
  playback.next();
  assert.equal(playback.state().index, 4);
  for (const value of [-1, 6, 0.5, undefined]) assert.throws(() => playback.select(value), RangeError);
});
test("owner feedback starts the next approved round without inventing additional numbered stages", () => {
  const { playback, timers } = fixture();
  playback.select(5);
  assert.equal(playback.state().phase, "result");
  const caption = playback.state().scene.caption;
  playback.next();
  assert.equal(playback.state().phase, "feedback");
  playback.next();
  assert.equal(playback.state().phase, "next-approved");
  assert.equal(playback.state().index, 5);
  assert.equal(playback.state().scene.caption, caption);
  assert.equal(timers.size, 0);
  playback.next();
  assert.equal(playback.state().index, 0);
  assert.equal(playback.state().phase, "request");
});
test("reduced motion never schedules animation, including replay and live preference changes", () => {
  const { playback, timers, tick } = fixture(true);
  playback.play();
  playback.replay();
  assert.equal(timers.size, 0);
  playback.next();
  assert.equal(playback.state().index, 1);
  playback.setReducedMotion(false);
  playback.play();
  tick();
  playback.setReducedMotion(true);
  assert.equal(timers.size, 0);
  assert.equal(playback.state().playing, false);
  playback.select(5);
  assert.equal(playback.state().scene.step, 5);
  playback.replay();
  assert.equal(playback.state().index, 0);
  assert.equal(timers.size, 0);
});
