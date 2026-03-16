import type { ThreeEvent } from '@react-three/fiber'
import { mapConfig } from '../../shared/config/mapConfig'
import type { MapPosition } from '../../shared/types/map'
import type { ScreenPoint } from '../../shared/types/selection'

type GroundProps = {
  onGroundPointerDown?: (position: MapPosition, pointer: ScreenPoint) => void
}

export function Ground({ onGroundPointerDown }: GroundProps) {
  function handlePointerDown(event: ThreeEvent<PointerEvent>) {
    if (!onGroundPointerDown || event.button !== 0) {
      return
    }

    event.stopPropagation()
    onGroundPointerDown([event.point.x, 0, event.point.z], {
      x: event.clientX,
      y: event.clientY,
    })
  }

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
      position={[0, 0, 0]}
      name="ground"
      onPointerDown={handlePointerDown}
    >
      <planeGeometry args={[mapConfig.size.width, mapConfig.size.depth]} />
      <meshStandardMaterial color={mapConfig.colors.surface} />
    </mesh>
  )
}
