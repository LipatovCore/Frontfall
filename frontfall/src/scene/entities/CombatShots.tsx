import { Line } from '@react-three/drei'
import type { MapPosition } from '../../shared/types/map'
import type { UnitTeam } from '../../shared/types/unit'

export type CombatShot = {
  id: string
  from: MapPosition
  to: MapPosition
  team: UnitTeam
}

type CombatShotsProps = {
  shots: CombatShot[]
}

const shotColors: Record<UnitTeam, string> = {
  player: '#8fd8ff',
  enemy: '#ff9a8b',
}

export function CombatShots({ shots }: CombatShotsProps) {
  return (
    <group name="combat-shots">
      {shots.map((shot) => (
        <Line
          key={shot.id}
          points={[shot.from, shot.to]}
          color={shotColors[shot.team]}
          lineWidth={2.2}
          transparent
          opacity={0.95}
        />
      ))}
    </group>
  )
}
