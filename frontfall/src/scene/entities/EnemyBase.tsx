import type { BaseEntityData } from '../../shared/types/map'

type EnemyBaseProps = {
  base: BaseEntityData
}

export function EnemyBase({ base }: EnemyBaseProps) {
  return (
    <group name={base.id} position={base.position}>
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
