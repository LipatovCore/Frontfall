export type PointType = 'resource' | 'unlock'

export type MapPosition = readonly [number, number, number]
export type BaseTeam = 'player' | 'enemy'

export type ControlPointVariant = 'spire' | 'crystal' | 'relay' | 'vault'
export type ControlPointOwner = 'neutral' | 'player' | 'enemy'

export type BaseEntityData = {
  id: string
  team: BaseTeam
  position: MapPosition
  maxHealth: number
}

export type BaseCoreState = BaseEntityData & {
  currentHealth: number
}

type BaseControlPointData = {
  id: string
  label: string
  position: MapPosition
  variant: ControlPointVariant
  captureRadius: number
}

export type ResourceControlPointData = BaseControlPointData & {
  type: 'resource'
  incomePerTick: number
}

export type UnlockControlPointData = BaseControlPointData & {
  type: 'unlock'
}

export type ControlPointData = ResourceControlPointData | UnlockControlPointData

export type ControlPointState = ControlPointData & {
  owner: ControlPointOwner
  captureProgress: number
  isContested: boolean
}

export type GreyboxPropData = {
  id: string
  position: MapPosition
  size: readonly [number, number, number]
}

export type TacticalMapConfig = {
  size: {
    width: number
    depth: number
  }
  colors: {
    surface: string
    lane: string
    border: string
    prop: string
  }
  playerBase: BaseEntityData
  enemyBase: BaseEntityData
  controlPoints: ControlPointData[]
  props: GreyboxPropData[]
}
