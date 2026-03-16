import { Canvas } from '@react-three/fiber'
import { useState } from 'react'
import { createInitialControlPointStates } from '../scene/systems/controlPointCapture'
import { createInitialEconomyState } from '../scene/systems/manpowerEconomy'
import { mapConfig } from '../shared/config/mapConfig'
import { GameScene } from '../scene/GameScene'
import { ManpowerHud } from './ManpowerHud'

export function AppShell() {
  const [economyState, setEconomyState] = useState(() => createInitialEconomyState())
  const [controlPoints, setControlPoints] = useState(() =>
    createInitialControlPointStates(mapConfig.controlPoints),
  )

  return (
    <main className="app-shell">
      <section className="scene-shell" aria-label="Frontfall tactical prototype">
        <ManpowerHud economyState={economyState} controlPoints={controlPoints} />
        <Canvas shadows dpr={[1, 1.5]}>
          <GameScene
            economyState={economyState}
            onEconomyStateChange={setEconomyState}
            onControlPointsChange={setControlPoints}
          />
        </Canvas>
      </section>
    </main>
  )
}
