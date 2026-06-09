import { Matrix4, Quaternion, Vector3 } from "three";

export type FaceFrame = {
  index: number;
  normal: Vector3;
  center: Vector3;
  quaternion: Quaternion;
  /** Outward radial axis (face center → first canonical vertex). */
  u: Vector3;
  /** In-face tangent axis (n × u). */
  v: Vector3;
  /** Five vertices of this face, in canonical (counter-clockwise from u) order. */
  vertices: Vector3[];
  /** Outer pentagon circumradius (face center to vertex). */
  pentagonRadius: number;
};

export type SlotKind = "center" | "edge" | "corner";

export type Slot = {
  id: string;
  kind: SlotKind;
  center: Vector3;
  /** Faces this slot touches (by face index). */
  faces: number[];
  /**
   * The slot's local frame: u/v lie in the plane perpendicular to the average
   * outward direction; n is the outward direction.
   */
  quaternion: Quaternion;
};

const PHI = (1 + Math.sqrt(5)) / 2;
const INV_PHI = 1 / PHI;

const RAW_NORMALS: [number, number, number][] = [
  [0, 1, PHI],
  [0, -1, PHI],
  [0, 1, -PHI],
  [0, -1, -PHI],
  [1, PHI, 0],
  [-1, PHI, 0],
  [1, -PHI, 0],
  [-1, -PHI, 0],
  [PHI, 0, 1],
  [-PHI, 0, 1],
  [PHI, 0, -1],
  [-PHI, 0, -1],
];

function buildVertices(scale: number): Vector3[] {
  const raw: [number, number, number][] = [];
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      for (const sz of [-1, 1]) {
        raw.push([sx, sy, sz]);
      }
    }
  }
  for (const a of [-PHI, PHI]) {
    for (const b of [-INV_PHI, INV_PHI]) {
      raw.push([0, a, b]);
      raw.push([b, 0, a]);
      raw.push([a, b, 0]);
    }
  }
  return raw.map(([x, y, z]) => new Vector3(x, y, z).multiplyScalar(scale));
}

/**
 * Outward-facing geometry of the whole megaminx, derived from a regular
 * dodecahedron whose inradius matches `targetInradius`.
 */
export function buildDodecahedronGeometry(targetInradius = 0.978) {
  const standardInradius = (PHI * PHI) / Math.sqrt(2 + PHI);
  const scale = targetInradius / standardInradius;
  const vertices = buildVertices(scale);
  const normals = RAW_NORMALS.map(([x, y, z]) => new Vector3(x, y, z).normalize());

  const faces: FaceFrame[] = normals.map((normal, index) => {
    const projections = vertices.map((v) => v.dot(normal));
    const maxProjection = Math.max(...projections);
    const onFace = vertices
      .filter((_, i) => Math.abs(projections[i] - maxProjection) < 1e-4)
      .map((v) => v.clone());

    const center = onFace
      .reduce((acc, v) => acc.add(v), new Vector3())
      .multiplyScalar(1 / onFace.length);

    const u = onFace[0].clone().sub(center).normalize();
    const n = normal.clone();
    const v = new Vector3().crossVectors(n, u).normalize();

    const matrix = new Matrix4().makeBasis(u, v, n);
    const quaternion = new Quaternion().setFromRotationMatrix(matrix);

    // Order the 5 vertices counter-clockwise starting from the one along u.
    const ordered = [...onFace].sort((a, b) => {
      const ax = a.clone().sub(center).dot(u);
      const ay = a.clone().sub(center).dot(v);
      const bx = b.clone().sub(center).dot(u);
      const by = b.clone().sub(center).dot(v);
      const angleA = (Math.atan2(ay, ax) + Math.PI * 2) % (Math.PI * 2);
      const angleB = (Math.atan2(by, bx) + Math.PI * 2) % (Math.PI * 2);
      return angleA - angleB;
    });

    return {
      index,
      normal: n,
      center,
      quaternion,
      u,
      v,
      vertices: ordered,
      pentagonRadius: ordered[0].distanceTo(center),
    };
  });

  return { vertices, faces };
}

const POSITION_EPSILON = 1e-3;

function samePoint(a: Vector3, b: Vector3) {
  return a.distanceTo(b) < POSITION_EPSILON;
}

/**
 * Build the 62 slots (12 centers + 30 edges + 20 corners) of a megaminx whose
 * outer hull is the regular dodecahedron given by `faces` and `vertices`.
 */
export function buildSlots(faces: FaceFrame[], vertices: Vector3[]): Slot[] {
  const slots: Slot[] = [];

  // Center slots: one per face.
  faces.forEach((face) => {
    slots.push({
      id: `center-${face.index}`,
      kind: "center",
      center: face.center.clone(),
      faces: [face.index],
      quaternion: face.quaternion.clone(),
    });
  });

  // Corner slots: one per vertex; each corner touches the 3 faces whose
  // pentagon contains that vertex.
  vertices.forEach((vertex, vIdx) => {
    const touchingFaces = faces
      .filter((face) => face.vertices.some((fv) => samePoint(fv, vertex)))
      .map((face) => face.index);

    if (touchingFaces.length !== 3) {
      // Skip degenerate cases (shouldn't happen on a regular dodecahedron).
      return;
    }

    // Build a local frame: outward = average of 3 face normals; u points along
    // a stable direction in the tangent plane.
    const outward = touchingFaces
      .reduce((acc, fi) => acc.add(faces[fi].normal), new Vector3())
      .normalize();

    const helper = Math.abs(outward.dot(new Vector3(0, 1, 0))) > 0.9
      ? new Vector3(1, 0, 0)
      : new Vector3(0, 1, 0);
    const u = new Vector3().crossVectors(helper, outward).normalize();
    const v = new Vector3().crossVectors(outward, u).normalize();
    const matrix = new Matrix4().makeBasis(u, v, outward);
    const quaternion = new Quaternion().setFromRotationMatrix(matrix);

    slots.push({
      id: `corner-${vIdx}`,
      kind: "corner",
      center: vertex.clone(),
      faces: touchingFaces.sort((a, b) => a - b),
      quaternion,
    });
  });

  // Edge slots: each pair of vertices that is shared by exactly 2 faces forms
  // an edge of the dodecahedron.
  const seenEdges = new Set<string>();
  for (let i = 0; i < vertices.length; i += 1) {
    for (let j = i + 1; j < vertices.length; j += 1) {
      const a = vertices[i];
      const b = vertices[j];

      const sharedFaces = faces.filter(
        (face) =>
          face.vertices.some((fv) => samePoint(fv, a)) &&
          face.vertices.some((fv) => samePoint(fv, b)),
      );

      if (sharedFaces.length !== 2) continue;

      // Edges of a regular dodecahedron have a constant length; reject pairs
      // that are diagonals across a face.
      // (Two vertices sharing 2 faces necessarily form an edge, but be safe.)
      const edgeKey = `${i}-${j}`;
      if (seenEdges.has(edgeKey)) continue;
      seenEdges.add(edgeKey);

      const center = a.clone().add(b).multiplyScalar(0.5);
      const outward = sharedFaces
        .reduce((acc, face) => acc.add(face.normal), new Vector3())
        .normalize();
      const along = b.clone().sub(a).normalize();
      const u = along;
      const v = new Vector3().crossVectors(outward, u).normalize();
      const matrix = new Matrix4().makeBasis(u, v, outward);
      const quaternion = new Quaternion().setFromRotationMatrix(matrix);

      slots.push({
        id: `edge-${i}-${j}`,
        kind: "edge",
        center,
        faces: sharedFaces.map((f) => f.index).sort((x, y) => x - y),
        quaternion,
      });
    }
  }

  return slots;
}
