export type PointType = 'resource' | 'unlock'

export type MapPosition = readonly [number, number, number]

export type ControlPointVariant = 'spire' | 'crystal' | 'relay' | 'vault'

export type BaseEntityData = {
  id: string
  position: MapPosition
}

export type ControlPointData = {
  id: string
  position: MapPosition
  type: PointType
  variant: ControlPointVariant
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
