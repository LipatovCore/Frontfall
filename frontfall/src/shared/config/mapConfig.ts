import type { TacticalMapConfig } from '../types/map'

const controlPointSlots = [
  [-5.8, 0, -4.8],
  [-2.6, 0, -5.6],
  [2.6, 0, -5.2],
  [5.8, 0, -4.4],
  [-6.6, 0, -0.8],
  [-3.2, 0, -0.2],
  [3.1, 0, 0.4],
  [6.5, 0, -0.4],
  [-5.4, 0, 4.4],
  [-2.2, 0, 5.4],
  [2.4, 0, 5.1],
  [5.6, 0, 4.2],
] as const

function shufflePositions<T>(items: readonly T[]) {
  const shuffled = [...items]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    const current = shuffled[index]

    shuffled[index] = shuffled[swapIndex]
    shuffled[swapIndex] = current
  }

  return shuffled
}

const randomPointPositions = shufflePositions(controlPointSlots).slice(0, 4)

export const mapConfig = {
  size: {
    width: 24,
    depth: 28,
  },
  colors: {
    surface: '#151b24',
    lane: '#1d2631',
    border: '#2b3644',
    prop: '#4f5a69',
  },
  playerBase: {
    id: 'player-main-base',
    position: [0, 0, 9],
  },
  enemyBase: {
    id: 'enemy-main-base',
    position: [0, 0, -9],
  },
  controlPoints: [
    {
      id: 'unlock-spire',
      type: 'unlock',
      variant: 'spire',
      position: randomPointPositions[0],
    },
    {
      id: 'unlock-vault',
      type: 'unlock',
      variant: 'vault',
      position: randomPointPositions[1],
    },
    {
      id: 'resource-crystal',
      type: 'resource',
      variant: 'crystal',
      position: randomPointPositions[2],
    },
    {
      id: 'resource-relay',
      type: 'resource',
      variant: 'relay',
      position: randomPointPositions[3],
    },
  ],
  props: [
    {
      id: 'cover-west-north',
      position: [-7.2, 0.45, -1.6],
      size: [1.4, 0.9, 2.4],
    },
    {
      id: 'cover-east-north',
      position: [7.2, 0.45, -1.6],
      size: [1.4, 0.9, 2.4],
    },
    {
      id: 'cover-west-south',
      position: [-7.2, 0.45, 1.6],
      size: [1.4, 0.9, 2.4],
    },
    {
      id: 'cover-east-south',
      position: [7.2, 0.45, 1.6],
      size: [1.4, 0.9, 2.4],
    },
  ],
} satisfies TacticalMapConfig
