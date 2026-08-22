import { WALLS, WINDOWS, ROOMS, WALL_HEIGHT, WALL_THICKNESS } from "../../config/apartment";
import type { WallRun } from "../../config/apartment";

const WALL_COLOR = "#e7e2d8";

interface Segment {
  center: number;
  length: number;
}

/** Split a wall run into solid segments around its doorway gaps. */
function solidSegments(run: WallRun): Segment[] {
  const gaps = [...(run.gaps ?? [])].sort((a, b) => a[0] - b[0]);
  const segs: Segment[] = [];
  let cursor = run.from;
  for (const [g0, g1] of gaps) {
    if (g0 > cursor) segs.push({ center: (cursor + g0) / 2, length: g0 - cursor });
    cursor = Math.max(cursor, g1);
  }
  if (cursor < run.to) segs.push({ center: (cursor + run.to) / 2, length: run.to - cursor });
  return segs;
}

export function ApartmentShell() {
  return (
    <group>
      {ROOMS.map((r) => {
        const [x0, z0, x1, z1] = r.bounds;
        return (
          <mesh key={r.id} receiveShadow position={[(x0 + x1) / 2, -0.04, (z0 + z1) / 2]}>
            <boxGeometry args={[x1 - x0, 0.08, z1 - z0]} />
            <meshStandardMaterial color={r.floorColor} roughness={0.85} />
          </mesh>
        );
      })}

      {WALLS.flatMap((run, i) =>
        solidSegments(run).map((seg, j) => (
          <mesh
            key={`wall-${i}-${j}`}
            castShadow
            receiveShadow
            position={
              run.axis === "x"
                ? [seg.center, WALL_HEIGHT / 2, run.at]
                : [run.at, WALL_HEIGHT / 2, seg.center]
            }
          >
            <boxGeometry
              args={
                run.axis === "x"
                  ? [seg.length, WALL_HEIGHT, WALL_THICKNESS]
                  : [WALL_THICKNESS, WALL_HEIGHT, seg.length]
              }
            />
            <meshStandardMaterial color={WALL_COLOR} roughness={0.95} />
          </mesh>
        )),
      )}

      {WINDOWS.map((w, i) => {
        const len = w.to - w.from;
        const hgt = w.top - w.sill;
        const mid = (w.from + w.to) / 2;
        const cy = (w.sill + w.top) / 2;
        const horizontal = w.axis === "x";
        return (
          <group
            key={`win-${i}`}
            position={horizontal ? [mid, cy, w.at] : [w.at, cy, mid]}
            rotation={[0, horizontal ? 0 : Math.PI / 2, 0]}
          >
            <mesh>
              <boxGeometry args={[len + 0.12, hgt + 0.12, WALL_THICKNESS + 0.02]} />
              <meshStandardMaterial color="#6b6257" roughness={0.55} />
            </mesh>
            <mesh>
              <boxGeometry args={[len, hgt, WALL_THICKNESS + 0.07]} />
              <meshStandardMaterial
                color="#bcd7e8"
                emissive="#9cc4e0"
                emissiveIntensity={0.3}
                roughness={0.12}
                metalness={0.1}
              />
            </mesh>
          </group>
        );
      })}

      {/* entry door leaf in the south wall, swung open into the corridor */}
      <group position={[-1.9, 0, 3.46]} rotation={[0, -0.5, 0]}>
        <mesh castShadow position={[0.44, 1.03, 0]}>
          <boxGeometry args={[0.86, 2.06, 0.055]} />
          <meshStandardMaterial color="#5d4a38" roughness={0.65} />
        </mesh>
      </group>
    </group>
  );
}
