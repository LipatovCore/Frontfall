import { Canvas } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import { createInitialBaseCores } from '../scene/systems/baseCores'
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
import type { GamePhase } from '../shared/types/game'
import type { BaseCoreState, ControlPointState } from '../shared/types/map'
import type { SelectionBox } from '../shared/types/selection'
import type { DeploymentBatch, WaveQueueItem } from '../shared/types/reinforcements'
import type { PlayerUnlockState } from '../shared/types/unlocks'
import { GameScene } from '../scene/GameScene'
import { ManpowerHud } from './ManpowerHud'
import { ReinforcementPanel } from './ReinforcementPanel'

type MatchState = {
  baseCores: BaseCoreState[]
  controlPoints: ControlPointState[]
  deploymentBatches: DeploymentBatch[]
  deploymentCycle: number
  economyState: ReturnType<typeof createInitialEconomyState>
  enemyWaveQueue: WaveQueueItem[]
  gamePhase: GamePhase
  playerUnlockState: PlayerUnlockState
  selectionBox: SelectionBox | null
  waveQueue: WaveQueueItem[]
  waveTimerSeconds: number
}

function createInitialMatchState(initialPhase: GamePhase = 'ready'): MatchState {
  return {
    baseCores: createInitialBaseCores(),
    controlPoints: createInitialControlPointStates(mapConfig.controlPoints),
    deploymentBatches: [],
    deploymentCycle: 1,
    economyState: createInitialEconomyState(),
    enemyWaveQueue: [],
    gamePhase: initialPhase,
    playerUnlockState: createInitialPlayerUnlockState(),
    selectionBox: null,
    waveQueue: [],
    waveTimerSeconds: reinforcementConfig.waveIntervalSeconds,
  }
}

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
  const initialState = createInitialMatchState()
  const [economyState, setEconomyState] = useState(initialState.economyState)
  const [controlPoints, setControlPoints] = useState(initialState.controlPoints)
  const [baseCores, setBaseCores] = useState(initialState.baseCores)
  const [waveQueue, setWaveQueue] = useState<WaveQueueItem[]>(initialState.waveQueue)
  const [enemyWaveQueue, setEnemyWaveQueue] = useState<WaveQueueItem[]>(initialState.enemyWaveQueue)
  const [waveTimerSeconds, setWaveTimerSeconds] = useState(initialState.waveTimerSeconds)
  const [deploymentCycle, setDeploymentCycle] = useState(initialState.deploymentCycle)
  const [deploymentBatches, setDeploymentBatches] = useState<DeploymentBatch[]>(initialState.deploymentBatches)
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(initialState.selectionBox)
  const [playerUnlockState, setPlayerUnlockState] = useState<PlayerUnlockState>(
    initialState.playerUnlockState,
  )
  const [gamePhase, setGamePhase] = useState<GamePhase>(initialState.gamePhase)
  const [matchRunId, setMatchRunId] = useState(1)
  const economyStateRef = useRef(economyState)
  const waveQueueRef = useRef(waveQueue)
  const enemyWaveQueueRef = useRef(enemyWaveQueue)
  const gamePhaseRef = useRef(gamePhase)
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
    gamePhaseRef.current = gamePhase
  }, [gamePhase])

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

      if (gamePhaseRef.current !== 'playing') {
        return
      }

      enemyQueueTickElapsedRef.current += deltaSeconds

      if (enemyQueueTickElapsedRef.current >= enemyAiConfig.queueIntervalSeconds) {
        enemyQueueTickElapsedRef.current -= enemyAiConfig.queueIntervalSeconds

        const queuePlan = planEnemyWaveQueue(economyStateRef.current, enemyWaveQueueRef.current)

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
    if (gamePhase !== 'playing') {
      return
    }

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

  function handleGamePhaseChange(nextPhase: GamePhase) {
    setGamePhase((currentPhase) => (currentPhase === 'playing' ? nextPhase : currentPhase))
  }

  function handleStartMatch() {
    setGamePhase('playing')
    gamePhaseRef.current = 'playing'
  }

  function handleRestart() {
    const nextState = createInitialMatchState('playing')

    setBaseCores(nextState.baseCores)
    setControlPoints(nextState.controlPoints)
    setDeploymentBatches(nextState.deploymentBatches)
    setDeploymentCycle(nextState.deploymentCycle)
    setEconomyState(nextState.economyState)
    setEnemyWaveQueue(nextState.enemyWaveQueue)
    setGamePhase(nextState.gamePhase)
    setPlayerUnlockState(nextState.playerUnlockState)
    setSelectionBox(nextState.selectionBox)
    setWaveQueue(nextState.waveQueue)
    setWaveTimerSeconds(nextState.waveTimerSeconds)

    economyStateRef.current = nextState.economyState
    waveQueueRef.current = nextState.waveQueue
    enemyWaveQueueRef.current = nextState.enemyWaveQueue
    enemyQueueTickElapsedRef.current = 0
    gamePhaseRef.current = nextState.gamePhase
    setMatchRunId((currentId) => currentId + 1)
  }

  const enemyBase = baseCores.find((base) => base.team === 'enemy') ?? null
  const playerBase = baseCores.find((base) => base.team === 'player') ?? null
  const matchResultTitle = gamePhase === 'victory' ? 'Victory' : gamePhase === 'defeat' ? 'Defeat' : null

  return (
    <main className="app-shell">
      <section className="scene-shell" aria-label="Frontfall tactical prototype">
        <ManpowerHud economyState={economyState} controlPoints={controlPoints} />
        <ReinforcementPanel
          deploymentCycle={deploymentCycle}
          economyState={economyState}
          gamePhase={gamePhase}
          isInteractive={gamePhase === 'playing'}
          playerUnlockState={playerUnlockState}
          waveQueue={waveQueue}
          waveTimerSeconds={waveTimerSeconds}
          onQueueUnit={handleQueueUnit}
        />

        {playerBase && enemyBase ? (
          <aside className="base-health-hud" aria-label="Base health">
            <div className="base-health-card base-health-card-player">
              <span>Player Core</span>
              <strong>{Math.ceil(playerBase.currentHealth)} / {playerBase.maxHealth}</strong>
            </div>
            <div className="base-health-card base-health-card-enemy">
              <span>Enemy Core</span>
              <strong>{Math.ceil(enemyBase.currentHealth)} / {enemyBase.maxHealth}</strong>
            </div>
          </aside>
        ) : null}

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

        {gamePhase === 'ready' ? (
          <div className="game-over-overlay" role="dialog" aria-modal="true" aria-label="Start match">
            <div className="game-over-card">
              <h2>Frontfall</h2>
              <button type="button" onClick={handleStartMatch}>
                Start
              </button>
            </div>
          </div>
        ) : null}

        {matchResultTitle ? (
          <div className="game-over-overlay" role="dialog" aria-modal="true" aria-label="Match ended">
            <div className="game-over-card">
              <h2>{matchResultTitle}</h2>
              <button type="button" onClick={handleRestart}>
                Restart
              </button>
            </div>
          </div>
        ) : null}

        <Canvas key={`match-${matchRunId}`} shadows dpr={[1, 1.5]}>
          <GameScene
            baseCores={baseCores}
            deploymentBatches={deploymentBatches}
            economyState={economyState}
            gamePhase={gamePhase}
            onBaseCoresChange={setBaseCores}
            onEconomyStateChange={setEconomyState}
            onControlPointsChange={setControlPoints}
            onGamePhaseChange={handleGamePhaseChange}
            onSelectionBoxChange={setSelectionBox}
          />
        </Canvas>
      </section>
    </main>
  )
}
