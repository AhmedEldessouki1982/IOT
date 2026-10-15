import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { TimerPersistenceService } from "../dist/timers/timer-persistence.service.js";
test("timer persistence reads legacy and duration-bearing JSON entries", async () => {
  const dir = await mkdtemp(join(tmpdir(), "iot-timers-"));
  try {
    const legacy = {deviceId:"old-g1",gang:1,expiresAt:"2030-01-01T00:00:00Z"};
    const current = {...legacy,deviceId:"new-g1",durationSeconds:600};
    await writeFile(join(dir,"timers.json"), JSON.stringify([legacy,current]));
    const persistence = new TimerPersistenceService({get:()=>dir});
    await persistence.onModuleInit();
    assert.deepEqual(persistence.getSnapshot(), [legacy,current]);
  } finally { await rm(dir,{recursive:true,force:true}); }
});
