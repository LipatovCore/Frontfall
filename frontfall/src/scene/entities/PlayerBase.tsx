import type { BaseCoreState } from '../../shared/types/map'

type PlayerBaseProps = {
  base: BaseCoreState
}

export function PlayerBase({ base }: PlayerBaseProps) {
  const healthRatio = base.currentHealth / base.maxHealth

  return (
    <group name={base.id} position={base.position}>
      <group position={[0, 2.05, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <planeGeometry args={[3.2, 0.2]} />
          <meshBasicMaterial color="#12161d" transparent opacity={0.9} />
        </mesh>
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[-1.6 + healthRatio * 1.6, 0.02, 0]}
          scale={[healthRatio, 1, 1]}
        >
          <planeGeometry args={[3.2, 0.12]} />
          <meshBasicMaterial color="#7fd6ff" />
        </mesh>
      </group>

      <mesh position={[0, 0.18, 0]} receiveShadow>
        <cylinderGeometry args={[2.2, 2.5, 0.36, 32]} />
        <meshStandardMaterial color="#263246" />
      </mesh>

      <mesh position={[0, 0.62, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.6, 0.9, 2.6]} />
        <meshStandardMaterial color="#5d8cff" />
      </mesh>

      <mesh position={[0, 1.24, 0]} castShadow>
        <cylinderGeometry args={[0.42, 0.6, 0.52, 24]} />
        <meshStandardMaterial color="#a9c4ff" />
      </mesh>

      <mesh position={[-0.95, 1.15, -0.95]} castShadow>
        <boxGeometry args={[0.36, 1.1, 0.36]} />
        <meshStandardMaterial color="#8fb0ff" />
      </mesh>

      <mesh position={[0.95, 1.15, -0.95]} castShadow>
        <boxGeometry args={[0.36, 1.1, 0.36]} />
        <meshStandardMaterial color="#8fb0ff" />
      </mesh>
    </group>
  )
}
