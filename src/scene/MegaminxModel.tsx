import {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import {
  CircleGeometry,
  DoubleSide,
  Group,
  Matrix4,
  Quaternion,
  Shape,
  ShapeGeometry,
  Vector3,
} from "three";

import {
  buildDodecahedronGeometry,
  buildSlots,
  type FaceFrame,
  type Slot,
  type SlotKind,
} from "@/scene/megaminx/geometry";
import { FACE_COLORS } from "@/scene/megaminx/colors";

function createPentagonShape(radius: number) {
  const shape = new Shape();
  for (let i = 0; i < 5; i += 1) {
    const angle = (i * Math.PI * 2) / 5;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
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
  if (t >= 0 && t <= 1) return new Vector3(A.x + t * dx, A.y + t * dy, 0);
  return null;
}

function shrinkShape(shape: Shape, scale: number) {
  const pts = shape.getPoints(8);
  let cx = 0;
  let cy = 0;
  for (const p of pts) {
    cx += p.x;
    cy += p.y;
  }
  cx /= pts.length;
  cy /= pts.length;

  const out = new Shape();
  for (let i = 0; i < pts.length; i += 1) {
    const nx = cx + (pts[i].x - cx) * scale;
    const ny = cy + (pts[i].y - cy) * scale;
    if (i === 0) out.moveTo(nx, ny);
    else out.lineTo(nx, ny);
  }
  out.closePath();
  return out;
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

  const M = new Vector3().lerpVectors(v0, v1, 0.5);
  const d1 = new Vector3().subVectors(v4, v0).normalize();
  const d2 = new Vector3().subVectors(v2, v1).normalize();

  const p1 = new Vector3().lerpVectors(v0, v1, t);
  const p4 = new Vector3().lerpVectors(v0, v4, t);
  const pInner = new Vector3().addVectors(p1, p4).sub(v0);
  const Ri = pInner.length();

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

type StickerSpec = {
  kind: SlotKind;
  indexInFace: number;
  color: string;
  face: FaceFrame;
};

type PieceData = {
  slot: Slot;
  stickers: StickerSpec[];
};

function buildPieces(faces: FaceFrame[], slots: Slot[]): PieceData[] {
  const cornerSlots = slots.filter((s) => s.kind === "corner");
  const edgeSlots = slots.filter((s) => s.kind === "edge");
  const centerSlots = slots.filter((s) => s.kind === "center");

  const pieces: PieceData[] = slots.map((slot) => ({ slot, stickers: [] }));
  const findPiece = (slot: Slot) => pieces.find((p) => p.slot.id === slot.id)!;

  faces.forEach((face) => {
    const color = FACE_COLORS[face.index];
    const centerSlot = centerSlots.find((s) => s.faces[0] === face.index);
    if (centerSlot) {
      findPiece(centerSlot).stickers.push({
        kind: "center",
        indexInFace: 0,
        color,
        face,
      });
    }

    for (let i = 0; i < 5; i += 1) {
      const anchorIndex = (5 - i) % 5;
      const anchor = face.vertices[anchorIndex];
      const slot = cornerSlots.find((s) => s.center.distanceTo(anchor) < 1e-3);
      if (!slot) continue;
      findPiece(slot).stickers.push({
        kind: "corner",
        indexInFace: i,
        color,
        face,
      });
    }

    for (let i = 0; i < 5; i += 1) {
      const a = (5 - i) % 5;
      const b = (a + 1) % 5;
      const midpoint = face.vertices[a]
        .clone()
        .add(face.vertices[b])
        .multiplyScalar(0.5);
      const slot = edgeSlots.find((s) => s.center.distanceTo(midpoint) < 1e-3);
      if (!slot) continue;
      findPiece(slot).stickers.push({
        kind: "edge",
        indexInFace: i,
        color,
        face,
      });
    }
  });

  return pieces;
}

function buildStickerGeometries(pentagonRadius: number) {
  const centerRadius = pentagonRadius * 0.264;
  const stickerRadius = pentagonRadius * 0.889;
  const t = 0.4;

  return {
    pentagonGeometry: new ShapeGeometry(createPentagonShape(pentagonRadius)),
    centerGeometry: new CircleGeometry(centerRadius * 0.94, 32),
    cornerGeometry: new ShapeGeometry(createCornerShape(stickerRadius, t, centerRadius)),
    edgeGeometry: new ShapeGeometry(createEdgeShape(stickerRadius, t)),
  };
}

const ONES = new Vector3(1, 1, 1);

/**
 * For a sticker that belongs to a piece sitting at `slot`, compute its
 * transform expressed in the piece's local frame.
 */
function computeStickerLocalTransform(spec: StickerSpec, slot: Slot) {
  const faceWorld = new Matrix4().compose(spec.face.center, spec.face.quaternion, ONES);

  const rotZ = spec.kind === "center" ? 0 : ((Math.PI * 2) / 5) * -spec.indexInFace;
  const inFace = new Matrix4().makeRotationZ(rotZ);
  const lift = new Matrix4().makeTranslation(0, 0, 0.026);

  const stickerWorld = new Matrix4()
    .multiplyMatrices(faceWorld, inFace)
    .multiply(lift);

  const slotWorld = new Matrix4().compose(slot.center, slot.quaternion, ONES);
  const slotInverse = new Matrix4().copy(slotWorld).invert();
  const local = new Matrix4().multiplyMatrices(slotInverse, stickerWorld);

  const pos = new Vector3();
  const quat = new Quaternion();
  const scale = new Vector3();
  local.decompose(pos, quat, scale);
  return { position: pos, quaternion: quat };
}

function computeFacePlateTransform(face: FaceFrame) {
  return { position: face.center.clone(), quaternion: face.quaternion.clone() };
}

type StickerMeshProps = {
  spec: StickerSpec;
  slot: Slot;
  geometries: ReturnType<typeof buildStickerGeometries>;
  showLabel?: boolean;
};

function StickerMesh({ spec, slot, geometries, showLabel }: StickerMeshProps) {
  const transform = useMemo(() => computeStickerLocalTransform(spec, slot), [spec, slot]);
  const labelTransform = useMemo(() => computeLabelLocalTransform(spec, slot), [spec, slot]);
  const geometry =
    spec.kind === "center"
      ? geometries.centerGeometry
      : spec.kind === "corner"
        ? geometries.cornerGeometry
        : geometries.edgeGeometry;

  const fontSize = spec.face.pentagonRadius * 0.1;
  const labelText =
    spec.kind === "center"
      ? `M${spec.face.index}`
      : spec.kind === "corner"
        ? `${spec.face.index}.C${spec.indexInFace}`
        : `${spec.face.index}.E${spec.indexInFace}`;

  return (
    <group>
      <mesh
        geometry={geometry}
        position={transform.position}
        quaternion={transform.quaternion}
      >
        <meshStandardMaterial color={spec.color} roughness={0.45} metalness={0.04} side={DoubleSide} />
      </mesh>
      {showLabel && (
        <Text
          position={labelTransform.position}
          quaternion={labelTransform.quaternion}
          fontSize={fontSize}
          color="#f8fafc"
          outlineColor="#0f172a"
          outlineWidth={fontSize * 0.18}
          outlineBlur={fontSize * 0.04}
          anchorX="center"
          anchorY="middle"
          fontWeight={600}
        >
          {labelText}
        </Text>
      )}
    </group>
  );
}

/**
 * Compute label transform in piece-local frame:
 * 1. Pick label position in face-local 2D (depends on sticker kind & indexInFace).
 * 2. Lift along face normal.
 * 3. Convert to world via face frame.
 * 4. Convert to piece-local via slot inverse.
 */
function computeLabelLocalTransform(spec: StickerSpec, slot: Slot) {
  const R = spec.face.pentagonRadius;
  const angle = ((Math.PI * 2) / 5) * -spec.indexInFace;
  let localX = 0;
  let localY = 0;
  if (spec.kind === "corner") {
    localX = Math.cos(angle) * R * 0.62;
    localY = Math.sin(angle) * R * 0.62;
  } else if (spec.kind === "edge") {
    localX = Math.cos(angle + Math.PI / 5) * R * 0.5;
    localY = Math.sin(angle + Math.PI / 5) * R * 0.5;
  }
  // Build label transform in face-local frame: translate (localX, localY, 0.03), no rotation.
  const labelInFace = new Matrix4().makeTranslation(localX, localY, 0.03);
  const faceWorld = new Matrix4().compose(spec.face.center, spec.face.quaternion, ONES);
  const labelWorld = new Matrix4().multiplyMatrices(faceWorld, labelInFace);

  const slotWorld = new Matrix4().compose(slot.center, slot.quaternion, ONES);
  const slotInverse = new Matrix4().copy(slotWorld).invert();
  const local = new Matrix4().multiplyMatrices(slotInverse, labelWorld);

  const pos = new Vector3();
  const quat = new Quaternion();
  const scale = new Vector3();
  local.decompose(pos, quat, scale);
  return { position: pos, quaternion: quat };
}

const ROTATION_DURATION = 0.32;

type Movable = {
  id: string;
  group: Group;
  basePosition: Vector3;
  baseQuaternion: Quaternion;
};

type Animation = {
  axis: Vector3;
  pivot: Vector3;
  angle: number;
  elapsed: number;
  movables: Movable[];
};

export type MegaminxModelHandle = {
  rotateFront: (direction: 1 | -1) => boolean;
  isAnimating: () => boolean;
};

type MegaminxModelProps = {
  onFrontFaceChange?: (faceIndex: number) => void;
  showLabels?: boolean;
};

export const MegaminxModel = forwardRef<MegaminxModelHandle, MegaminxModelProps>(
  function MegaminxModel({ onFrontFaceChange, showLabels = false }, ref) {
    const { faces, pieces, geometries } = useMemo(() => {
      const dodec = buildDodecahedronGeometry();
      const slots = buildSlots(dodec.faces, dodec.vertices);
      const pieces = buildPieces(dodec.faces, slots);
      const geometries = buildStickerGeometries(dodec.faces[0].pentagonRadius);

      return { faces: dodec.faces, slots, pieces, geometries };
    }, []);

    const rootRef = useRef<Group>(null);
    const pieceGroupsRef = useRef<Map<string, Group>>(new Map());
    const facePlateGroupsRef = useRef<Map<number, Group>>(new Map());
    const animationRef = useRef<Animation | null>(null);
    const lastFrontFace = useRef<number>(-1);
    const frontFaceRef = useRef<number>(-1);
    const { camera } = useThree();

    const detectFrontFace = () => {
      if (!rootRef.current) return -1;
      const rootQuat = rootRef.current.getWorldQuaternion(new Quaternion());
      const cameraDir = new Vector3()
        .subVectors(rootRef.current.getWorldPosition(new Vector3()), camera.position)
        .normalize();
      const localCameraDir = cameraDir.clone().applyQuaternion(rootQuat.clone().invert());

      let bestIndex = 0;
      let bestDot = -Infinity;
      for (const face of faces) {
        const dot = -face.normal.dot(localCameraDir);
        if (dot > bestDot) {
          bestDot = dot;
          bestIndex = face.index;
        }
      }
      return bestIndex;
    };

    const collectLayerMovables = (faceIndex: number): Movable[] => {
      const face = faces[faceIndex];
      const result: Movable[] = [];

      // Pieces: any piece group whose current world position lies on this face's plane.
      for (const [id, group] of pieceGroupsRef.current.entries()) {
        const distance = group.position.dot(face.normal) - face.center.dot(face.normal);
        if (Math.abs(distance) < 1e-2) {
          result.push({
            id,
            group,
            basePosition: group.position.clone(),
            baseQuaternion: group.quaternion.clone(),
          });
        }
      }

      // The face plate of this face is also part of the layer.
      const plateGroup = facePlateGroupsRef.current.get(faceIndex);
      if (plateGroup) {
        result.push({
          id: `plate-${faceIndex}`,
          group: plateGroup,
          basePosition: plateGroup.position.clone(),
          baseQuaternion: plateGroup.quaternion.clone(),
        });
      }
      return result;
    };

    const rotateFront = (direction: 1 | -1) => {
      if (animationRef.current) return false;
      const faceIndex = frontFaceRef.current >= 0 ? frontFaceRef.current : detectFrontFace();
      if (faceIndex < 0) return false;

      const face = faces[faceIndex];
      const movables = collectLayerMovables(faceIndex);
      if (movables.length === 0) return false;

      // F: clockwise from observer = -72° around outward normal.
      const angle = direction * -((Math.PI * 2) / 5);

      animationRef.current = {
        axis: face.normal.clone(),
        pivot: face.center.clone(),
        angle,
        elapsed: 0,
        movables,
      };
      return true;
    };

    useImperativeHandle(ref, () => ({
      rotateFront,
      isAnimating: () => animationRef.current !== null,
    }));

    useFrame((_, delta) => {
      if (!rootRef.current) return;

      // Drive any active rotation animation.
      const anim = animationRef.current;
      if (anim) {
        anim.elapsed = Math.min(anim.elapsed + delta, ROTATION_DURATION);
        const t = anim.elapsed / ROTATION_DURATION;
        // Smoothstep easing.
        const eased = t * t * (3 - 2 * t);
        const currentAngle = anim.angle * eased;
        const stepQuat = new Quaternion().setFromAxisAngle(anim.axis, currentAngle);

        for (const m of anim.movables) {
          const offset = m.basePosition.clone().sub(anim.pivot);
          offset.applyQuaternion(stepQuat);
          m.group.position.copy(offset.add(anim.pivot));
          m.group.quaternion.copy(stepQuat).multiply(m.baseQuaternion);
        }

        if (anim.elapsed >= ROTATION_DURATION) {
          // Bake: snap each movable to the exact final transform to avoid drift.
          const finalQuat = new Quaternion().setFromAxisAngle(anim.axis, anim.angle);
          for (const m of anim.movables) {
            const offset = m.basePosition.clone().sub(anim.pivot);
            offset.applyQuaternion(finalQuat);
            m.group.position.copy(offset.add(anim.pivot));
            m.group.quaternion.copy(finalQuat).multiply(m.baseQuaternion);
          }
          animationRef.current = null;
        }
      }

      // Front-face detection (paused while animating to avoid jitter).
      if (!animationRef.current && onFrontFaceChange) {
        const idx = detectFrontFace();
        frontFaceRef.current = idx;
        if (idx !== lastFrontFace.current) {
          lastFrontFace.current = idx;
          onFrontFaceChange(idx);
        }
      }
    });

    return (
      <group ref={rootRef} rotation={[0.18, -0.35, 0.1]}>
        {faces.map((face) => {
          const { position, quaternion } = computeFacePlateTransform(face);
          return (
            <group
              key={`plate-${face.index}`}
              ref={(g) => {
                if (g) facePlateGroupsRef.current.set(face.index, g);
                else facePlateGroupsRef.current.delete(face.index);
              }}
              position={position}
              quaternion={quaternion}
            >
              <mesh geometry={geometries.pentagonGeometry}>
                <meshStandardMaterial
                  color="#020617"
                  roughness={0.82}
                  metalness={0.18}
                  side={DoubleSide}
                />
              </mesh>
            </group>
          );
        })}

        {pieces.map((piece) => (
          <group
            key={piece.slot.id}
            name={piece.slot.id}
            ref={(g) => {
              if (g) pieceGroupsRef.current.set(piece.slot.id, g);
              else pieceGroupsRef.current.delete(piece.slot.id);
            }}
            position={piece.slot.center}
            quaternion={piece.slot.quaternion}
          >
            {piece.stickers.map((sticker, idx) => (
              <StickerMesh
                key={`${piece.slot.id}-${sticker.face.index}-${idx}`}
                spec={sticker}
                slot={piece.slot}
                geometries={geometries}
                showLabel={showLabels}
              />
            ))}
          </group>
        ))}
      </group>
    );
  },
);

// Standalone face component used by the single-face preview canvas.
type FaceSpec = {
  center: Vector3;
  quaternion: Quaternion;
  pentagonRadius: number;
  color: string;
  label: string;
};

export function MegaminxFace({ face }: { face: FaceSpec }) {
  const { center, quaternion, pentagonRadius, color, label } = face;
  const geometries = useMemo(() => buildStickerGeometries(pentagonRadius), [pentagonRadius]);

  // Layout (face-local 2D, +x to the right, +y up):
  // - corner sticker i is anchored at the pentagon vertex pointing toward angle (-i * 72°)
  // - edge sticker i is anchored at the midpoint of the edge between vertices i and i+1, at (-i * 72° + 36°)
  const labelFontSize = pentagonRadius * 0.1;
  const cornerLabelRadius = pentagonRadius * 0.62;
  const edgeLabelRadius = pentagonRadius * 0.5;
  const labelStyle = {
    color: "#f8fafc",
    outlineColor: "#0f172a",
    outlineWidth: labelFontSize * 0.18,
    outlineBlur: labelFontSize * 0.04,
    fontSize: labelFontSize,
    fontWeight: 600 as const,
  };

  return (
    <group name={label} position={center} quaternion={quaternion}>
      <mesh geometry={geometries.pentagonGeometry}>
        <meshStandardMaterial color="#020617" roughness={0.82} metalness={0.18} side={DoubleSide} />
      </mesh>

      <mesh name="center" geometry={geometries.centerGeometry} position={[0, 0, 0.026]}>
        <meshStandardMaterial color={color} roughness={0.45} metalness={0.04} side={DoubleSide} />
      </mesh>
      <Text position={[0, 0, 0.03]} anchorX="center" anchorY="middle" {...labelStyle}>
        M
      </Text>

      {Array.from({ length: 5 }).map((_, i) => {
        const cornerAngle = ((Math.PI * 2) / 5) * -i;
        const edgeAngle = ((Math.PI * 2) / 5) * -i + Math.PI / 5;
        return (
          <group key={i}>
            <group rotation={[0, 0, ((Math.PI * 2) / 5) * -i]}>
              <mesh name={`corner-${i}`} geometry={geometries.cornerGeometry} position={[0, 0, 0.026]}>
                <meshStandardMaterial color={color} roughness={0.45} metalness={0.04} side={DoubleSide} />
              </mesh>
              <mesh name={`edge-${i}`} geometry={geometries.edgeGeometry} position={[0, 0, 0.026]}>
                <meshStandardMaterial color={color} roughness={0.45} metalness={0.04} side={DoubleSide} />
              </mesh>
            </group>
            <Text
              position={[Math.cos(cornerAngle) * cornerLabelRadius, Math.sin(cornerAngle) * cornerLabelRadius, 0.03]}
              anchorX="center"
              anchorY="middle"
              {...labelStyle}
            >
              {`C${i}`}
            </Text>
            <Text
              position={[Math.cos(edgeAngle) * edgeLabelRadius, Math.sin(edgeAngle) * edgeLabelRadius, 0.03]}
              anchorX="center"
              anchorY="middle"
              {...labelStyle}
            >
              {`E${i}`}
            </Text>
          </group>
        );
      })}
    </group>
  );
}
