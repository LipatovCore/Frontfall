import { controlPointRules } from '../../shared/config/controlPointRules'
import type { ControlPointOwner, ControlPointState } from '../../shared/types/map'

type ControlPointProps = {
  point: ControlPointState
}

const ownerColors: Record<ControlPointOwner, string> = {
  neutral: '#8f9aad',
  player: '#5c8fff',
  enemy: '#ff7f6d',
}

const contestedColor = '#ffd166'
const progressBarWidth = 1.28

export function ControlPoint({ point }: ControlPointProps) {
  const isResource = point.type === 'resource'
  const padColor = isResource ? '#1f3a36' : '#3a3020'
  const accentColor = isResource ? '#58d6b2' : '#ffd166'
  const detailColor = isResource ? '#b1fff0' : '#fff2b6'
  const ownerColor = ownerColors[point.owner]
  const captureProgressRatio = point.captureProgress / controlPointRules.captureProgressMax
  const fillScale = Math.abs(captureProgressRatio)
  const fillOffsetX = (captureProgressRatio * progressBarWidth) / 2
  const progressColor =
    point.captureProgress > 0
      ? ownerColors.player
      : point.captureProgress < 0
        ? ownerColors.enemy
        : ownerColor

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
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[point.captureRadius - 0.08, point.captureRadius, 48]} />
        <meshBasicMaterial color={ownerColor} transparent opacity={0.5} />
      </mesh>

      <mesh position={[0, 0.1, 0]} receiveShadow>
        <cylinderGeometry args={[1.05, 1.15, 0.2, 24]} />
        <meshStandardMaterial color={padColor} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.22, 0]}>
        <ringGeometry args={[0.88, 1.02, 40]} />
        <meshBasicMaterial color={ownerColor} transparent opacity={0.9} />
      </mesh>

      <group position={[0, 1.72, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <planeGeometry args={[progressBarWidth + 0.12, 0.22]} />
          <meshBasicMaterial color="#10161f" transparent opacity={0.88} />
        </mesh>

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <planeGeometry args={[0.02, 0.14]} />
          <meshBasicMaterial color="#324152" transparent opacity={0.95} />
        </mesh>

        {fillScale > 0 ? (
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[fillOffsetX, 0.02, 0]}
            scale={[fillScale, 1, 1]}
          >
            <planeGeometry args={[progressBarWidth, 0.1]} />
            <meshBasicMaterial color={progressColor} />
          </mesh>
        ) : null}

        {point.isContested ? (
          <group position={[0, 0.03, 0.28]}>
            <mesh rotation={[0, 0, Math.PI / 4]}>
              <boxGeometry args={[0.08, 0.34, 0.08]} />
              <meshBasicMaterial color={contestedColor} />
            </mesh>
            <mesh rotation={[0, 0, -Math.PI / 4]}>
              <boxGeometry args={[0.08, 0.34, 0.08]} />
              <meshBasicMaterial color={contestedColor} />
            </mesh>
          </group>
        ) : null}
      </group>

      {renderVariant()}
    </group>
  )
}
