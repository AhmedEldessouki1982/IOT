import { test } from "node:test";
import assert from "node:assert/strict";
import { idleTransition, DEFAULT_IDLE_MINUTES } from "../src/hooks/idleMachine.js";
test("idle is opt-in and defaults to five minutes", () => {
  assert.equal(DEFAULT_IDLE_MINUTES, 5);
  assert.deepEqual(idleTransition("awake", "timeout", false), {state:"awake",consume:false});
  assert.equal(idleTransition("awake", "timeout").state, "asleep");
});
test("the complete first pointer gesture cannot reach underlying controls", () => {
  let state = "asleep";
  for (const event of ["pointerdown", "mousedown", "pointerup", "mouseup", "click"]) {
    const next = idleTransition(state,event);
    assert.equal(next.consume,true,event);
    state = next.state;
  }
  assert.equal(state,"awake");
  assert.equal(idleTransition(state,"click").consume,false);
});
test("touch emulation and keyboard wake events are consumed through completion", () => {
  for (const events of [["pointerdown","touchstart","pointerup","touchend","click"],["keydown","keydown","keyup"]]) {
    let state = "asleep";
    for(const event of events) { const next=idleTransition(state,event); assert.equal(next.consume,true); state=next.state; }
    assert.equal(state,"awake");
  }
});
test("cancellation releases suppression and ordinary activity does not sleep", () => {
  assert.equal(idleTransition("waking","pointercancel").state,"awake");
  assert.equal(idleTransition("awake","activity").state,"awake");
});
test("a second finger cannot activate a control while the wake gesture completes", () => {
  assert.deepEqual(idleTransition("waking", "click", true, 1), {state:"waking",consume:true});
  assert.deepEqual(idleTransition("waking", "click", true, 0), {state:"awake",consume:true});
});
