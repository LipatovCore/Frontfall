import { mapConfig } from '../../shared/config/mapConfig'
import type { MapPosition } from '../../shared/types/map'
import { ControlPoint } from '../entities/ControlPoint'
import { EnemyBase } from '../entities/EnemyBase'
import { PlayerBase } from '../entities/PlayerBase'

const boundaryBeaconPositions: MapPosition[] = [
  [-10.5, 0, -12],
  [10.5, 0, -12],
  [-10.5, 0, 12],
  [10.5, 0, 12],
]

function MapMarkings() {
  return (
    <group name="map-markings">
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[3.4, 24]} />
        <meshStandardMaterial color={mapConfig.colors.lane} />
      </mesh>

      <mesh position={[-6.25, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.32, 22]} />
        <meshStandardMaterial color={mapConfig.colors.border} />
      </mesh>

      <mesh position={[6.25, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.32, 22]} />
        <meshStandardMaterial color={mapConfig.colors.border} />
      </mesh>
    </group>
  )
}

function GreyboxProps() {
  return (
    <group name="greybox-props">
      {mapConfig.props.map((prop) => (
        <mesh
          key={prop.id}
          position={prop.position}
          castShadow
          receiveShadow
          name={prop.id}
        >
          <boxGeometry args={prop.size} />
          <meshStandardMaterial color={mapConfig.colors.prop} />
        </mesh>
      ))}
    </group>
  )
}

function BoundaryBeacons() {
  return (
    <group name="boundary-beacons">
      {boundaryBeaconPositions.map((position, index) => (
        <group key={`beacon-${index}`} position={position}>
          <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.5, 0.9, 0.5]} />
            <meshStandardMaterial color="#4b5668" />
          </mesh>
          <mesh position={[0, 1.02, 0]}>
            <boxGeometry args={[0.22, 0.22, 0.22]} />
            <meshStandardMaterial color="#8ec5ff" />
          </mesh>
        </group>
      ))}
    </group>
  )
}

export function MapLayout() {
  return (
    <group name="map-layout">
      <MapMarkings />
      <GreyboxProps />
      <BoundaryBeacons />
      <PlayerBase base={mapConfig.playerBase} />
      <EnemyBase base={mapConfig.enemyBase} />
      {mapConfig.controlPoints.map((point) => (
        <ControlPoint key={point.id} point={point} />
      ))}
    </group>
  )
}
