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

test("the story distinguishes repair, repository review, owner feedback and the next approved increment", () => {
  assert.deepEqual(scenes.map(scene => scene.step), [0, 1, 2, 3, 2, 3, 4, 5, 0, 1]);
  assert.equal(scenes[4].edge, "repair");
  assert.match(scenes[4].caption, /owner's approval/);
  assert.match(scenes[6].caption, /person reviews/);
  assert.match(scenes[7].caption, /Also name every duplicated product/);
  assert.equal(scenes[8].edge, "loop");
  assert.match(scenes[9].caption, /owner approves new examples/);
  for (const scene of scenes) assert.ok(scene.caption.split(/\s+/).length <= 40, "Captions must stay short");
});
test("playback is opt-in, advances exactly once per scene, and stops at the next approved increment", () => {
  const { playback, timers, tick, changes } = fixture();
  assert.equal(timers.size, 0);
  assert.equal(playback.state().playing, false);
  playback.play();
  playback.play();
  assert.equal(timers.size, 1);
  for (let index = 1; index < scenes.length; index++) {
    tick();
    assert.equal(playback.state().index, index);
  }
  assert.equal(timers.size, 0);
  assert.equal(playback.state().playing, false);
  assert.deepEqual(changes.slice(2).map(state => state.index), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
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
test("manual step selection and next-scene navigation pause playback and reject invalid steps", () => {
  const { playback, timers } = fixture();
  playback.play();
  playback.select(3);
  assert.equal(timers.size, 0);
  assert.equal(playback.state().scene.step, 3);
  assert.equal(playback.state().index, 3);
  playback.next();
  assert.equal(playback.state().scene.step, 2);
  assert.equal(playback.state().scene.edge, "repair");
  for (const value of [-1, 6, 0.5, undefined]) assert.throws(() => playback.select(value), RangeError);
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
