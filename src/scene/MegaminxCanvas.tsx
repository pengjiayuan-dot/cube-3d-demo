import { useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";

import { MegaminxModel, type MegaminxModelHandle } from "@/scene/MegaminxModel";
import { FACE_COLORS, FACE_LABELS } from "@/scene/megaminx/colors";

export function MegaminxCanvas() {
  const [frontFace, setFrontFace] = useState(0);
  const [showLabels, setShowLabels] = useState(false);
  const handleRef = useRef<MegaminxModelHandle | null>(null);

  const triggerRotate = (direction: 1 | -1) => {
    handleRef.current?.rotateFront(direction);
  };

  return (
    <div className="relative h-full w-full">
      <Canvas camera={{ position: [0, 0.5, 5.3], fov: 42 }} dpr={[1, 2]}>
        <color attach="background" args={["#1a2540"]} />
        <ambientLight intensity={1.2} />
        <directionalLight position={[4, 5, 4]} intensity={2.4} />
        <pointLight position={[-3, -2, 3]} intensity={2} color="#2dd4bf" />
        <pointLight position={[3, -1, -2]} intensity={1.2} color="#38bdf8" />

        <MegaminxModel ref={handleRef} onFrontFaceChange={setFrontFace} showLabels={showLabels} />

        <ContactShadows position={[0, -2.35, 0]} opacity={0.38} scale={7} blur={2.8} far={4} />
        <OrbitControls
          autoRotate={false}
          enableDamping
          dampingFactor={0.08}
          maxDistance={7}
          minDistance={3.1}
          rotateSpeed={0.75}
        />
      </Canvas>

      <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-4">
        <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/15 bg-black/45 px-2 py-1 text-xs text-white backdrop-blur">
          <button
            type="button"
            onClick={() => triggerRotate(-1)}
            className="rounded-full px-3 py-1 transition hover:bg-white/10"
            aria-label="逆时针旋转正前面"
          >
            F&#39;
          </button>
          <button
            type="button"
            onClick={() => triggerRotate(1)}
            className="rounded-full px-3 py-1 transition hover:bg-white/10"
            aria-label="顺时针旋转正前面"
          >
            F
          </button>
        </div>
      </div>

      <div className="pointer-events-none absolute top-4 right-4 flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-3 py-1.5 text-xs text-white backdrop-blur">
        <span className="text-white/60">正前方</span>
        <span
          className="inline-block h-3 w-3 rounded-full border border-white/30"
          style={{ backgroundColor: FACE_COLORS[frontFace] }}
        />
        <span className="font-medium">{FACE_LABELS[frontFace]}</span>
      </div>

      <button
        type="button"
        onClick={() => setShowLabels((v) => !v)}
        className="pointer-events-auto absolute top-4 left-4 rounded-full border border-white/15 bg-black/40 px-3 py-1.5 text-xs text-white backdrop-blur transition hover:bg-white/10"
      >
        {showLabels ? "隐藏编号" : "显示编号"}
      </button>
    </div>
  );
}
