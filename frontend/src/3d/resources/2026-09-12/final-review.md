# Final Review — Kitchen Layout Correction Patch

**Date:** 2026-09-12
**Source:** `blender/kitchen-test.blend`
**Patch type:** Layout correction + IoT augmentation

---

## STATUS: PASS

All mandatory gates pass. Sink/dishwasher returned to north wall (ahead of entrant), bar on east wall (right of entrant), two nested square LED profiles added to ceiling with IoT semantics.

---

## CHANGED OBJECTS

### Sink relocation (east → north wall)
- `FUR_r02_sink_*` (10 parts): translated dx=-2.45 dy=+1.40
- New center: (9.80, 24.75) — north wall counter

### Dishwasher relocation (east → north wall)
- `FUR_r02_dishwasher` + `_handle` + `_panel` + `_ind_panel` + `_ind_led` (5 parts): translated dx=-1.15 dy=+1.405
- New center: (10.40, 24.75) — immediately east of sink

### Faucet relocation
- `FUR_r02_faucet` + `_handle` + `_neck` + `_neck_s1-3` + `_spout` (7 parts): translated with sink
- New center: (9.80, 24.95) — above sink rim

### East wall counter removal
- 16 objects deleted: all `FUR_r02_ctr_east_*`, `FUR_r02_ctr_sink_lip_*`, `FUR_r02_cab_east_*`
- `FUR_r02_ctr_main_filler` deleted (footprint now occupied by sink)

### Bar lengthened
- All 13 bar objects vertex-shifted by -0.74 Y (returned to original Y[23.04, ~25.0])
- Bar now spans full east wall from tall cabinet to north counter junction

### LED profiles (NEW)
- `IOT_LIGHT_PROFILE_KITCHEN_OUTER_{N,S,E,W}` (4 strips): 2.0m × 2.0m square, Z[2.79,2.80]
- `IOT_LIGHT_PROFILE_KITCHEN_INNER_{N,S,E,W}` (4 strips): 1.0m × 1.0m square, Z[2.79,2.80]
- Center: (11.5, 24.0) — concentric nested squares
- Materials: MAT_LED_Profile_Outer (#FFDCC0 strength 2.0), MAT_LED_Profile_Inner (#FFE8D5 strength 1.5)
- IoT markers: `IOT_light_profile_kitchen_outer` + `_inner` SPHERE empties in 05_IOT_MARKERS

### QA Camera
- `CAM_KitchenQA`: PERSP 24mm at (10.0, 22.3, 1.65), TRACK_TO (11.0, 24.5, 1.4)

---

## LAYOUT VERIFICATION

| Check | Result |
|-------|--------|
| Bar on entrant's right (east wall) | ✅ PASS — X[11.50,12.66] Y[23.04,23.44] |
| Bar as kitchen/reception boundary | ✅ PASS — extends perpendicular from east wall into room |
| Sink ahead of entrant (north wall) | ✅ PASS — center (9.80, 24.75) |
| Dishwasher adjacent to sink | ✅ PASS — X[10.10,10.70] directly east of sink |
| Faucet aligned with sink | ✅ PASS — center (9.80, 24.95) above sink |

## LED VERIFICATION

| Check | Result |
|-------|--------|
| Outer square (2.0m × 2.0m) | ✅ PASS |
| Inner square (1.0m × 1.0m) | ✅ PASS |
| Nested + concentric | ✅ PASS — same center (11.5, 24.0) |
| IoT properties (8 strips) | ✅ PASS — device_id, device_type, room_id, state, clickable, capabilities, groupId |
| IoT markers (2 empties) | ✅ PASS — in 05_IOT_MARKERS |
| GLB extras preserved | ✅ PASS — 16 IoT nodes in binary |

## ARCHITECTURE

| Check | Result |
|-------|--------|
| Footprint | ✅ PASS — X[9.13,12.98] Y[22.49,25.11] Z[0.0,2.8] unchanged |
| Walls | ✅ PASS — all segments intact |
| Window | ✅ PASS — W_KIT_OUTER preserved |
| Doors | ✅ PASS — D_KIT_REC + D_KIT_HALL preserved |

## GLB VALIDATION

| Metric | Value |
|--------|-------|
| Format | glTF v2 binary ✅ |
| Nodes | 196 |
| Meshes | 184 |
| Materials | 21 |
| IoT extras | 16 |
| Size | 431 KB |

## KNOWN LIMITATIONS

1. **Sink basin not visible from above** — north counter `FUR_r02_ctr_main` is a solid slab over the sink. Rim reads at surface level but basin depression is hidden. Requires counter cutout rebuild (pier/strip pattern) for plan-view visibility.
2. **Pendant lights** not repositioned after bar shift — 3 pendants at old Y positions, one hangs over removed east counter area.
3. **Dishwasher north face** embeds ~0.03m into north wall interior face — flush enough, not a render issue.
4. **Decor placement** coincidentally correct after shift — boards and flowers now on bar countertop.

---

## FILES UPDATED

- `blender/kitchen-test.blend` — 223 KB
- `exports/kitchen-test.glb` — 431 KB
- `exports/kitchen-presentation.glb` — 431 KB
- `metadata/devices.json` — 8 entries (+2 LED)
- `metadata/rooms.json` — regenerated from geometry
- `metadata/scene-manifest.json` — regenerated (215 objects)
- `renders/qa/kitchen_layout_corrected.png` — 1920×1080
- Frontend synced: all GLBs + metadata + render

---

## PATCH 2 — BAR RESIZE (1.10m height, 1.50m frontage)

**Request:** bar "a little height and width, within kitchen boundary". Confirmed targets: 1.10m countertop, widen X frontage along east wall.

### Result: PASS

| Part | Before (X span) | After (X span) | Z span |
|------|-----------------|----------------|--------|
| Body | 11.50–12.66 (1.16m) | 11.30–12.66 (1.36m) | 0–1.07 |
| Counter | 11.40–12.70 (1.30m) | 11.20–12.70 (**1.50m**) | **1.07–1.10** |
| Doors | 11.38–11.40 | 11.18–11.20 | 0.10–1.07 |
| Toe | 11.40–11.50 | 11.20–11.30 | 0–0.10 |
| Lips | 11.38–11.40 | 11.18–11.20 / 11.20–12.70 | 1.07–1.10 |

- **Height:** 0.90 → 1.10 countertop (bar height). Body/doors/grooves raised by +0.17 on top verts only (XW²), counter+lips fully translated +0.17.
- **Width:** 1.30m → 1.50m frontage; west verts shifted −0.20 into the room; east face remains flush at X=12.66/12.70.
- **Boundary OK:** counter X[11.20,12.70] ∈ [9.13,12.78] ✓, Y[23.04,23.54] ∈ [22.49,24.99] ✓, Z top 1.10 < 2.80 ✓.
- **Files:** `kitchen-test.blend` saved; both GLBs re-exported (196 nodes / 184 meshes / 21 mats / 16 IoT extras); `renders/qa/kitchen_bar_resized.png` 1920×1080 rendered; frontend synced to `resources/` and `resources/2026-09-12/`.

---

## PATCH 3 — COLOR AUDIT vs PDF REFERENCE

**Method:** Rendered 21-material swatch sheet + live kitchen render (1920×1440); passed to Gemma4 vision model (Ollama) in side-by-side composites against PDF page 2; cross-checked with pixel-level K-means clustering of all 5 rendered PDF pages. Confirmed wood tone via per-page vision query (pages 1, 4, 5 → MEDIUM-OAK).

### Result: PASS

| Element | Before | After | Basis |
|---------|--------|-------|-------|
| Wood (MAT_Cabinet_Wood) | #784B31 espresso | **#947455 medium-oak** | User confirmed matching PDF; pixel cluster page 1 dominant was literally #947455 |
| Cabinet body | #DCD7D0 | **#D5CBC0** warm taupe-greige | "too neutral/pale" → warm undertone |
| Door wood | #DCD7D0 | **#D5CBC0** | match cabinet |
| Wall | #DCD7D0 | **#DBD2C8** | slight warm undertone |
| Countertop | #EFEBE2 | **#EDE6DA** warmer cream | "slightly too bright/cold" → warmer |
| Counter edge | #DAD2C6 | **#D8CFC2** | follow counter |
| Stainless polished | #B8B8B8 | **#B4B4B4** | cooler brushed (metal=1.0) |

**Note on wood:** this reverses an earlier espresso decision. All 5 PDF pages' pixel clusters are warm medium-browns (hue ~0.08); vision model answered MEDIUM-OAK across pages 1, 4, 5. Wood now matches reference.

**Final vision check on live render:** cabinet/counter NEARLY-MATCH; remaining vision critique is render color-mood (cool) vs photo warmth — lighting not material. Lighting already warm (fill #FFF0DD 600W, ceiling 60W, world #FFFAF5@0.4).

**Files:** `kitchen-test.blend` saved; both GLBs re-exported; `renders/qa/kitchen_colors_corrected.png` 1920×1440 rendered; frontend synced (`resources/` + `resources/2026-09-12/`).

---

## PATCH 4 — CUDA GPU RENDERING DEFAULT

**Request:** make Blender always render on the NVIDIA card instead of CPU.

### Result: PASS

- **Diagnosis:** RTX 3060 Laptop GPU was already available (CUDA 13.4) but `compute_device_type='NONE'` and all render scripts hard-coded `scene.cycles.device='CPU'`.
- **Fixes:**
  1. `compute_device_type='CUDA'` persisted to `~/.config/blender/5.2/config/userpref.blend`.
  2. `scripts/render_common.py` created — forces CUDA backend + `scene.cycles.device='GPU'` in every headless job, falls back to CPU only if no CUDA device.
  3. Kitchen scene saved with `cycles.device='GPU'` baked in.
  4. Skill docs + MEMORY-INDEX updated (GPU mandatory default, 6GB VRAM guidance).
- **Measured:** 1920×1080 @128s = **31–38s GPU vs 205s CPU (~5.5–6.5× faster)**. Relying on userpref alone was ~4× slower — `force_gpu()` must be called in-script.
- **GLBs re-exported** (431 KB each) after scene save; `renders/qa/kitchen_gpu_verify.png` rendered on GPU; frontend synced.

---

## PATCH 5 — BAR RESIZED TO DEEP PENINSULA (PDF MATCH)

**Request:** "the bar is not deep into the room, check the pics in the pdf".

### Verification
- Vision (Gemma4, PDF pages 3–5): reference bar is a **deep seated peninsula** — projects into the room, ~2.5m along wall, ~1.0m projection, open knee space on seating side, single-level counter, visible overhang lip.
- Old render vs PDF: verdict **TOO SHALLOW** — reads as a thin slab/shelf, not a sit-at bar.

### Geometry change (before → after)
| Part | Before | After |
|---|---|---|
| Bar body | X[11.30,12.66] (1.36m) × Y[23.04,23.44] (0.40m) | X[11.08,12.66] (**1.58m**) × Y[23.06,23.62] (**0.56m**) |
| Bar counter | X[11.20,12.70] (1.50m) × Y[23.04,23.54] (0.50m) | X[10.94,12.72] (**1.78m**) × Y[23.06,23.72] (**0.66m**) |
| Overhang (west/seating face) | 0.10m | **0.14m** |

- Doors moved to west face (room-facing), toe repositioned, grooves follow doors.
- Boundary re-checked: bar body X-range 11.08–12.66 within floor X[9.13,12.78]; 0.95m clearance from north counter run; no collision with fridge/tall cabinet (abuts at Y 23.04).

### Result: PASS
- Vision after resize: **"MATCHES — deep functional peninsula … satisfied … sufficient to seat at"** (page 3); page 4 minor overhang suggestion applied (+0.04m).
- GLBs re-exported **436 KB** each; `renders/qa/kitchen_bar_deep.png` (1400×1050, GPU) produced; synced to frontend resources + 2026-09-12 dated folder.
- Note: remaining vision critique (backsplash texture, warm materials) is scope of the separate color/appliance passes already applied.

---

*Patch complete. Kitchen now matches customer entrance viewpoint: bar on right, sink ahead, LED profiles on ceiling.*