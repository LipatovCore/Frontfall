import { TopDownCamera } from './camera/TopDownCamera'
import { SceneLights } from './world/SceneLights'
import { Ground } from './world/Ground'
import { MapLayout } from './world/MapLayout'

export function GameScene() {
  return (
    <>
      <color attach="background" args={['#06080d']} />
      <fog attach="fog" args={['#06080d', 18, 36]} />
      <TopDownCamera />
      <SceneLights />
      <Ground />
      <MapLayout />
    </>
  )
}
