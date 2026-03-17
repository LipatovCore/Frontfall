import { OrthographicCamera } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useLayoutEffect, useRef } from 'react'
import type { OrthographicCamera as OrthographicCameraType } from 'three'
import { mapConfig } from '../../shared/config/mapConfig'
import { tacticalView } from '../../shared/config/tacticalView'

export function TopDownCamera() {
  const { size } = useThree()
  const cameraRef = useRef<OrthographicCameraType>(null)

  useLayoutEffect(() => {
    const camera = cameraRef.current

    if (!camera) {
      return
    }

    camera.position.set(
      tacticalView.position[0],
      tacticalView.position[1],
      tacticalView.position[2],
    )
    camera.up.set(tacticalView.up[0], tacticalView.up[1], tacticalView.up[2])
    camera.lookAt(
      tacticalView.target[0],
      tacticalView.target[1],
      tacticalView.target[2],
    )

    const fitPadding = 1.14
    const requiredWorldWidth = mapConfig.size.width * fitPadding
    const requiredWorldHeight = mapConfig.size.depth * fitPadding
    const widthLimitedZoom = size.width / requiredWorldWidth
    const heightLimitedZoom = size.height / requiredWorldHeight
    const fitZoom = Math.min(widthLimitedZoom, heightLimitedZoom)

    camera.zoom = Math.min(tacticalView.zoom, fitZoom)
    camera.updateProjectionMatrix()
  }, [size.height, size.width])

  return (
    <OrthographicCamera
      ref={cameraRef}
      makeDefault
      zoom={tacticalView.zoom}
      near={0.1}
      far={100}
    />
  )
}
