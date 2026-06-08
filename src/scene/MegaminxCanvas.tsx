import { Canvas } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";

import { MegaminxModel } from "@/scene/MegaminxModel";

export function MegaminxCanvas() {
  return (
    <Canvas camera={{ position: [0, 0.5, 5.3], fov: 42 }} dpr={[1, 2]}>
      <color attach="background" args={["#06101f"]} />
      <ambientLight intensity={1.2} />
      <directionalLight position={[4, 5, 4]} intensity={2.4} />
      <pointLight position={[-3, -2, 3]} intensity={2} color="#2dd4bf" />
      <pointLight position={[3, -1, -2]} intensity={1.2} color="#38bdf8" />

      <MegaminxModel />

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
  );
}
