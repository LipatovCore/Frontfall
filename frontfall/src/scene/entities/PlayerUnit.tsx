import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useLayoutEffect, useRef } from 'react'
import type { Group } from 'three'
import type { MapPosition } from '../../shared/types/map'
import type { PlayerUnitData } from '../../shared/types/unit'
import { moveUnitTowardsTarget } from '../systems/unitMovement'

type PlayerUnitProps = {
  unit: PlayerUnitData
  isSelected: boolean
  targetPosition: MapPosition | null
  onSelect: (unitId: string) => void
  onTargetReached: (unitId: string) => void
}

export function PlayerUnit({
  unit,
  isSelected,
  targetPosition,
  onSelect,
  onTargetReached,
}: PlayerUnitProps) {
  const unitRef = useRef<Group>(null)

  useLayoutEffect(() => {
    unitRef.current?.position.set(unit.position[0], unit.position[1], unit.position[2])
  }, [unit.position])

  useFrame((_, delta) => {
    if (!targetPosition || !unitRef.current) {
      return
    }

    const movement = moveUnitTowardsTarget(
      unitRef.current.position,
      targetPosition,
      delta,
      unit.moveSpeed,
      unit.stopDistance,
    )

    if (movement.arrived) {
      onTargetReached(unit.id)
    }
  })

  function handlePointerDown(event: ThreeEvent<PointerEvent>) {
    event.stopPropagation()
    onSelect(unit.id)
  }

  return (
    <group ref={unitRef} name={unit.id} onPointerDown={handlePointerDown}>
      {isSelected ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
          <ringGeometry args={[0.62, 0.84, 32]} />
          <meshBasicMaterial color="#7fd6ff" transparent opacity={0.85} />
        </mesh>
      ) : null}

      <mesh position={[0, 0.16, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.38, 0.44, 0.18, 18]} />
        <meshStandardMaterial color="#263446" />
      </mesh>

      <mesh position={[0, 0.34, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.7, 0.22, 0.9]} />
        <meshStandardMaterial color="#5c8fff" />
      </mesh>

      <mesh position={[0, 0.46, -0.08]} castShadow>
        <boxGeometry args={[0.3, 0.14, 0.42]} />
        <meshStandardMaterial color="#b7d5ff" />
      </mesh>

      <mesh position={[0.28, 0.29, 0.2]} castShadow rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.06, 0.28, 4, 8]} />
        <meshStandardMaterial color="#9ab9ff" />
      </mesh>

      <mesh position={[-0.28, 0.29, 0.2]} castShadow rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.06, 0.28, 4, 8]} />
        <meshStandardMaterial color="#9ab9ff" />
      </mesh>
    </group>
  )
}
