import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, Line, OrbitControls, Stars, useGLTF } from '@react-three/drei'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'


const ORIGINAL_HEART_LABELS = [
  { name: 'AORTA', anchor: [0.42, 1.05, 0.5] as [number, number, number], label: [1.75, 1.35, 0.5] as [number, number, number], color: '#ff657e' },
  { name: 'PULMONARY ARTERY', anchor: [-0.42, 0.88, 0.5] as [number, number, number], label: [-2.0, 1.12, 0.5] as [number, number, number], color: '#58b9ff' },
  { name: 'RIGHT ATRIUM', anchor: [-0.62, 0.25, 0.5] as [number, number, number], label: [-1.85, 0.35, 0.5] as [number, number, number], color: '#58b9ff' },
  { name: 'RIGHT VENTRICLE', anchor: [-0.42, -0.55, 0.5] as [number, number, number], label: [-1.95, -0.65, 0.5] as [number, number, number], color: '#58b9ff' },
  { name: 'LEFT ATRIUM', anchor: [0.58, 0.32, 0.5] as [number, number, number], label: [1.8, 0.48, 0.5] as [number, number, number], color: '#ff657e' },
  { name: 'LEFT VENTRICLE', anchor: [0.48, -0.58, 0.5] as [number, number, number], label: [1.8, -0.72, 0.5] as [number, number, number], color: '#ff657e' },
]


const CUTAWAY_HEART_LABELS = [
  { name: 'AORTA', anchor: [0.15, 1.15, 0.5] as [number, number, number], label: [1.45, 1.42, 0.5] as [number, number, number], color: '#ff657e' },
  { name: 'PULMONARY ARTERY', anchor: [-0.05, 0.9, 0.5] as [number, number, number], label: [-1.85, 1.12, 0.5] as [number, number, number], color: '#58b9ff' },
  { name: 'RIGHT ATRIUM', anchor: [-0.55, 0.35, 0.5] as [number, number, number], label: [-1.65, 0.42, 0.5] as [number, number, number], color: '#58b9ff' },
  { name: 'RIGHT VENTRICLE', anchor: [-0.42, -0.45, 0.5] as [number, number, number], label: [-1.75, -0.62, 0.5] as [number, number, number], color: '#58b9ff' },
  { name: 'LEFT ATRIUM', anchor: [0.55, 0.35, 0.5] as [number, number, number], label: [1.55, 0.48, 0.5] as [number, number, number], color: '#ff657e' },
  { name: 'LEFT VENTRICLE', anchor: [0.45, -0.5, 0.5] as [number, number, number], label: [1.55, -0.68, 0.5] as [number, number, number], color: '#ff657e' },
]

function HeartGLBModel({
  displayMode,
  showLabels,
  heartAsset,
}: {
  displayMode: 'default' | 'dark' | 'glass'
  showLabels: boolean
  heartAsset: 'original' | 'cutaway'
}) {

  const modelPath =
    heartAsset === 'cutaway'
      ? '/models/heart-cutaway.glb'
      : '/models/heart-sectioned.glb'
  const { scene } = useGLTF(modelPath)
  const modelScene = useMemo(() => scene.clone(true), [scene])
  const model = useRef<THREE.Group>(null)

  useEffect(() => {
    const root = model.current
    if (!root) return

    // Normalize the wrapper, leaving the GLB scene's original transforms intact.
    root.position.set(0, 0, 0)
    root.scale.setScalar(1)
    root.updateMatrixWorld(true)

    const bounds = new THREE.Box3().setFromObject(root)
    const size = bounds.getSize(new THREE.Vector3())
    const center = bounds.getCenter(new THREE.Vector3())
    const maxDimension = Math.max(size.x, size.y, size.z)

    console.log(`[Heart: ${heartAsset}] Before normalization`, {
      boundsMin: bounds.min.toArray(),
      boundsMax: bounds.max.toArray(),
      size: size.toArray(),
      center: center.toArray(),
    })

    if (!Number.isFinite(maxDimension) || maxDimension <= 0) {
      console.error('Heart GLB has invalid geometry bounds.')
      return
    }

    const scale = (heartAsset === 'cutaway' ? 4.37 : 3.8) / maxDimension
    root.scale.setScalar(scale)
    root.position.set(
      -center.x * scale,
      -center.y * scale,
      -center.z * scale
    )

    // Center both heart assets around the scene origin.
    root.position.y += heartAsset === 'cutaway'
      ? -1.6308273034690275
      : 0

    root.updateMatrixWorld(true)

    const normalizedBounds = new THREE.Box3().setFromObject(root)

    console.log(`[Heart: ${heartAsset}] After normalization`, {
      boundsMin: normalizedBounds.min.toArray(),
      boundsMax: normalizedBounds.max.toArray(),
      size: normalizedBounds.getSize(new THREE.Vector3()).toArray(),
      center: normalizedBounds.getCenter(new THREE.Vector3()).toArray(),
    })

    root.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return
      object.castShadow = true
      object.receiveShadow = true
      const originals = Array.isArray(object.material) ? object.material : [object.material]
      const cloned = originals.map((material) => {
        const next = material.clone()

        if (displayMode === 'glass') {
          if ('color' in next && next.color instanceof THREE.Color) {
            next.color.lerp(new THREE.Color('#43dfff'), 0.58)
          }
          if ('emissive' in next && next.emissive instanceof THREE.Color) {
            next.emissive.set('#12cfff')
            next.emissiveIntensity = 1.35
          }
          if ('transparent' in next) {
            next.transparent = true
            next.opacity = 0.58
          }
          if ('depthWrite' in next) next.depthWrite = false
          if ('metalness' in next) next.metalness = 0.12
          if ('roughness' in next) next.roughness = 0.38
        } else if ('emissive' in next && next.emissive instanceof THREE.Color) {
          next.emissive.set('#123650')
          next.emissiveIntensity = 0.16
        }

        next.needsUpdate = true
        return next
      })
      object.material = Array.isArray(object.material) ? cloned : cloned[0]

      if (displayMode === 'glass' && object.geometry) {
        const edgeGeometry = new THREE.EdgesGeometry(object.geometry, 24)
        const edgeMaterial = new THREE.LineBasicMaterial({
          color: '#65f2ff',
          transparent: true,
          opacity: 0.88,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          toneMapped: false,
        })
        const edgeOverlay = new THREE.LineSegments(edgeGeometry, edgeMaterial)
        edgeOverlay.name = '__heart_hologram_edges__'
        object.add(edgeOverlay)
      }
    })
  }, [scene, displayMode])

  return (
    <group>
      <group ref={model}>
        <primitive object={modelScene} />
      </group>
      {showLabels && (heartAsset === 'original' ? ORIGINAL_HEART_LABELS : CUTAWAY_HEART_LABELS).map((label) => (
        <group key={label.name}>
          <Line
            points={[label.anchor, label.label]}
            color={label.color}
            lineWidth={1.1}
            transparent
            opacity={0.9}
          />
          <mesh position={label.anchor}>
            <sphereGeometry args={[0.025, 12, 12]} />
            <meshBasicMaterial color={label.color} />
          </mesh>
          <Html
            position={label.label}
            center
            distanceFactor={8}
            zIndexRange={[100, 0]}
            style={{ pointerEvents: 'none', whiteSpace: 'nowrap' }}
          >
            <span style={{
              display: 'block',
              padding: '4px 7px',
              border: `1px solid ${label.color}88`,
              borderRadius: 5,
              background: 'rgba(255, 255, 255, 0.94)',
              boxShadow: `0 2px 8px ${label.color}22`,
              color: '#19344a',
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: 0.45,
            }}>
              {label.name}
            </span>
          </Html>
        </group>
      ))}
    </group>
  )
}

useGLTF.preload('/models/heart-sectioned.glb')
useGLTF.preload('/models/heart-cutaway.glb')

function HolographicProjectionRings({ displayMode }: { displayMode: 'default' | 'dark' | 'glass' }) {
  const ringsRef = useRef<Array<THREE.Mesh | null>>([])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    ringsRef.current.forEach((ring, index) => {
      if (!ring) return
      const material = ring.material as THREE.MeshBasicMaterial
      const pulse = 0.72 + Math.sin(t * 2.2 - index * 0.65) * 0.18
      material.opacity = displayMode === 'glass' ? pulse : 0.6 - index * 0.12
      ring.scale.setScalar(1 + Math.sin(t * 1.5 - index * 0.5) * 0.018)
    })
  })

  return (
    <group position={[0, -1.55, 0]}>
      {[1.15, 1.5, 1.85].map((radius, index) => (
        <mesh
          key={radius}
          ref={(mesh) => { ringsRef.current[index] = mesh }}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, index * 0.015, 0]}
        >
          <torusGeometry args={[radius, displayMode === 'glass' ? 0.014 : 0.009, 8, 120]} />
          <meshBasicMaterial
            color={index === 1 ? '#ff5f9f' : '#42eaff'}
            transparent
            opacity={displayMode === 'glass' ? 0.8 : 0.6 - index * 0.12}
            blending={displayMode === 'glass' ? THREE.AdditiveBlending : THREE.NormalBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}
      {displayMode === 'glass' && (
        <pointLight position={[0, 0.12, 0]} color="#26dfff" intensity={1.8} distance={4.5} />
      )}
    </group>
  )
}

function BloodFlowParticles({ running }: { running: boolean }) {
  const particleRefs = useRef<Array<THREE.Mesh | null>>([])
  const particleCount = 20

  useFrame(({ clock }) => {
    const t = clock.elapsedTime

    particleRefs.current.forEach((particle, index) => {
      if (!particle || !running) return

      const progress = (t * 0.22 + index / particleCount) % 1
      const side = index % 2 === 0 ? 1 : -1
      const phase = progress * Math.PI * 2

      // Curved schematic paths around the front of the heart.
      const x = side * (0.18 + 0.34 * Math.sin(phase))
      const y = -0.92 + progress * 1.84
      const z = 0.52 + 0.16 * Math.cos(phase)

      particle.position.set(x, y, z)

      const material = particle.material as THREE.MeshBasicMaterial
      const pulse = 0.78 + 0.22 * Math.sin(t * 4 + index)
      material.opacity = pulse
      particle.scale.setScalar(0.82 + pulse * 0.32)
    })
  })

  return (
    <group>
      {Array.from({ length: particleCount }, (_, index) => {
        const isArterial = index % 2 === 0

        return (
          <mesh
            key={index}
            ref={(mesh) => {
              particleRefs.current[index] = mesh
            }}
            position={[
              (isArterial ? 1 : -1) * 0.18,
              -0.92 + (index / particleCount) * 1.84,
              0.68,
            ]}
          >
            <sphereGeometry args={[0.043, 16, 16]} />
            <meshBasicMaterial
              color={isArterial ? '#ff466b' : '#38c9ff'}
              transparent
              opacity={0.9}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        )
      })}
    </group>
  )
}

export type HumanHeart3DProps = {
  heartAsset?: 'original' | 'cutaway'
  showLabels?: boolean
  autoRotate?: boolean
  simulationOn?: boolean
  displayMode?: 'default' | 'dark' | 'glass'
  zoomCommand?: { direction: 'in' | 'out'; id: number } | null
  onZoomComplete?: () => void
  rotationCommand?: {
    direction: 'left' | 'right' | 'up' | 'down' | 'full' | 'reset'
    id: number
  } | null
}

function HeartCameraCommands({
  zoomCommand,
  onZoomComplete,
  rotationCommand,
}: Pick<HumanHeart3DProps, 'zoomCommand' | 'onZoomComplete' | 'rotationCommand'>) {
  const { camera, controls } = useThree()
  const lastZoomId = useRef<number | null>(null)
  const lastRotationId = useRef<number | null>(null)

  useEffect(() => {
    if (!zoomCommand || lastZoomId.current === zoomCommand.id) return
    lastZoomId.current = zoomCommand.id

    const direction = new THREE.Vector3()
    camera.getWorldDirection(direction)
    const distance = zoomCommand.direction === 'in' ? 0.8 : -0.8
    camera.position.addScaledVector(direction, distance)
    camera.position.clampLength(4.5, 13)
    onZoomComplete?.()
  }, [zoomCommand, camera, onZoomComplete])

  useEffect(() => {
    if (!rotationCommand || lastRotationId.current === rotationCommand.id) return
    lastRotationId.current = rotationCommand.id

    const target = controls as (THREE.EventDispatcher & {
      target?: THREE.Vector3
      update?: () => void
    }) | null

    if (rotationCommand.direction === 'reset') {
      camera.position.set(0, 0.2, 8)
      target?.target?.set(0, 0, 0)
    } else if (rotationCommand.direction === 'left') {
      camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.25)
    } else if (rotationCommand.direction === 'right') {
      camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), -0.25)
    } else if (rotationCommand.direction === 'up') {
      camera.position.applyAxisAngle(new THREE.Vector3(1, 0, 0), -0.2)
    } else if (rotationCommand.direction === 'down') {
      camera.position.applyAxisAngle(new THREE.Vector3(1, 0, 0), 0.2)
    } else if (rotationCommand.direction === 'full') {
      camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * 2)
    }

    target?.update?.()
  }, [rotationCommand, camera, controls])

  return null
}

export default function HumanHeart3D({
  heartAsset = 'original',
  showLabels = true,
  autoRotate = false,
  simulationOn = true,
  displayMode = 'default',
  zoomCommand = null,
  onZoomComplete,
  rotationCommand = null,
}: HumanHeart3DProps) {

  const backgroundColor =
    displayMode === 'glass'
      ? 'transparent'
      : displayMode === 'dark'
        ? '#030711'
        : '#f7faff'

  const canvasBackground =
    displayMode === 'dark'
      ? '#030711'
      : '#f7faff'

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background:
          displayMode === 'glass'
            ? 'radial-gradient(ellipse at center, rgba(8, 28, 48, 0.96) 0%, rgba(3, 10, 24, 0.99) 100%)'
            : displayMode === 'dark'
              ? `radial-gradient(ellipse at center, ${backgroundColor} 0%, #030711 100%)`
              : `radial-gradient(ellipse at center, ${backgroundColor} 0%, #e8f3fc 100%)`,
      }}
    >
      <Canvas
        camera={{ position: [0, 0.2, 8], fov: 42 }}
        dpr={[1, 1.7]}
        gl={{ antialias: true, alpha: true }}
      >
        {displayMode !== 'glass' && (
          <color attach="background" args={[canvasBackground]} />
        )}
        <ambientLight intensity={1.1} />
        <pointLight position={[3, 4, 5]} intensity={35} color="#a4dfff" />
        <pointLight position={[-4, 1, 2]} intensity={22} color="#2c83ff" />
        <pointLight position={[2, -3, -2]} intensity={20} color="#ff526f" />

        <Stars radius={45} depth={35} count={650} factor={2} fade speed={0.3} />

        <group position={[0, -0.05, 0]}>
          {/* Actual anatomical heart loaded from the GLB asset */}
          <HeartGLBModel
            displayMode={displayMode}
            showLabels={showLabels}
            heartAsset={heartAsset}
          />

          {/* Blood-flow indicator particles */}
          {simulationOn && <BloodFlowParticles running={simulationOn} />}

          {/* Animated holographic projection platform */}
          <HolographicProjectionRings displayMode={displayMode} />
        </group>

        <HeartCameraCommands
          zoomCommand={zoomCommand}
          onZoomComplete={onZoomComplete}
          rotationCommand={rotationCommand}
        />

        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.07}
          minDistance={4.5}
          maxDistance={13}
          autoRotate={autoRotate}
          autoRotateSpeed={0.65}
        />
      </Canvas>

      <div
        style={{
          position: 'absolute',
          left: 16,
          bottom: 14,
          color: '#a6cce4',
          fontSize: 10,
          letterSpacing: 1.5,
          pointerEvents: 'none',
        }}
      >
        HOLOGRAPHIC CARDIAC MODEL · DRAG TO ROTATE · SCROLL TO ZOOM
      </div>

    </div>
  )
}
