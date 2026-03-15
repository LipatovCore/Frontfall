import type { ControlPointData } from '../../shared/types/map'

type ControlPointProps = {
  point: ControlPointData
}

export function ControlPoint({ point }: ControlPointProps) {
  const isResource = point.type === 'resource'
  const padColor = isResource ? '#1f3a36' : '#3a3020'
  const accentColor = isResource ? '#58d6b2' : '#ffd166'
  const detailColor = isResource ? '#b1fff0' : '#fff2b6'

  function renderVariant() {
    switch (point.variant) {
      case 'spire':
        return (
          <>
            <mesh position={[0, 0.24, 0]} castShadow>
              <cylinderGeometry args={[0.18, 0.18, 0.3, 16]} />
              <meshStandardMaterial color={detailColor} />
            </mesh>
            <mesh position={[0, 0.62, 0]} castShadow>
              <coneGeometry args={[0.48, 1.08, 24]} />
              <meshStandardMaterial color={accentColor} />
            </mesh>
            <mesh position={[0, 1.22, 0]} castShadow>
              <sphereGeometry args={[0.12, 18, 18]} />
              <meshStandardMaterial color={detailColor} />
            </mesh>
          </>
        )

      case 'vault':
        return (
          <>
            <mesh position={[0, 0.32, 0]} castShadow>
              <boxGeometry args={[0.92, 0.42, 0.92]} />
              <meshStandardMaterial color={accentColor} />
            </mesh>
            <mesh position={[0, 0.74, 0]} castShadow rotation={[0, Math.PI / 4, 0]}>
              <boxGeometry args={[0.48, 0.48, 0.48]} />
              <meshStandardMaterial color={detailColor} />
            </mesh>
          </>
        )

      case 'crystal':
        return (
          <>
            <mesh position={[0, 0.2, 0]} castShadow>
              <cylinderGeometry args={[0.2, 0.24, 0.22, 16]} />
              <meshStandardMaterial color={detailColor} />
            </mesh>
            <mesh position={[0, 0.74, 0]} castShadow>
              <octahedronGeometry args={[0.54, 0]} />
              <meshStandardMaterial color={accentColor} />
            </mesh>
          </>
        )

      case 'relay':
        return (
          <>
            <mesh position={[0, 0.52, 0]} castShadow>
              <cylinderGeometry args={[0.24, 0.32, 0.78, 20]} />
              <meshStandardMaterial color={accentColor} />
            </mesh>
            <mesh position={[0, 1.08, 0]} castShadow>
              <sphereGeometry args={[0.18, 20, 20]} />
              <meshStandardMaterial color={detailColor} />
            </mesh>
            <mesh position={[0.42, 0.72, 0]} castShadow rotation={[0, 0, Math.PI / 2]}>
              <capsuleGeometry args={[0.08, 0.36, 4, 10]} />
              <meshStandardMaterial color={detailColor} />
            </mesh>
            <mesh position={[-0.42, 0.72, 0]} castShadow rotation={[0, 0, Math.PI / 2]}>
              <capsuleGeometry args={[0.08, 0.36, 4, 10]} />
              <meshStandardMaterial color={detailColor} />
            </mesh>
          </>
        )
    }
  }

  return (
    <group name={point.id} position={point.position}>
      <mesh position={[0, 0.1, 0]} receiveShadow>
        <cylinderGeometry args={[1.05, 1.15, 0.2, 24]} />
        <meshStandardMaterial color={padColor} />
      </mesh>

      {renderVariant()}
    </group>
  )
}
