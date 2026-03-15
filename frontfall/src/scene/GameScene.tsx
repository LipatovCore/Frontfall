import { useState } from 'react'
import type { MapPosition } from '../shared/types/map'
import { initialPlayerUnits } from '../shared/config/playerUnits'
import { TopDownCamera } from './camera/TopDownCamera'
import { PlayerUnit } from './entities/PlayerUnit'
import { SceneLights } from './world/SceneLights'
import { Ground } from './world/Ground'
import { MapLayout } from './world/MapLayout'

export function GameScene() {
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null)
  const [unitTargets, setUnitTargets] = useState<Record<string, MapPosition | null>>(() =>
    Object.fromEntries(initialPlayerUnits.map((unit) => [unit.id, null])),
  )

  function handleGroundClick(position: MapPosition) {
    if (!selectedUnitId) {
      return
    }

    setUnitTargets((currentTargets) => ({
      ...currentTargets,
      [selectedUnitId]: position,
    }))
  }

  function handleUnitSelect(unitId: string) {
    setSelectedUnitId(unitId)
  }

  function handleTargetReached(unitId: string) {
    setUnitTargets((currentTargets) => {
      if (!currentTargets[unitId]) {
        return currentTargets
      }

      return {
        ...currentTargets,
        [unitId]: null,
      }
    })
  }

  return (
    <>
      <color attach="background" args={['#06080d']} />
      <fog attach="fog" args={['#06080d', 18, 36]} />
      <TopDownCamera />
      <SceneLights />
      <Ground onGroundClick={handleGroundClick} />
      <MapLayout />
      {initialPlayerUnits.map((unit) => (
        <PlayerUnit
          key={unit.id}
          unit={unit}
          isSelected={selectedUnitId === unit.id}
          targetPosition={unitTargets[unit.id]}
          onSelect={handleUnitSelect}
          onTargetReached={handleTargetReached}
        />
      ))}
    </>
  )
}
