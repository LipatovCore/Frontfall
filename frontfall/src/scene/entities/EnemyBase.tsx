import type { ThreeEvent } from '@react-three/fiber'
import type { BaseCoreState } from '../../shared/types/map'

type EnemyBaseProps = {
  base: BaseCoreState
  onTarget: (baseId: string) => void
}

export function EnemyBase({ base, onTarget }: EnemyBaseProps) {
  const healthRatio = base.currentHealth / base.maxHealth

  function handlePointerDown(event: ThreeEvent<PointerEvent>) {
    event.stopPropagation()

    if (event.button !== 0) {
      return
    }

    onTarget(base.id)
  }

  return (
    <group name={base.id} position={base.position} onPointerDown={handlePointerDown}>
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
          <meshBasicMaterial color="#ff9d8f" />
        </mesh>
      </group>

      <mesh position={[0, 0.18, 0]} receiveShadow>
        <cylinderGeometry args={[2.2, 2.5, 0.36, 32]} />
        <meshStandardMaterial color="#33252a" />
      </mesh>

      <mesh position={[0, 0.68, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.35, 1.7, 1, 28]} />
        <meshStandardMaterial color="#ff7f6d" />
      </mesh>

      <mesh position={[0, 1.42, 0]} castShadow>
        <coneGeometry args={[0.76, 0.95, 24]} />
        <meshStandardMaterial color="#ffd0c7" />
      </mesh>

      <mesh position={[-1.15, 0.96, 1.05]} castShadow>
        <boxGeometry args={[0.44, 0.9, 0.44]} />
        <meshStandardMaterial color="#ffab9e" />
      </mesh>

      <mesh position={[1.15, 0.96, 1.05]} castShadow>
        <boxGeometry args={[0.44, 0.9, 0.44]} />
        <meshStandardMaterial color="#ffab9e" />
      </mesh>
    </group>
  )
}
