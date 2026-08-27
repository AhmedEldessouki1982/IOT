import type { CSSProperties } from "react";
import {
  DEVICES_2D,
  DOORS,
  ENVELOPE,
  FURNITURE,
  GRID,
  ROOMS_2D,
  WALLS,
  WINDOWS,
} from "./config/apartment";
import type { Footprint } from "./config/apartment";
import type { DevicePlacement } from "./types";
import { useMergedState } from "./hooks/useDeviceState";
import { Device, toCanonicalKind, type DeviceProps } from "../features/devices";

/* ============================================================== geometry */

/** Split [from,to] into solid runs minus door gaps. */
function solidRuns(
  from: number,
  to: number,
  gaps?: Array<[number, number]>,
): Array<[number, number]> {
  const runs: Array<[number, number]> = [];
  let cur = from;
  const sorted = [...(gaps ?? [])].sort((a, b) => a[0] - b[0]);
  for (const [a, b] of sorted) {
    if (a > cur) runs.push([cur, Math.min(a, to)]);
    cur = Math.max(cur, b);
  }
  if (cur < to) runs.push([cur, to]);
  return runs;
}

interface Pt {
  x: number;
  z: number;
}

/**
 * Quarter-circle door swing: hinge H, closed-leaf tip C (the far gap end),
 * open-leaf tip P = C rotated 90° about H toward `into`. Returns the arc +
 * open leaf line as one path.
 */
function doorPath(
  axis: "x" | "z",
  at: number,
  gap: [number, number],
  into: 1 | -1,
  hingeAtEnd: boolean,
): string {
  const hx = hingeAtEnd ? gap[1] : gap[0];
  const cx = hingeAtEnd ? gap[0] : gap[1];
  const H: Pt = axis === "x" ? { x: hx, z: at } : { x: at, z: hx };
  const C: Pt = axis === "x" ? { x: cx, z: at } : { x: at, z: cx };
  const dx = C.x - H.x;
  const dz = C.z - H.z;
  // two 90° rotation candidates; keep the one swinging toward `into`
  const cands: Pt[] = [
    { x: H.x - dz, z: H.z + dx },
    { x: H.x + dz, z: H.z - dx },
  ];
  const P =
    cands.find((pt) =>
      axis === "x"
        ? Math.sign(pt.z - C.z || into) === into
        : Math.sign(pt.x - C.x || into) === into,
    ) ?? cands[0];
  const r = Math.abs(gap[1] - gap[0]);
  const cross = (C.x - H.x) * (P.z - H.z) - (C.z - H.z) * (P.x - H.x);
  const sweep = cross > 0 ? 1 : 0;
  return [
    `M ${C.x} ${C.z}`,
    `A ${r} ${r} 0 0 ${sweep} ${P.x} ${P.z}`,
    `M ${H.x} ${H.z}`,
    `L ${P.x} ${P.z}`,
  ].join(" ");
}

function footprintEl(fp: Footprint, key: string) {
  if (fp.kind === "round") {
    return (
      <circle key={key} cx={fp.x} cy={fp.z} r={(fp.w ?? 0.4) / 2} className="fp-furn">
        {fp.label && <title>{fp.label}</title>}
      </circle>
    );
  }
  return (
    <rect
      key={key}
      x={-(fp.w ?? 0.5) / 2}
      y={-(fp.d ?? 0.5) / 2}
      width={fp.w ?? 0.5}
      height={fp.d ?? 0.5}
      rx={0.05}
      transform={`translate(${fp.x} ${fp.z})${fp.rot ? ` rotate(${fp.rot})` : ""}`}
      className="fp-furn"
    >
      {fp.label && <title>{fp.label}</title>}
    </rect>
  );
}

/* ============================================================ device node */

function DeviceNode({
  placement,
  selected,
  onSelect,
}: {
  placement: DevicePlacement;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const s = useMergedState(placement.deviceId, placement.kind);
  const [x, , z] = placement.position;
  const rot = placement.rotationY ?? 0;

  const kind = toCanonicalKind(placement);
  const glyph = (
    <Device
      {...({
        kind,
        variant: "floorplan",
        state: s,
        rot,
        width: placement.width,
      } as DeviceProps)}
    />
  );

  const hitR = placement.kind === "curtains" ? Math.max(0.3, (placement.width ?? 1.8) / 3) : 0.42;

  return (
    <g transform={`translate(${x} ${z})`} className="fp-device">
      {glyph}
      {selected && <circle r={hitR + 0.14} className="fp-selring" />}
      <circle
        r={hitR}
        className="fp-hit"
        onClick={(e) => {
          e.stopPropagation();
          onSelect(placement.deviceId);
        }}
      >
        <title>{placement.name}</title>
      </circle>
    </g>
  );
}

/* =============================================================== root */

interface FloorplanProps {
  selectedId: string | null;
  focusedRoomId: string | null;
  onSelect: (id: string | null) => void;
  onRoomFocus: (id: string | null) => void;
}

export function Floorplan({ selectedId, focusedRoomId, onSelect, onRoomFocus }: FloorplanProps) {
  const M = 0.55; // viewBox margin
  const vb = `${-M} ${-M} ${ENVELOPE.w + 2 * M} ${ENVELOPE.d + 2 * M}`;

  return (
    <svg
      viewBox={vb}
      className="fp-svg"
      role="img"
      aria-label="apartment floorplan"
      onClick={() => onSelect(null)}
    >
      <defs>
        <pattern id="fp-grid" width={GRID} height={GRID} patternUnits="userSpaceOnUse">
          <path d={`M ${GRID} 0 L 0 0 0 ${GRID}`} fill="none" className="fp-gridline" strokeWidth={0.014} />
        </pattern>
        {ROOMS_2D.map((room) => (
          <radialGradient
            key={room.id}
            id={`fp-floor-${room.id}`}
            cx="50%"
            cy="38%"
            r="72%"
            gradientUnits="objectBoundingBox"
          >
            <stop offset="0%" stopColor={room.color} stopOpacity="0.22" />
            <stop offset="62%" stopColor={room.color} stopOpacity="0.13" />
            <stop offset="100%" stopColor={room.color} stopOpacity="0.02" />
          </radialGradient>
        ))}
      </defs>

      <rect x={-M} y={-M} width={ENVELOPE.w + 2 * M} height={ENVELOPE.d + 2 * M} className="fp-paper" />
      <rect x={0} y={0} width={ENVELOPE.w} height={ENVELOPE.d} fill="url(#fp-grid)" />

      {/* rooms — floor + furniture + label chip share the room accent color */}
      {ROOMS_2D.map((room) => {
        const [x0, z0, x1, z1] = room.bounds;
        const cx = (x0 + x1) / 2;
        const dimmed = focusedRoomId !== null && focusedRoomId !== room.id;
        const focused = focusedRoomId === room.id;
        const area = ((x1 - x0) * (z1 - z0)).toFixed(1);
        return (
          <g
            key={room.id}
            className="fp-roomgroup"
            style={{ "--room": room.color } as CSSProperties}
            data-dim={dimmed}
            data-focus={focused}
          >
            <rect
              x={x0}
              y={z0}
              width={x1 - x0}
              height={z1 - z0}
              rx={0.16}
              className="fp-floor"
              fill={`url(#fp-floor-${room.id})`}
              onClick={(e) => {
                e.stopPropagation();
                onRoomFocus(focused ? null : room.id);
              }}
            />
            <g className="fp-furnlayer">
              {(FURNITURE[room.id] ?? []).map((fp, i) => footprintEl(fp, `${room.id}-${i}`))}
            </g>
            <g className="fp-chip" pointerEvents="none">
              <rect
                x={cx - 0.55}
                y={z0 + 0.12}
                width={1.1}
                height={0.74}
                rx={0.1}
                className="fp-labelchip"
              />
              <text
                x={cx}
                y={z0 + 0.44}
                textAnchor="middle"
                className="fp-roomname"
              >
                {room.name.toUpperCase()}
              </text>
              <text
                x={cx}
                y={z0 + 0.72}
                textAnchor="middle"
                className="fp-roomarea"
              >
                {area} m²
              </text>
            </g>
          </g>
        );
      })}

      {/* windows — casing stroke under a bright glass core */}
      <g className="fp-windows">
        {WINDOWS.flatMap((w, i) =>
          w.axis === "x" ? (
            <g key={`win${i}`}>
              <line x1={w.from} y1={w.at} x2={w.to} y2={w.at} className="fp-window-casing" />
              <line x1={w.from} y1={w.at} x2={w.to} y2={w.at} className="fp-window-core" />
            </g>
          ) : (
            <g key={`win${i}`}>
              <line x1={w.at} y1={w.from} x2={w.at} y2={w.to} className="fp-window-casing" />
              <line x1={w.at} y1={w.from} x2={w.at} y2={w.to} className="fp-window-core" />
            </g>
          ),
        )}
      </g>

      {/* doors — swing arc, leaf and hinge pin */}
      <g className="fp-doors">
        {DOORS.map((d, i) => {
          const hingeX = d.axis === "x" ? (d.hingeAtEnd ? d.gap[1] : d.gap[0]) : d.at;
          const hingeZ = d.axis === "x" ? d.at : d.hingeAtEnd ? d.gap[1] : d.gap[0];
          return (
            <g key={`door${i}`}>
              <path d={doorPath(d.axis, d.at, d.gap, d.into, d.hingeAtEnd)} className="fp-door" />
              <circle cx={hingeX} cy={hingeZ} r={0.05} className="fp-hinge" />
            </g>
          );
        })}
      </g>

      {/* walls on top */}
      <g className="fp-walls">
        {WALLS.flatMap((w, i) =>
          solidRuns(w.from, w.to, w.gaps).map(([a, b], j) =>
            w.axis === "x" ? (
              <line key={`w${i}-${j}`} x1={a} y1={w.at} x2={b} y2={w.at} className="fp-wall" />
            ) : (
              <line key={`w${i}-${j}`} x1={w.at} y1={a} x2={w.at} y2={b} className="fp-wall" />
            ),
          ),
        )}
      </g>

      {/* entrance marker */}
      <text x={0.34} y={3.4} className="fp-entrylabel" transform="rotate(-90 0.34 3.4)">
        MAIN ENTRY
      </text>

      {/* devices */}
      <g>
        {DEVICES_2D.map((d) => (
          <DeviceNode
            key={d.deviceId}
            placement={d}
            selected={selectedId === d.deviceId}
            onSelect={(id) => {
              onSelect(id);
            }}
          />
        ))}
      </g>

      {/* compass + scale */}
      <g className="fp-chrome">
        <circle cx={ENVELOPE.w + 0.24} cy={0.55} r={0.26} className="fp-compassdisc" />
        <path
          d={`M ${ENVELOPE.w + 0.24} 0.36 l -0.07 0.28 l 0.07 -0.08 l 0.07 0.08 Z`}
          className="fp-compass-arrow"
        />
        <text x={ENVELOPE.w + 0.24} y={0.98} textAnchor="middle" className="fp-compass">
          N
        </text>
        <line x1={0} y1={ENVELOPE.d + 0.3} x2={1} y2={ENVELOPE.d + 0.3} className="fp-scalebar" />
        <line x1={0} y1={ENVELOPE.d + 0.22} x2={0} y2={ENVELOPE.d + 0.38} className="fp-scalebar" />
        <line x1={1} y1={ENVELOPE.d + 0.22} x2={1} y2={ENVELOPE.d + 0.38} className="fp-scalebar" />
        <text x={1.12} y={ENVELOPE.d + 0.35} className="fp-scalelabel">
          1 m
        </text>
      </g>
    </svg>
  );
}
