import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { Plane, Raycaster, Vector2, Vector3 } from 'three'
import { mapConfig } from '../shared/config/mapConfig'
import type { EconomyState } from '../shared/types/economy'
import { initialEnemyUnits } from '../shared/config/enemyUnits'
import { initialPlayerUnits } from '../shared/config/playerUnits'
import type { DeploymentBatch } from '../shared/types/reinforcements'
import type { ControlPointState, MapPosition } from '../shared/types/map'
import type { SelectionBox, ScreenPoint } from '../shared/types/selection'
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
import {
  simulateUnitCombatStep,
  type UnitAttackTargetMap,
  type UnitTargetMap,
} from './systems/unitCombat'
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

function createInitialAttackTargets(units: UnitData[]) {
  return Object.fromEntries(units.map((unit) => [unit.id, null])) as UnitAttackTargetMap
}

type GameSceneProps = {
  deploymentBatch: DeploymentBatch | null
  economyState: EconomyState
  onEconomyStateChange: Dispatch<SetStateAction<EconomyState>>
  onControlPointsChange: (nextControlPoints: ControlPointState[]) => void
  onSelectionBoxChange: (selectionBox: SelectionBox | null) => void
}

export function GameScene({
  deploymentBatch,
  economyState,
  onEconomyStateChange,
  onControlPointsChange,
  onSelectionBoxChange,
}: GameSceneProps) {
  const { camera, gl } = useThree()
  const [units, setUnits] = useState<UnitData[]>(initialUnits)
  const [controlPoints, setControlPoints] = useState<ControlPointState[]>(initialControlPoints)
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([])
  const [unitTargets, setUnitTargets] = useState<UnitTargetMap>(() => createInitialTargets(initialUnits))
  const [attackTargets, setAttackTargets] = useState<UnitAttackTargetMap>(() =>
    createInitialAttackTargets(initialUnits),
  )
  const [shots, setShots] = useState<ActiveCombatShot[]>([])
  const unitsRef = useRef(units)
  const controlPointsRef = useRef(controlPoints)
  const unitTargetsRef = useRef(unitTargets)
  const attackTargetsRef = useRef(attackTargets)
  const shotsRef = useRef(shots)
  const economyStateRef = useRef(economyState)
  const lastDeploymentBatchIdRef = useRef<number | null>(null)
  const dragSelectionRef = useRef<{
    startWorld: MapPosition
    startScreen: ScreenPoint
    currentScreen: ScreenPoint
    isDragging: boolean
  } | null>(null)

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
    attackTargetsRef.current = attackTargets
  }, [attackTargets])

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

      setAttackTargets((currentTargets) => {
        const nextTargets = { ...currentTargets }

        for (const unit of spawnedUnits) {
          nextTargets[unit.id] = null
        }

        attackTargetsRef.current = nextTargets
        return nextTargets
      })

      return nextUnits
    })
  }, [deploymentBatch])

  useEffect(() => {
    onControlPointsChange(controlPoints)
  }, [controlPoints, onControlPointsChange])

  useEffect(() => {
    return () => {
      onSelectionBoxChange(null)
    }
  }, [onSelectionBoxChange])

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
    const result = simulateUnitCombatStep(
      unitsRef.current,
      unitTargetsRef.current,
      attackTargetsRef.current,
      delta,
    )
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

      setAttackTargets((currentTargets) => {
        let hasChanges = false
        const nextTargets = { ...currentTargets }

        for (const unitId of removedIds) {
          if (unitId in nextTargets) {
            delete nextTargets[unitId]
            hasChanges = true
          }
        }

        for (const [unitId, targetUnitId] of Object.entries(nextTargets)) {
          if (targetUnitId && removedIds.has(targetUnitId)) {
            nextTargets[unitId] = null
            hasChanges = true
          }
        }

        if (!hasChanges) {
          return currentTargets
        }

        attackTargetsRef.current = nextTargets
        return nextTargets
      })

      if (removedIds.size > 0) {
        setSelectedUnitIds((currentSelectedUnitIds) =>
          currentSelectedUnitIds.filter((unitId) => !removedIds.has(unitId)),
        )
      }
    }
  })

  function handleGroundPointerDown(position: MapPosition, pointer: ScreenPoint) {
    dragSelectionRef.current = {
      startWorld: position,
      startScreen: pointer,
      currentScreen: pointer,
      isDragging: false,
    }
  }

  useEffect(() => {
    const dragThreshold = 8
    const groundPlane = new Plane(new Vector3(0, 1, 0), 0)
    const raycaster = new Raycaster()
    const pointer = new Vector2()
    const intersection = new Vector3()

    function projectClientPoint(clientPoint: ScreenPoint) {
      const rect = gl.domElement.getBoundingClientRect()

      return {
        x: clientPoint.x - rect.left,
        y: clientPoint.y - rect.top,
        width: rect.width,
        height: rect.height,
      }
    }

    function createWorldPointFromClient(clientPoint: ScreenPoint): MapPosition | null {
      const projectedPoint = projectClientPoint(clientPoint)

      if (
        projectedPoint.x < 0 ||
        projectedPoint.y < 0 ||
        projectedPoint.x > projectedPoint.width ||
        projectedPoint.y > projectedPoint.height
      ) {
        return null
      }

      pointer.set(
        (projectedPoint.x / projectedPoint.width) * 2 - 1,
        -(projectedPoint.y / projectedPoint.height) * 2 + 1,
      )
      raycaster.setFromCamera(pointer, camera)

      if (!raycaster.ray.intersectPlane(groundPlane, intersection)) {
        return null
      }

      return [intersection.x, 0, intersection.z]
    }

    function projectUnitToClientPosition(position: MapPosition): ScreenPoint {
      const worldPosition = new Vector3(position[0], position[1] + 0.3, position[2])
      const projected = worldPosition.project(camera)
      const rect = gl.domElement.getBoundingClientRect()

      return {
        x: ((projected.x + 1) / 2) * rect.width + rect.left,
        y: ((-projected.y + 1) / 2) * rect.height + rect.top,
      }
    }

    function handlePointerMove(event: PointerEvent) {
      const activeDrag = dragSelectionRef.current

      if (!activeDrag) {
        return
      }

      activeDrag.currentScreen = {
        x: event.clientX,
        y: event.clientY,
      }

      const deltaX = activeDrag.currentScreen.x - activeDrag.startScreen.x
      const deltaY = activeDrag.currentScreen.y - activeDrag.startScreen.y
      const dragDistance = Math.hypot(deltaX, deltaY)

      if (dragDistance < dragThreshold && !activeDrag.isDragging) {
        return
      }

      activeDrag.isDragging = true
      onSelectionBoxChange({
        start: activeDrag.startScreen,
        end: activeDrag.currentScreen,
      })
    }

    function handlePointerUp(event: PointerEvent) {
      const activeDrag = dragSelectionRef.current

      if (!activeDrag || event.button !== 0) {
        return
      }

      dragSelectionRef.current = null
      onSelectionBoxChange(null)

      if (activeDrag.isDragging) {
        const minX = Math.min(activeDrag.startScreen.x, activeDrag.currentScreen.x)
        const maxX = Math.max(activeDrag.startScreen.x, activeDrag.currentScreen.x)
        const minY = Math.min(activeDrag.startScreen.y, activeDrag.currentScreen.y)
        const maxY = Math.max(activeDrag.startScreen.y, activeDrag.currentScreen.y)

        const selectedPlayerUnitIds = unitsRef.current
          .filter((unit) => unit.team === 'player')
          .filter((unit) => {
            const unitClientPosition = projectUnitToClientPosition(unit.position)

            return (
              unitClientPosition.x >= minX &&
              unitClientPosition.x <= maxX &&
              unitClientPosition.y >= minY &&
              unitClientPosition.y <= maxY
            )
          })
          .map((unit) => unit.id)

        setSelectedUnitIds(selectedPlayerUnitIds)
        return
      }

      const targetPosition = createWorldPointFromClient({
        x: event.clientX,
        y: event.clientY,
      })

      if (!targetPosition) {
        return
      }

      handleGroundClick(targetPosition)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [camera, gl, onSelectionBoxChange, selectedUnitIds])

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

    setAttackTargets((currentTargets) => {
      const nextTargets = { ...currentTargets }

      for (const unitId of selectedUnitIds) {
        if (!(unitId in nextTargets)) {
          continue
        }

        nextTargets[unitId] = null
      }

      attackTargetsRef.current = nextTargets
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

  function handleEnemyTarget(targetUnitId: string) {
    if (selectedUnitIds.length === 0) {
      return
    }

    setAttackTargets((currentTargets) => {
      const nextTargets = { ...currentTargets }

      for (const unitId of selectedUnitIds) {
        if (!(unitId in nextTargets)) {
          continue
        }

        nextTargets[unitId] = targetUnitId
      }

      attackTargetsRef.current = nextTargets
      return nextTargets
    })
  }

  return (
    <>
      <color attach="background" args={['#06080d']} />
      <fog attach="fog" args={['#06080d', 18, 36]} />
      <TopDownCamera />
      <SceneLights />
      <Ground onGroundPointerDown={handleGroundPointerDown} />
      <MapLayout controlPoints={controlPoints} />
      <CombatShots shots={shots} />
      {units.map((unit) => (
        <CombatUnit
          key={unit.id}
          unit={unit}
          isSelected={unit.team === 'player' && selectedUnitIds.includes(unit.id)}
          onEnemyTarget={handleEnemyTarget}
          onSelect={handleUnitSelect}
        />
      ))}
    </>
  )
}
