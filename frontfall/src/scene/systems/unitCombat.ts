import type { BaseCoreState, MapPosition } from '../../shared/types/map'
import type { UnitData } from '../../shared/types/unit'
import { moveUnitTowardsTarget } from './unitMovement'

export type UnitTargetMap = Record<string, MapPosition | null>
export type UnitAttackTargetMap = Record<string, string | null>

export type CombatSimulationResult = {
  units: UnitData[]
  bases: BaseCoreState[]
  changed: boolean
  reachedTargetUnitIds: string[]
  removedUnitIds: string[]
  destroyedBaseIds: string[]
  attacks: CombatAttackEvent[]
}

type PendingDamageMap = Record<string, number>

type AttackableTarget = {
  id: string
  team: UnitData['team']
  position: MapPosition
  targetRadius: number
}

export type CombatAttackEvent = {
  attackerId: string
  targetId: string
  attackerTeam: UnitData['team']
  from: MapPosition
  to: MapPosition
}

const unitTargetRadius = 0.35
const baseTargetRadius = 1.8

function cloneUnit(unit: UnitData): UnitData {
  return {
    ...unit,
    position: [...unit.position] as MapPosition,
  }
}

function cloneBase(base: BaseCoreState): BaseCoreState {
  return {
    ...base,
    position: [...base.position] as MapPosition,
  }
}

function getDistanceSquared(from: MapPosition, to: MapPosition) {
  const dx = to[0] - from[0]
  const dz = to[2] - from[2]
  return dx * dx + dz * dz
}

function toAttackableUnit(unit: UnitData): AttackableTarget {
  return {
    id: unit.id,
    team: unit.team,
    position: unit.position,
    targetRadius: unitTargetRadius,
  }
}

function toAttackableBase(base: BaseCoreState): AttackableTarget {
  return {
    id: base.id,
    team: base.team,
    position: base.position,
    targetRadius: baseTargetRadius,
  }
}

function getEffectiveDistanceSquared(unit: UnitData, target: AttackableTarget) {
  const centerDistanceSquared = getDistanceSquared(unit.position, target.position)
  const centerDistance = Math.sqrt(centerDistanceSquared)
  const effectiveDistance = Math.max(0, centerDistance - target.targetRadius)
  return effectiveDistance * effectiveDistance
}

function findNearestEnemyInRange(unit: UnitData, targets: AttackableTarget[]) {
  let nearestEnemy: AttackableTarget | null = null
  let nearestDistanceSquared = unit.attackRange * unit.attackRange

  for (const candidate of targets) {
    if (candidate.id === unit.id || candidate.team === unit.team) {
      continue
    }

    const distanceSquared = getEffectiveDistanceSquared(unit, candidate)

    if (distanceSquared > nearestDistanceSquared) {
      continue
    }

    nearestDistanceSquared = distanceSquared
    nearestEnemy = candidate
  }

  return nearestEnemy
}

function findTargetedEnemy(unit: UnitData, targets: AttackableTarget[], targetId: string | null) {
  if (!targetId) {
    return null
  }

  const target = targets.find((candidate) => candidate.id === targetId) ?? null

  if (!target || target.team === unit.team) {
    return null
  }

  return target
}

function isUnitInAttackRange(unit: UnitData, target: AttackableTarget) {
  return getEffectiveDistanceSquared(unit, target) <= unit.attackRange * unit.attackRange
}

export function simulateUnitCombatStep(
  units: UnitData[],
  bases: BaseCoreState[],
  unitTargets: UnitTargetMap,
  attackTargets: UnitAttackTargetMap,
  deltaSeconds: number,
): CombatSimulationResult {
  const nextUnits = units.map(cloneUnit)
  const nextBases = bases.map(cloneBase)
  const reachedTargetUnitIds: string[] = []
  const pendingDamage: PendingDamageMap = {}
  const attacks: CombatAttackEvent[] = []
  let changed = false

  const attackableTargets = [...nextUnits.map(toAttackableUnit), ...nextBases.map(toAttackableBase)]

  for (const unit of nextUnits) {
    const targetPosition = unitTargets[unit.id]
    const attackTarget = findTargetedEnemy(unit, attackableTargets, attackTargets[unit.id] ?? null)

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
    const prioritizedTarget = findTargetedEnemy(unit, attackableTargets, attackTargets[unit.id] ?? null)
    const target =
      prioritizedTarget && isUnitInAttackRange(unit, prioritizedTarget)
        ? prioritizedTarget
        : findNearestEnemyInRange(unit, attackableTargets)

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

  const nextBaseStates = nextBases.map((base) => {
    const damage = pendingDamage[base.id] ?? 0

    if (damage <= 0) {
      return base
    }

    const nextHealth = Math.max(0, base.currentHealth - damage)

    if (nextHealth !== base.currentHealth) {
      changed = true
    }

    return {
      ...base,
      currentHealth: nextHealth,
    }
  })

  const removedUnitIds = nextUnits
    .filter((unit) => !survivingUnits.some((survivingUnit) => survivingUnit.id === unit.id))
    .map((unit) => unit.id)
  const destroyedBaseIds = nextBaseStates
    .filter((base) => base.currentHealth <= 0)
    .map((base) => base.id)

  return {
    units: survivingUnits,
    bases: nextBaseStates,
    changed,
    reachedTargetUnitIds,
    removedUnitIds,
    destroyedBaseIds,
    attacks,
  }
}
