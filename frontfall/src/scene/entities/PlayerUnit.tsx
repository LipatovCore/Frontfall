import type { ThreeEvent } from '@react-three/fiber'
import type { UnitData } from '../../shared/types/unit'

type CombatUnitProps = {
  unit: UnitData
  isSelected: boolean
  onSelect: (unitId: string, shouldToggleSelection: boolean) => void
  onEnemyTarget: (unitId: string) => void
}

const teamColors = {
  player: {
    hull: '#263446',
    accent: '#5c8fff',
    detail: '#b7d5ff',
    health: '#7fd6ff',
  },
  enemy: {
    hull: '#452b2f',
    accent: '#ff7f6d',
    detail: '#ffd0c7',
    health: '#ff9d8f',
  },
} as const

export function CombatUnit({ unit, isSelected, onSelect, onEnemyTarget }: CombatUnitProps) {
  const colors = teamColors[unit.team]
  const healthRatio = unit.currentHealth / unit.maxHealth

  function handlePointerDown(event: ThreeEvent<PointerEvent>) {
    event.stopPropagation()

    if (event.button !== 0) {
      return
    }

    if (unit.team !== 'player') {
      onEnemyTarget(unit.id)
      return
    }

    onSelect(unit.id, event.nativeEvent.shiftKey)
  }

  return (
    <group
      name={unit.id}
      position={[unit.position[0], unit.position[1], unit.position[2]]}
      onPointerDown={handlePointerDown}
    >
      {isSelected ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
          <ringGeometry args={[0.62, 0.84, 32]} />
          <meshBasicMaterial color="#7fd6ff" transparent opacity={0.85} />
        </mesh>
      ) : null}

      <group position={[0, 0.92, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <planeGeometry args={[0.92, 0.14]} />
          <meshBasicMaterial color="#12161d" transparent opacity={0.9} />
        </mesh>
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[-0.46 + healthRatio * 0.46, 0.02, 0]}
          scale={[healthRatio, 1, 1]}
        >
          <planeGeometry args={[0.92, 0.08]} />
          <meshBasicMaterial color={colors.health} />
        </mesh>
      </group>

      <mesh position={[0, 0.16, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.38, 0.44, 0.18, 18]} />
        <meshStandardMaterial color={colors.hull} />
      </mesh>

      <mesh position={[0, 0.34, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.7, 0.22, 0.9]} />
        <meshStandardMaterial color={colors.accent} />
      </mesh>

      <mesh position={[0, 0.46, -0.08]} castShadow>
        <boxGeometry args={[0.3, 0.14, 0.42]} />
        <meshStandardMaterial color={colors.detail} />
      </mesh>

      <mesh position={[0.28, 0.29, 0.2]} castShadow rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.06, 0.28, 4, 8]} />
        <meshStandardMaterial color={colors.detail} />
      </mesh>

      <mesh position={[-0.28, 0.29, 0.2]} castShadow rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.06, 0.28, 4, 8]} />
        <meshStandardMaterial color={colors.detail} />
      </mesh>

      {unit.team === 'enemy' ? (
        <mesh position={[0, 0.62, 0.28]} castShadow>
          <coneGeometry args={[0.16, 0.28, 12]} />
          <meshStandardMaterial color={colors.accent} />
        </mesh>
      ) : null}
    </group>
  )
}
