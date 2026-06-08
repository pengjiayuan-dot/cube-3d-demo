import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  BufferGeometry,
  DoubleSide,
  Group,
  LineBasicMaterial,
  Quaternion,
  Shape,
  ShapeGeometry,
  Vector3,
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

function createPentagonPoints(radius: number, z = 0.035) {
  return Array.from({ length: 5 }, (_, index) => {
    const angle = Math.PI / 2 + (index * Math.PI * 2) / 5;
    return new Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, z);
  });
}

function createRadialLineGeometry(innerRadius: number, outerRadius: number) {
  const points: Vector3[] = [];

  for (let index = 0; index < 5; index += 1) {
    const angle = Math.PI / 2 + (index * Math.PI * 2) / 5;
    points.push(
      new Vector3(Math.cos(angle) * innerRadius, Math.sin(angle) * innerRadius, 0.045),
      new Vector3(Math.cos(angle) * outerRadius, Math.sin(angle) * outerRadius, 0.045),
    );
  }

  return new BufferGeometry().setFromPoints(points);
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

function MegaminxFace({ face, index }: { face: FaceSpec; index: number }) {
  const rotation = useMemo(() => {
    return new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), face.normal);
  }, [face.normal]);
  const position = useMemo(() => face.normal.clone().multiplyScalar(1.46), [face.normal]);

  const outerGeometry = useMemo(() => new ShapeGeometry(createPentagonShape(0.72)), []);
  const stickerGeometry = useMemo(() => new ShapeGeometry(createPentagonShape(0.64)), []);
  const centerGeometry = useMemo(() => new ShapeGeometry(createPentagonShape(0.3)), []);
  const outerLineGeometry = useMemo(() => new BufferGeometry().setFromPoints(createPentagonPoints(0.72)), []);
  const centerLineGeometry = useMemo(() => new BufferGeometry().setFromPoints(createPentagonPoints(0.3, 0.055)), []);
  const radialGeometry = useMemo(() => createRadialLineGeometry(0.3, 0.64), []);
  const lineMaterial = useMemo(() => new LineBasicMaterial({ color: "#020617", linewidth: 2 }), []);

  return (
    <group name={face.label} position={position} quaternion={rotation}>
      <mesh geometry={outerGeometry}>
        <meshStandardMaterial color="#020617" roughness={0.82} metalness={0.18} side={DoubleSide} />
      </mesh>
      <mesh geometry={stickerGeometry} position={[0, 0, 0.026]}>
        <meshStandardMaterial color={face.color} roughness={0.45} metalness={0.04} side={DoubleSide} />
      </mesh>
      <mesh geometry={centerGeometry} position={[0, 0, 0.058]}>
        <meshStandardMaterial color={face.color} roughness={0.32} metalness={0.08} side={DoubleSide} />
      </mesh>
      <lineLoop geometry={outerLineGeometry} material={lineMaterial} />
      <lineLoop geometry={centerLineGeometry} material={lineMaterial} />
      <lineSegments geometry={radialGeometry} material={lineMaterial} />
      <mesh position={[0, 0, -0.022]}>
        <cylinderGeometry args={[0.68, 0.62, 0.08, 5, 1]} />
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
