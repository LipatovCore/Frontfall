import { Canvas } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import { createInitialControlPointStates } from '../scene/systems/controlPointCapture'
import { enemyAiConfig, planEnemyWaveQueue } from '../scene/systems/enemyAi'
import { createInitialEconomyState } from '../scene/systems/manpowerEconomy'
import {
  createInitialPlayerUnlockState,
  isPlayerUnitDefinitionUnlocked,
  syncPlayerUnlockState,
} from '../scene/systems/playerUnlocks'
import {
  createDeploymentBatch,
  createPlayerDeploymentBatch,
  getPlayerReinforcementDefinition,
  queuePlayerWaveUnit,
} from '../scene/systems/waveDeployment'
import { mapConfig } from '../shared/config/mapConfig'
import { reinforcementConfig } from '../shared/config/reinforcements'
import type { SelectionBox } from '../shared/types/selection'
import type { DeploymentBatch, WaveQueueItem } from '../shared/types/reinforcements'
import type { PlayerUnlockState } from '../shared/types/unlocks'
import { GameScene } from '../scene/GameScene'
import { ManpowerHud } from './ManpowerHud'
import { ReinforcementPanel } from './ReinforcementPanel'

function getSelectionBoxStyle(selectionBox: SelectionBox | null) {
  if (!selectionBox) {
    return null
  }

  const left = Math.min(selectionBox.start.x, selectionBox.end.x)
  const top = Math.min(selectionBox.start.y, selectionBox.end.y)
  const width = Math.abs(selectionBox.end.x - selectionBox.start.x)
  const height = Math.abs(selectionBox.end.y - selectionBox.start.y)

  return {
    left,
    top,
    width,
    height,
  }
}

export function AppShell() {
  const [economyState, setEconomyState] = useState(() => createInitialEconomyState())
  const [controlPoints, setControlPoints] = useState(() =>
    createInitialControlPointStates(mapConfig.controlPoints),
  )
  const [waveQueue, setWaveQueue] = useState<WaveQueueItem[]>([])
  const [enemyWaveQueue, setEnemyWaveQueue] = useState<WaveQueueItem[]>([])
  const [waveTimerSeconds, setWaveTimerSeconds] = useState(reinforcementConfig.waveIntervalSeconds)
  const [deploymentCycle, setDeploymentCycle] = useState(1)
  const [deploymentBatches, setDeploymentBatches] = useState<DeploymentBatch[]>([])
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null)
  const [playerUnlockState, setPlayerUnlockState] = useState<PlayerUnlockState>(() =>
    createInitialPlayerUnlockState(),
  )
  const economyStateRef = useRef(economyState)
  const waveQueueRef = useRef(waveQueue)
  const enemyWaveQueueRef = useRef(enemyWaveQueue)
  const enemyQueueTickElapsedRef = useRef(0)

  const selectionBoxStyle = getSelectionBoxStyle(selectionBox)

  useEffect(() => {
    economyStateRef.current = economyState
  }, [economyState])

  useEffect(() => {
    waveQueueRef.current = waveQueue
  }, [waveQueue])

  useEffect(() => {
    enemyWaveQueueRef.current = enemyWaveQueue
  }, [enemyWaveQueue])

  useEffect(() => {
    setPlayerUnlockState((currentUnlockState) =>
      syncPlayerUnlockState(currentUnlockState, controlPoints),
    )
  }, [controlPoints])

  useEffect(() => {
    let lastTimestamp = performance.now()

    const intervalId = window.setInterval(() => {
      const now = performance.now()
      const deltaSeconds = (now - lastTimestamp) / 1000
      lastTimestamp = now
      enemyQueueTickElapsedRef.current += deltaSeconds

      if (enemyQueueTickElapsedRef.current >= enemyAiConfig.queueIntervalSeconds) {
        enemyQueueTickElapsedRef.current -= enemyAiConfig.queueIntervalSeconds

        const queuePlan = planEnemyWaveQueue(
          economyStateRef.current,
          enemyWaveQueueRef.current,
        )

        if (queuePlan.queuedUnits > 0) {
          economyStateRef.current = queuePlan.nextEconomyState
          enemyWaveQueueRef.current = queuePlan.nextWaveQueue
          setEconomyState(queuePlan.nextEconomyState)
          setEnemyWaveQueue(queuePlan.nextWaveQueue)
        }
      }

      setWaveTimerSeconds((currentTimer) => {
        const nextTimer = currentTimer - deltaSeconds

        if (nextTimer > 0) {
          return nextTimer
        }

        setDeploymentCycle((currentCycle) => {
          const nextCycle = currentCycle + 1
          const nextDeploymentBatches = [
            createPlayerDeploymentBatch(waveQueueRef.current, currentCycle),
            createDeploymentBatch('enemy', enemyWaveQueueRef.current, currentCycle),
          ].filter((batch): batch is DeploymentBatch => batch !== null)

          if (nextDeploymentBatches.length > 0) {
            setDeploymentBatches(nextDeploymentBatches)
          }

          waveQueueRef.current = []
          enemyWaveQueueRef.current = []
          setWaveQueue([])
          setEnemyWaveQueue([])

          return nextCycle
        })

        return reinforcementConfig.waveIntervalSeconds
      })
    }, 100)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [])

  function handleQueueUnit(definitionId: string) {
    const definition = getPlayerReinforcementDefinition(definitionId)

    if (!definition) {
      return
    }

    const result = queuePlayerWaveUnit(
      economyStateRef.current,
      waveQueueRef.current,
      definition,
      isPlayerUnitDefinitionUnlocked(playerUnlockState, definition.id),
    )

    if (!result.queued) {
      return
    }

    economyStateRef.current = result.nextEconomyState
    waveQueueRef.current = result.nextWaveQueue
    setEconomyState(result.nextEconomyState)
    setWaveQueue(result.nextWaveQueue)
  }

  return (
    <main className="app-shell">
      <section
        className="scene-shell"
        aria-label="Frontfall tactical prototype"
      >
        <ManpowerHud economyState={economyState} controlPoints={controlPoints} />
        <ReinforcementPanel
          deploymentCycle={deploymentCycle}
          economyState={economyState}
          playerUnlockState={playerUnlockState}
          waveQueue={waveQueue}
          waveTimerSeconds={waveTimerSeconds}
          onQueueUnit={handleQueueUnit}
        />
        {selectionBoxStyle ? (
          <div
            className="selection-box"
            style={{
              left: selectionBoxStyle.left,
              top: selectionBoxStyle.top,
              width: selectionBoxStyle.width,
              height: selectionBoxStyle.height,
            }}
            aria-hidden="true"
          />
        ) : null}
        <Canvas shadows dpr={[1, 1.5]}>
          <GameScene
            deploymentBatches={deploymentBatches}
            economyState={economyState}
            onEconomyStateChange={setEconomyState}
            onControlPointsChange={setControlPoints}
            onSelectionBoxChange={setSelectionBox}
          />
        </Canvas>
      </section>
    </main>
  )
}
