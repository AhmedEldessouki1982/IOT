import { RoundedBox } from "@react-three/drei";
import { FURNITURE } from "../../config/apartment";
import type { FurniturePiece } from "../../config/apartment";

function Piece({ p }: { p: FurniturePiece }) {
  const material = (
    <meshStandardMaterial
      color={p.color}
      roughness={p.roughness ?? 0.8}
      metalness={p.metalness ?? 0}
    />
  );

  if (p.shape === "cylinder") {
    const r = p.radius ?? 0.2;
    return (
      <mesh castShadow receiveShadow position={p.position}>
        <cylinderGeometry args={[r, r, p.height ?? 0.5, 24]} />
        {material}
      </mesh>
    );
  }

  if (p.shape === "roundedBox") {
    return (
      <RoundedBox
        castShadow
        receiveShadow
        args={(p.size ?? [1, 1, 1]) as [number, number, number]}
        radius={0.04}
        smoothness={3}
        position={p.position}
        rotation={[0, p.rotationY ?? 0, 0]}
      >
        {material}
      </RoundedBox>
    );
  }

  return (
    <mesh castShadow receiveShadow position={p.position} rotation={[0, p.rotationY ?? 0, 0]}>
      <boxGeometry args={(p.size ?? [1, 1, 1]) as [number, number, number]} />
      {material}
    </mesh>
  );
}

export function Furniture({ roomId }: { roomId: string }) {
  return (
    <group>
      {(FURNITURE[roomId] ?? []).map((p, i) => (
        <Piece key={`${roomId}-${i}`} p={p} />
      ))}
    </group>
  );
}
