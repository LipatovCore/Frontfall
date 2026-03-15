import { useFrame } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import { initialEnemyUnits } from '../shared/config/enemyUnits'
import { initialPlayerUnits } from '../shared/config/playerUnits'
import type { MapPosition } from '../shared/types/map'
import type { UnitData } from '../shared/types/unit'
import { TopDownCamera } from './camera/TopDownCamera'
import { CombatShots, type CombatShot } from './entities/CombatShots'
import { CombatUnit } from './entities/PlayerUnit'
import { assignGroupTargetPositions } from './systems/groupTargetPositions'
import { simulateUnitCombatStep, type UnitTargetMap } from './systems/unitCombat'
import { SceneLights } from './world/SceneLights'
import { Ground } from './world/Ground'
import { MapLayout } from './world/MapLayout'

const initialUnits: UnitData[] = [...initialPlayerUnits, ...initialEnemyUnits]
const shotLifetimeSeconds = 0.08

type ActiveCombatShot = CombatShot & {
  remainingLifetime: number
}

function createInitialTargets(units: UnitData[]) {
  return Object.fromEntries(units.map((unit) => [unit.id, null])) as UnitTargetMap
}

export function GameScene() {
  const [units, setUnits] = useState<UnitData[]>(initialUnits)
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([])
  const [unitTargets, setUnitTargets] = useState<UnitTargetMap>(() => createInitialTargets(initialUnits))
  const [shots, setShots] = useState<ActiveCombatShot[]>([])
  const unitsRef = useRef(units)
  const unitTargetsRef = useRef(unitTargets)
  const shotsRef = useRef(shots)

  useEffect(() => {
    unitsRef.current = units
  }, [units])

  useEffect(() => {
    unitTargetsRef.current = unitTargets
  }, [unitTargets])

  useEffect(() => {
    shotsRef.current = shots
  }, [shots])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.repeat || event.code !== 'Escape') {
        return
      }

      setSelectedUnitIds([])
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  useFrame((_, delta) => {
    const result = simulateUnitCombatStep(unitsRef.current, unitTargetsRef.current, delta)
    const nextShots = shotsRef.current
      .map((shot) => ({
        ...shot,
        remainingLifetime: shot.remainingLifetime - delta,
      }))
      .filter((shot) => shot.remainingLifetime > 0)

    if (result.attacks.length > 0) {
      let attackIndex = 0

      for (const attack of result.attacks) {
        nextShots.push({
          id: `${attack.attackerId}-${attack.targetId}-${performance.now()}-${attackIndex}`,
          from: attack.from,
          to: attack.to,
          team: attack.attackerTeam,
          remainingLifetime: shotLifetimeSeconds,
        })
        attackIndex += 1
      }
    }

    if (
      nextShots.length !== shotsRef.current.length ||
      nextShots.some((shot, index) => shot !== shotsRef.current[index])
    ) {
      shotsRef.current = nextShots
      setShots(nextShots)
    }

    if (!result.changed) {
      return
    }

    unitsRef.current = result.units
    setUnits(result.units)

    if (result.reachedTargetUnitIds.length > 0 || result.removedUnitIds.length > 0) {
      const completedIds = new Set(result.reachedTargetUnitIds)
      const removedIds = new Set(result.removedUnitIds)

      setUnitTargets((currentTargets) => {
        let hasChanges = false
        const nextTargets = { ...currentTargets }

        for (const unitId of completedIds) {
          if (nextTargets[unitId]) {
            nextTargets[unitId] = null
            hasChanges = true
          }
        }

        for (const unitId of removedIds) {
          if (unitId in nextTargets) {
            delete nextTargets[unitId]
            hasChanges = true
          }
        }

        if (!hasChanges) {
          return currentTargets
        }

        unitTargetsRef.current = nextTargets
        return nextTargets
      })

      if (removedIds.size > 0) {
        setSelectedUnitIds((currentSelectedUnitIds) =>
          currentSelectedUnitIds.filter((unitId) => !removedIds.has(unitId)),
        )
      }
    }
  })

  function handleGroundClick(position: MapPosition) {
    if (selectedUnitIds.length === 0) {
      return
    }

    const targetAssignments = assignGroupTargetPositions(selectedUnitIds, position)

    setUnitTargets((currentTargets) => {
      const nextTargets = { ...currentTargets }

      for (const [unitId, targetPosition] of Object.entries(targetAssignments)) {
        if (!(unitId in nextTargets)) {
          continue
        }

        nextTargets[unitId] = targetPosition
      }

      unitTargetsRef.current = nextTargets
      return nextTargets
    })
  }

  function handleUnitSelect(unitId: string, shouldToggleSelection: boolean) {
    setSelectedUnitIds((currentSelectedUnitIds) => {
      if (!shouldToggleSelection) {
        return [unitId]
      }

      if (currentSelectedUnitIds.includes(unitId)) {
        return currentSelectedUnitIds.filter((selectedUnitId) => selectedUnitId !== unitId)
      }

      return [...currentSelectedUnitIds, unitId]
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
      <CombatShots shots={shots} />
      {units.map((unit) => (
        <CombatUnit
          key={unit.id}
          unit={unit}
          isSelected={unit.team === 'player' && selectedUnitIds.includes(unit.id)}
          onSelect={handleUnitSelect}
        />
      ))}
    </>
  )
}
