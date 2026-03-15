import type { BaseEntityData } from '../../shared/types/map'

type PlayerBaseProps = {
  base: BaseEntityData
}

export function PlayerBase({ base }: PlayerBaseProps) {
  return (
    <group name={base.id} position={base.position}>
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
