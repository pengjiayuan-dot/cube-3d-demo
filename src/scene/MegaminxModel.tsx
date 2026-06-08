import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  DoubleSide,
  Group,
  Quaternion,
  Shape,
  ShapeGeometry,
  Vector3,
  CircleGeometry,
} from "three";

type FaceSpec = {
  normal: Vector3;
  color: string;
  label: string;
};

const FACE_COLORS = [
  "#f8fafc",
  "#f43f5e",
  "#22c55e",
  "#3b82f6",
  "#f97316",
  "#facc15",
  "#a855f7",
  "#14b8a6",
  "#ec4899",
  "#84cc16",
  "#06b6d4",
  "#fb7185",
];

function createPentagonShape(radius: number) {
  const shape = new Shape();

  for (let index = 0; index < 5; index += 1) {
    const angle = Math.PI / 2 + (index * Math.PI * 2) / 5;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    if (index === 0) {
      shape.moveTo(x, y);
    } else {
      shape.lineTo(x, y);
    }
  }

  shape.closePath();
  return shape;
}

function lineCircleIntersection(A: Vector3, B: Vector3, R: number): Vector3 | null {
  const dx = B.x - A.x;
  const dy = B.y - A.y;
  const a = dx * dx + dy * dy;
  const b = 2 * (A.x * dx + A.y * dy);
  const c = A.x * A.x + A.y * A.y - R * R;
  const det = b * b - 4 * a * c;
  if (det < 0) return null;
  const t = (-b - Math.sqrt(det)) / (2 * a);
  if (t >= 0 && t <= 1) {
    return new Vector3(A.x + t * dx, A.y + t * dy, 0);
  }
  return null;
}

function shrinkShape(shape: Shape, scale: number) {
  const pts = shape.getPoints(8);
  let cx = 0, cy = 0;
  for (const p of pts) {
    cx += p.x;
    cy += p.y;
  }
  cx /= pts.length;
  cy /= pts.length;

  const newShape = new Shape();
  for (let i = 0; i < pts.length; i++) {
    const nx = cx + (pts[i].x - cx) * scale;
    const ny = cy + (pts[i].y - cy) * scale;
    if (i === 0) newShape.moveTo(nx, ny);
    else newShape.lineTo(nx, ny);
  }
  newShape.closePath();
  return newShape;
}

function createCornerShape(R: number, t: number, Rc: number) {
  const shape = new Shape();
  const angle = (Math.PI * 2) / 5;
  const v0 = new Vector3(R, 0, 0);
  const v1 = new Vector3(Math.cos(angle) * R, Math.sin(angle) * R, 0);
  const v4 = new Vector3(Math.cos(-angle) * R, Math.sin(-angle) * R, 0);

  const p1 = new Vector3().lerpVectors(v0, v1, t);
  const p4 = new Vector3().lerpVectors(v0, v4, t);
  const pInner = new Vector3().addVectors(p1, p4).sub(v0);

  const i1 = lineCircleIntersection(p1, pInner, Rc);
  const i2 = lineCircleIntersection(p4, pInner, Rc);

  shape.moveTo(v0.x, v0.y);
  shape.lineTo(p1.x, p1.y);
  if (i1 && i2) {
    shape.lineTo(i1.x, i1.y);
    const a1 = Math.atan2(i1.y, i1.x);
    const a2 = Math.atan2(i2.y, i2.x);
    shape.absarc(0, 0, Rc, a1, a2, true);
    shape.lineTo(p4.x, p4.y);
  } else {
    shape.lineTo(pInner.x, pInner.y);
    shape.lineTo(p4.x, p4.y);
  }
  return shrinkShape(shape, 0.94);
}

function createEdgeShape(R: number, t: number) {
  const shape = new Shape();
  const angle = (Math.PI * 2) / 5;
  const v0 = new Vector3(R, 0, 0);
  const v1 = new Vector3(Math.cos(angle) * R, Math.sin(angle) * R, 0);
  const v2 = new Vector3(Math.cos(angle * 2) * R, Math.sin(angle * 2) * R, 0);
  const v4 = new Vector3(Math.cos(-angle) * R, Math.sin(-angle) * R, 0);

  // Apex (outer tip): midpoint of pentagon edge v0 -> v1.
  const M = new Vector3().lerpVectors(v0, v1, 0.5);

  // Waist directions: parallel to the slant edges of the two adjacent corner blocks.
  // Corner at v0: slant edge p1 -> pInner has direction (v4 - v0).
  // Corner at v1: slant edge has direction (v2 - v1).
  const d1 = new Vector3().subVectors(v4, v0).normalize();
  const d2 = new Vector3().subVectors(v2, v1).normalize();

  // Anchor: base endpoints lie on the same circle as the corners' pInner vertices.
  const p1 = new Vector3().lerpVectors(v0, v1, t);
  const p4 = new Vector3().lerpVectors(v0, v4, t);
  const pInner = new Vector3().addVectors(p1, p4).sub(v0);
  const Ri = pInner.length();

  // Solve |M + s * d| = Ri, take the nearer (smaller positive) root.
  const c = M.lengthSq() - Ri * Ri;
  const b1 = M.dot(d1);
  const s1 = -b1 - Math.sqrt(Math.max(b1 * b1 - c, 0));
  const b2 = M.dot(d2);
  const s2 = -b2 - Math.sqrt(Math.max(b2 * b2 - c, 0));

  const baseA = new Vector3(M.x + s1 * d1.x, M.y + s1 * d1.y, 0);
  const baseB = new Vector3(M.x + s2 * d2.x, M.y + s2 * d2.y, 0);

  shape.moveTo(M.x, M.y);
  shape.lineTo(baseB.x, baseB.y);
  shape.lineTo(baseA.x, baseA.y);
  shape.closePath();

  return shrinkShape(shape, 0.94);
}

function buildFaceSpecs() {
  const phi = (1 + Math.sqrt(5)) / 2;
  const rawNormals = [
    [0, 1, phi],
    [0, -1, phi],
    [0, 1, -phi],
    [0, -1, -phi],
    [1, phi, 0],
    [-1, phi, 0],
    [1, -phi, 0],
    [-1, -phi, 0],
    [phi, 0, 1],
    [-phi, 0, 1],
    [phi, 0, -1],
    [-phi, 0, -1],
  ];

  return rawNormals.map(([x, y, z], index) => ({
    normal: new Vector3(x, y, z).normalize(),
    color: FACE_COLORS[index],
    label: `face-${index + 1}`,
  }));
}

export function MegaminxFace({ face, index }: { face: FaceSpec; index: number }) {
  const rotation = useMemo(() => {
    return new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), face.normal);
  }, [face.normal]);
  const position = useMemo(() => face.normal.clone().multiplyScalar(1.46), [face.normal]);

  const outerGeometry = useMemo(() => new ShapeGeometry(createPentagonShape(0.72)), []);

  const centerRadius = 0.19;
  const stickerRadius = 0.64;
  const t = 0.4;

  const centerGeometry = useMemo(() => new CircleGeometry(centerRadius * 0.94, 32), []);
  const cornerGeometry = useMemo(() => new ShapeGeometry(createCornerShape(stickerRadius, t, centerRadius)), []);
  const edgeGeometry = useMemo(() => new ShapeGeometry(createEdgeShape(stickerRadius, t)), []);

  return (
    <group name={face.label} position={position} quaternion={rotation}>
      <mesh geometry={outerGeometry}>
        <meshStandardMaterial color="#020617" roughness={0.82} metalness={0.18} side={DoubleSide} />
      </mesh>
      
      {/* Center piece */}
      <mesh name="center" geometry={centerGeometry} position={[0, 0, 0.026]}>
        <meshStandardMaterial color={face.color} roughness={0.45} metalness={0.04} side={DoubleSide} />
      </mesh>

      {/* Corners and Edges */}
      {Array.from({ length: 5 }).map((_, i) => (
        <group key={i} rotation={[0, 0, Math.PI / 2 + (Math.PI * 2 / 5) * -i]}>
          <mesh name={`corner-${i}`} geometry={cornerGeometry} position={[0, 0, 0.026]}>
            <meshStandardMaterial color={face.color} roughness={0.45} metalness={0.04} side={DoubleSide} />
          </mesh>
          <mesh name={`edge-${i}`} geometry={edgeGeometry} position={[0, 0, 0.026]}>
            <meshStandardMaterial color={face.color} roughness={0.45} metalness={0.04} side={DoubleSide} />
          </mesh>
        </group>
      ))}

      {/* Center cap mechanism piece */}
      <mesh position={[0, 0, -0.022]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.68, 0.62, 0.08, 5, 1, false, Math.PI / 5]} />
        <meshStandardMaterial color={index % 2 === 0 ? "#101827" : "#111f2e"} roughness={0.9} />
      </mesh>
    </group>
  );
}

export function MegaminxModel() {
  const groupRef = useRef<Group>(null);
  const faces = useMemo(buildFaceSpecs, []);

  useFrame((_, delta) => {
    if (!groupRef.current) {
      return;
    }

    groupRef.current.rotation.y += delta * 0.22;
    groupRef.current.rotation.x = -0.18;
  });

  return (
    <group ref={groupRef} rotation={[0.18, -0.35, 0.1]}>
      <mesh>
        <dodecahedronGeometry args={[1.23, 0]} />
        <meshStandardMaterial color="#08111f" roughness={0.92} metalness={0.12} />
      </mesh>
      {faces.map((face, index) => (
        <MegaminxFace key={face.label} face={face} index={index} />
      ))}
    </group>
  );
}
