import { useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, OrbitControls, Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import type { Element } from '../data/elements'

type AtomicStructure3DProps = {
  element: Element
  showLabels: boolean
  autoRotate?: boolean
  displayMode?: 'default' | 'dark' | 'glass'
}

type FocusTarget = {
  position: THREE.Vector3
  distance: number
  id: number
} | null

function AtomicCameraFocus({ target }: { target: FocusTarget }) {
  const { camera, controls } = useThree() as {
    camera: THREE.PerspectiveCamera
    controls: { target: THREE.Vector3; update: () => void } | null
  }

  const animation = useRef<{
    fromPosition: THREE.Vector3
    toPosition: THREE.Vector3
    fromTarget: THREE.Vector3
    toTarget: THREE.Vector3
    elapsed: number
    duration: number
  } | null>(null)

  const lastTargetId = useRef<number | null>(null)

  useFrame((_, delta) => {
    if (target && lastTargetId.current !== target.id) {
      lastTargetId.current = target.id

      const currentTarget = controls?.target.clone() ?? new THREE.Vector3()
      const direction = camera.position.clone().sub(currentTarget).normalize()
      const destination = target.position.clone()
      const distance = target.distance

      animation.current = {
        fromPosition: camera.position.clone(),
        toPosition: destination.clone().add(direction.multiplyScalar(distance)),
        fromTarget: currentTarget,
        toTarget: destination,
        elapsed: 0,
        duration: 0.65,
      }
    }

    const active = animation.current
    if (!active) return

    active.elapsed += delta
    const progress = Math.min(active.elapsed / active.duration, 1)
    const eased = progress * progress * (3 - 2 * progress)

    camera.position.lerpVectors(active.fromPosition, active.toPosition, eased)

    if (controls) {
      controls.target.lerpVectors(active.fromTarget, active.toTarget, eased)
      controls.update()
    }

    if (progress >= 1) animation.current = null
  })

  return null
}

function ElectronOrbit({
  radius,
  tilt,
  speed,
  phase,
  onFocus,
}: {
  radius: number
  tilt: number
  speed: number
  phase: number
  onFocus: (position: THREE.Vector3, distance: number) => void
}) {
  const electronRef = useRef<THREE.Mesh>(null)
  const angleRef = useRef(phase)

  useFrame((_, delta) => {
    angleRef.current += delta * speed

    if (!electronRef.current) return

    electronRef.current.position.set(
      Math.cos(angleRef.current) * radius,
      Math.sin(angleRef.current) * radius * Math.sin(tilt),
      Math.sin(angleRef.current) * radius * Math.cos(tilt),
    )
  })

  return (
    <group rotation={[tilt * 0.35, tilt, tilt * 0.2]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, 0.009, 8, 120]} />
        <meshBasicMaterial color="#37cfff" transparent opacity={0.45} />
      </mesh>

      <mesh
        ref={electronRef}
        onClick={(event) => {
          event.stopPropagation()
          if (electronRef.current) {
            onFocus(electronRef.current.getWorldPosition(new THREE.Vector3()), 1.8)
          }
        }}
      >
        <sphereGeometry args={[0.14, 24, 24]} />
        <meshStandardMaterial
          color="#53e7ff"
          emissive="#079bd8"
          emissiveIntensity={2.5}
          metalness={0.2}
          roughness={0.2}
        />
      </mesh>
    </group>
  )
}

function Nucleus({
  showLabels,
  onFocus,
}: {
  showLabels: boolean
  onFocus: (position: THREE.Vector3, distance: number) => void
}) {
  const particles = Array.from({ length: 13 }, (_, index) => {
    const angle = index * 2.399
    const ring = Math.floor(index / 5)
    const radius = ring === 0 ? 0.3 : ring === 1 ? 0.55 : 0.72

    return {
      position: [
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        ((index % 3) - 1) * 0.24,
      ] as [number, number, number],
      proton: index % 2 === 0,
    }
  })

  return (
    <group>
      {particles.map((particle, index) => (
        <mesh
          key={index}
          position={particle.position}
          onClick={(event) => {
            event.stopPropagation()
            onFocus(new THREE.Vector3(...particle.position), 1.35)
          }}
        >
          <sphereGeometry args={[0.28, 24, 24]} />
          <meshStandardMaterial
            color={particle.proton ? '#ff557d' : '#8a80ff'}
            emissive={particle.proton ? '#b91c48' : '#453ac2'}
            emissiveIntensity={0.65}
            roughness={0.3}
            metalness={0.15}
          />
        </mesh>
      ))}

      <mesh
        onClick={(event) => {
          event.stopPropagation()
          onFocus(new THREE.Vector3(0, 0, 0), 2.1)
        }}
      >
        <sphereGeometry args={[0.95, 24, 24]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {showLabels && (
        <Html position={[0, 1.35, 0]} center distanceFactor={10}>
          <div className="layer-label">Nucleus</div>
        </Html>
      )}
    </group>
  )
}

function AtomScene({
  showLabels,
  autoRotate,
  displayMode,
}: AtomicStructure3DProps) {
  const atomRef = useRef<THREE.Group>(null)
  const nextFocusId = useRef(0)
  const [focusTarget, setFocusTarget] = useState<FocusTarget>(null)

  const focusParticle = (position: THREE.Vector3, distance: number) => {
    nextFocusId.current += 1
    setFocusTarget({
      position: position.clone(),
      distance,
      id: nextFocusId.current,
    })
  }

  useFrame((_, delta) => {
    if (atomRef.current && autoRotate) {
      atomRef.current.rotation.y += delta * 0.35
    }
  })

  const background = displayMode === 'dark' ? '#101827' : '#f7faff'

  return (
    <>
      {displayMode !== 'glass' && (
        <>
          <color attach="background" args={[background]} />
          <fog attach="fog" args={[background, 10, 22]} />
        </>
      )}

      <ambientLight intensity={1.2} />
      <pointLight position={[4, 5, 6]} intensity={35} color="#c4f5ff" />
      <pointLight position={[-4, -3, -4]} intensity={20} color="#a99bff" />

      <group ref={atomRef}>
        <Nucleus showLabels={showLabels} onFocus={focusParticle} />

        <ElectronOrbit radius={1.65} tilt={0} speed={1.5} phase={0} onFocus={focusParticle} />
        <ElectronOrbit radius={2.05} tilt={1.05} speed={-1.1} phase={1.4} onFocus={focusParticle} />
        <ElectronOrbit radius={2.35} tilt={2.0} speed={0.85} phase={2.7} onFocus={focusParticle} />

        {showLabels && (
          <>
            <Html position={[2.6, 0.6, 0]} center distanceFactor={10}>
              <div className="layer-label">Electron</div>
            </Html>
            <Html position={[-0.8, -1.2, 0.5]} center distanceFactor={10}>
              <div className="layer-label">Protons + Neutrons</div>
            </Html>
          </>
        )}
      </group>

      <AtomicCameraFocus target={focusTarget} />

      <Sparkles
        count={35}
        scale={6}
        size={1.8}
        speed={0.25}
        opacity={0.45}
        color="#42cfff"
      />

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.07}
        rotateSpeed={0.7}
        zoomSpeed={1.2}
        minDistance={0.5}
        maxDistance={12}
      />
    </>
  )
}

export default function AtomicStructure3D({
  showLabels,
  autoRotate = false,
  displayMode = 'default',
}: AtomicStructure3DProps) {
  return (
    <div className="neural-network-scene">
      <Canvas
        camera={{ position: [0, 0.2, 7.5], fov: 38 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: displayMode === 'glass' }}
      >
        <AtomScene
          showLabels={showLabels}
          autoRotate={autoRotate}
          displayMode={displayMode}
        />
      </Canvas>
    </div>
  )
}
