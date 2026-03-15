import { Vector3 } from 'three'
import type { MapPosition } from '../../shared/types/map'

const targetVector = new Vector3()
const moveDirection = new Vector3()

export type UnitMovementResult = {
  arrived: boolean
}

export function moveUnitTowardsTarget(
  currentPosition: Vector3,
  targetPosition: MapPosition,
  deltaSeconds: number,
  moveSpeed: number,
  stopDistance: number,
): UnitMovementResult {
  targetVector.set(targetPosition[0], currentPosition.y, targetPosition[2])
  moveDirection.subVectors(targetVector, currentPosition)

  const distanceToTarget = moveDirection.length()

  if (distanceToTarget <= stopDistance) {
    currentPosition.set(targetPosition[0], currentPosition.y, targetPosition[2])
    return { arrived: true }
  }

  const stepDistance = Math.min(moveSpeed * deltaSeconds, distanceToTarget)
  moveDirection.normalize()
  currentPosition.addScaledVector(moveDirection, stepDistance)

  if (distanceToTarget - stepDistance <= stopDistance) {
    currentPosition.set(targetPosition[0], currentPosition.y, targetPosition[2])
    return { arrived: true }
  }

  return { arrived: false }
}
