import type { MapPosition } from '../../shared/types/map'
import type { UnitData } from '../../shared/types/unit'
import { moveUnitTowardsTarget } from './unitMovement'

export type UnitTargetMap = Record<string, MapPosition | null>
export type UnitAttackTargetMap = Record<string, string | null>

export type CombatSimulationResult = {
  units: UnitData[]
  changed: boolean
  reachedTargetUnitIds: string[]
  removedUnitIds: string[]
  attacks: CombatAttackEvent[]
}

type PendingDamageMap = Record<string, number>

export type CombatAttackEvent = {
  attackerId: string
  targetId: string
  attackerTeam: UnitData['team']
  from: MapPosition
  to: MapPosition
}

function cloneUnit(unit: UnitData): UnitData {
  return {
    ...unit,
    position: [...unit.position] as MapPosition,
  }
}

function findNearestEnemyInRange(unit: UnitData, units: UnitData[]) {
  let nearestEnemy: UnitData | null = null
  let nearestDistanceSquared = unit.attackRange * unit.attackRange

  for (const candidate of units) {
    if (candidate.id === unit.id || candidate.team === unit.team) {
      continue
    }

    const dx = candidate.position[0] - unit.position[0]
    const dz = candidate.position[2] - unit.position[2]
    const distanceSquared = dx * dx + dz * dz

    if (distanceSquared > nearestDistanceSquared) {
      continue
    }

    nearestDistanceSquared = distanceSquared
    nearestEnemy = candidate
  }

  return nearestEnemy
}

function findTargetedEnemy(unit: UnitData, units: UnitData[], targetUnitId: string | null) {
  if (!targetUnitId) {
    return null
  }

  const target = units.find((candidate) => candidate.id === targetUnitId) ?? null

  if (!target || target.team === unit.team) {
    return null
  }

  return target
}

function isUnitInAttackRange(unit: UnitData, target: UnitData) {
  const dx = target.position[0] - unit.position[0]
  const dz = target.position[2] - unit.position[2]
  const distanceSquared = dx * dx + dz * dz

  return distanceSquared <= unit.attackRange * unit.attackRange
}

export function simulateUnitCombatStep(
  units: UnitData[],
  unitTargets: UnitTargetMap,
  attackTargets: UnitAttackTargetMap,
  deltaSeconds: number,
): CombatSimulationResult {
  const nextUnits = units.map(cloneUnit)
  const reachedTargetUnitIds: string[] = []
  const pendingDamage: PendingDamageMap = {}
  const attacks: CombatAttackEvent[] = []
  let changed = false

  for (const unit of nextUnits) {
    const targetPosition = unitTargets[unit.id]
    const attackTarget = findTargetedEnemy(unit, nextUnits, attackTargets[unit.id] ?? null)

    if (attackTarget && unit.moveSpeed > 0 && !isUnitInAttackRange(unit, attackTarget)) {
      const movement = moveUnitTowardsTarget(
        unit.position,
        attackTarget.position,
        deltaSeconds,
        unit.moveSpeed,
        Math.max(unit.stopDistance, unit.attackRange * 0.9),
      )

      unit.position = movement.position
      changed = true
    } else if (targetPosition && unit.moveSpeed > 0) {
      const movement = moveUnitTowardsTarget(
        unit.position,
        targetPosition,
        deltaSeconds,
        unit.moveSpeed,
        unit.stopDistance,
      )

      unit.position = movement.position

      if (movement.arrived) {
        reachedTargetUnitIds.push(unit.id)
      }

      changed = true
    }

    if (unit.attackCooldownRemaining > 0) {
      const nextCooldown = Math.max(0, unit.attackCooldownRemaining - deltaSeconds)

      if (nextCooldown !== unit.attackCooldownRemaining) {
        unit.attackCooldownRemaining = nextCooldown
        changed = true
      }
    }
  }

  for (const unit of nextUnits) {
    const prioritizedTarget = findTargetedEnemy(unit, nextUnits, attackTargets[unit.id] ?? null)
    const target =
      prioritizedTarget && isUnitInAttackRange(unit, prioritizedTarget)
        ? prioritizedTarget
        : findNearestEnemyInRange(unit, nextUnits)

    if (!target || unit.attackCooldownRemaining > 0) {
      continue
    }

    pendingDamage[target.id] = (pendingDamage[target.id] ?? 0) + unit.attackDamage
    unit.attackCooldownRemaining = unit.attackCooldown
    attacks.push({
      attackerId: unit.id,
      targetId: target.id,
      attackerTeam: unit.team,
      from: [unit.position[0], unit.position[1] + 0.55, unit.position[2]],
      to: [target.position[0], target.position[1] + 0.55, target.position[2]],
    })
    changed = true
  }

  const survivingUnits = nextUnits.filter((unit) => {
    const damage = pendingDamage[unit.id] ?? 0

    if (damage === 0) {
      return true
    }

    unit.currentHealth = Math.max(0, unit.currentHealth - damage)
    changed = true
    return unit.currentHealth > 0
  })

  const removedUnitIds = nextUnits
    .filter((unit) => !survivingUnits.some((survivingUnit) => survivingUnit.id === unit.id))
    .map((unit) => unit.id)

  return {
    units: survivingUnits,
    changed,
    reachedTargetUnitIds,
    removedUnitIds,
    attacks,
  }
}
