import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import { useRef, useState } from "react";
import { Group, MathUtils, Quaternion, Vector3 } from "three";

import { MegaminxFace } from "@/scene/MegaminxModel";

const STEP = (Math.PI * 2) / 5;

function SingleFaceModel({ targetAngle }: { targetAngle: number }) {
  const groupRef = useRef<Group>(null);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const k = 1 - Math.exp(-delta * 8);
    group.rotation.z = MathUtils.lerp(group.rotation.z, targetAngle, k);
  });

  return (
    <group ref={groupRef}>
      <MegaminxFace
        face={{
          center: new Vector3(0, 0, 0),
          quaternion: new Quaternion(),
          pentagonRadius: 0.747,
          color: "#3b82f6",
          label: "preview-face",
        }}
      />
    </group>
  );
}

export function MegaminxSingleFaceCanvas() {
  const [targetAngle, setTargetAngle] = useState(0);

  return (
    <div className="relative h-full w-full">
      <Canvas camera={{ position: [0, 0, 4.5], fov: 42 }} dpr={[1, 2]}>
        <color attach="background" args={["#1a2540"]} />
        <ambientLight intensity={1.2} />
        <directionalLight position={[4, 5, 4]} intensity={2.4} />
        <pointLight position={[-3, -2, 3]} intensity={2} color="#2dd4bf" />
        <pointLight position={[3, -1, -2]} intensity={1.2} color="#38bdf8" />

        <SingleFaceModel targetAngle={targetAngle} />

        <ContactShadows position={[0, -1.8, 0]} opacity={0.38} scale={7} blur={2.8} far={4} />
        <OrbitControls
          autoRotate={false}
          enableDamping
          dampingFactor={0.08}
          maxDistance={7}
          minDistance={2}
          rotateSpeed={0.75}
        />
      </Canvas>

      <div className="pointer-events-none absolute inset-x-0 bottom-3 flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setTargetAngle((a) => a + STEP)}
          className="pointer-events-auto rounded-full border border-white/15 bg-black/40 px-3 py-1.5 text-xs text-white/80 backdrop-blur transition hover:border-white/30 hover:bg-black/60 hover:text-white"
          aria-label="逆时针旋转 72°"
        >
          ⟲ 逆时针
        </button>
        <button
          type="button"
          onClick={() => setTargetAngle((a) => a - STEP)}
          className="pointer-events-auto rounded-full border border-white/15 bg-black/40 px-3 py-1.5 text-xs text-white/80 backdrop-blur transition hover:border-white/30 hover:bg-black/60 hover:text-white"
          aria-label="顺时针旋转 72°"
        >
          顺时针 ⟳
        </button>
      </div>
    </div>
  );
}
