import { useFrame } from '@react-three/fiber'
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { mapConfig } from '../shared/config/mapConfig'
import type { EconomyState } from '../shared/types/economy'
import { initialEnemyUnits } from '../shared/config/enemyUnits'
import { initialPlayerUnits } from '../shared/config/playerUnits'
import type { DeploymentBatch } from '../shared/types/reinforcements'
import type { ControlPointState, MapPosition } from '../shared/types/map'
import type { UnitData } from '../shared/types/unit'
import { TopDownCamera } from './camera/TopDownCamera'
import { CombatShots, type CombatShot } from './entities/CombatShots'
import { CombatUnit } from './entities/PlayerUnit'
import { assignGroupTargetPositions } from './systems/groupTargetPositions'
import {
  createInitialControlPointStates,
  simulateControlPointCaptureStep,
} from './systems/controlPointCapture'
import { simulateEconomyStep } from './systems/manpowerEconomy'
import { simulateUnitCombatStep, type UnitTargetMap } from './systems/unitCombat'
import { createUnitsFromDeploymentBatch } from './systems/waveDeployment'
import { SceneLights } from './world/SceneLights'
import { Ground } from './world/Ground'
import { MapLayout } from './world/MapLayout'

const initialUnits: UnitData[] = [...initialPlayerUnits, ...initialEnemyUnits]
const initialControlPoints = createInitialControlPointStates(mapConfig.controlPoints)
const shotLifetimeSeconds = 0.08

type ActiveCombatShot = CombatShot & {
  remainingLifetime: number
}

function createInitialTargets(units: UnitData[]) {
  return Object.fromEntries(units.map((unit) => [unit.id, null])) as UnitTargetMap
}

type GameSceneProps = {
  deploymentBatch: DeploymentBatch | null
  economyState: EconomyState
  onEconomyStateChange: Dispatch<SetStateAction<EconomyState>>
  onControlPointsChange: (nextControlPoints: ControlPointState[]) => void
}

export function GameScene({
  deploymentBatch,
  economyState,
  onEconomyStateChange,
  onControlPointsChange,
}: GameSceneProps) {
  const [units, setUnits] = useState<UnitData[]>(initialUnits)
  const [controlPoints, setControlPoints] = useState<ControlPointState[]>(initialControlPoints)
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([])
  const [unitTargets, setUnitTargets] = useState<UnitTargetMap>(() => createInitialTargets(initialUnits))
  const [shots, setShots] = useState<ActiveCombatShot[]>([])
  const unitsRef = useRef(units)
  const controlPointsRef = useRef(controlPoints)
  const unitTargetsRef = useRef(unitTargets)
  const shotsRef = useRef(shots)
  const economyStateRef = useRef(economyState)
  const lastDeploymentBatchIdRef = useRef<number | null>(null)

  useEffect(() => {
    unitsRef.current = units
  }, [units])

  useEffect(() => {
    controlPointsRef.current = controlPoints
  }, [controlPoints])

  useEffect(() => {
    unitTargetsRef.current = unitTargets
  }, [unitTargets])

  useEffect(() => {
    shotsRef.current = shots
  }, [shots])

  useEffect(() => {
    economyStateRef.current = economyState
  }, [economyState])

  useEffect(() => {
    if (!deploymentBatch || deploymentBatch.id === lastDeploymentBatchIdRef.current) {
      return
    }

    lastDeploymentBatchIdRef.current = deploymentBatch.id

    setUnits((currentUnits) => {
      const spawnedUnits = createUnitsFromDeploymentBatch(deploymentBatch, currentUnits)

      if (spawnedUnits.length === 0) {
        return currentUnits
      }

      const nextUnits = [...currentUnits, ...spawnedUnits]
      unitsRef.current = nextUnits

      setUnitTargets((currentTargets) => {
        const nextTargets = { ...currentTargets }

        for (const unit of spawnedUnits) {
          nextTargets[unit.id] = null
        }

        unitTargetsRef.current = nextTargets
        return nextTargets
      })

      return nextUnits
    })
  }, [deploymentBatch])

  useEffect(() => {
    onControlPointsChange(controlPoints)
  }, [controlPoints, onControlPointsChange])

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
    const captureResult = simulateControlPointCaptureStep(
      controlPointsRef.current,
      result.units,
      delta,
    )
    const nextControlPoints = captureResult.changed
      ? captureResult.controlPoints
      : controlPointsRef.current
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

    if (captureResult.changed) {
      controlPointsRef.current = nextControlPoints
      setControlPoints(nextControlPoints)
    }

    onEconomyStateChange((currentEconomyState) => {
      const economyResult = simulateEconomyStep(currentEconomyState, nextControlPoints, delta)
      economyStateRef.current = economyResult.economyState
      return economyResult.economyState
    })

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
      <MapLayout controlPoints={controlPoints} />
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
