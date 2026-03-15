import type { ThreeEvent } from '@react-three/fiber'
import { mapConfig } from '../../shared/config/mapConfig'
import type { MapPosition } from '../../shared/types/map'

type GroundProps = {
  onGroundClick?: (position: MapPosition) => void
}

export function Ground({ onGroundClick }: GroundProps) {
  function handlePointerDown(event: ThreeEvent<PointerEvent>) {
    if (!onGroundClick) {
      return
    }

    event.stopPropagation()
    onGroundClick([event.point.x, 0, event.point.z])
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
