import { useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, OrbitControls, Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import type { Element } from '../data/elements'

type AtomicStructure3DProps = {
  element: Element
  ionCharge?: number
  showLabels: boolean
  autoRotate?: boolean
  simulationOn?: boolean
  displayMode?: 'default' | 'dark' | 'glass'
  zoomCommand?: { direction: 'in' | 'out'; id: number } | null
  onZoomComplete?: () => void
  onElectronSelect?: (electron: { id: string; shell: number; number: number }) => void
  rotationCommand?: {
    direction: 'left' | 'right' | 'up' | 'down' | 'full' | 'reset'
    id: number
  } | null
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

      animation.current = {
        fromPosition: camera.position.clone(),
        toPosition: destination.clone().add(direction.multiplyScalar(target.distance)),
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
  electrons,
  shellNumber,
  showLabels,
  simulationOn,
  selectedElectron,
  onSelectElectron,
  onFocus,
  displayMode,
}: {
  radius: number
  tilt: number
  speed: number
  phase: number
  electrons: number
  shellNumber: number
  showLabels: boolean
  simulationOn: boolean
  selectedElectron: string | null
  onSelectElectron: (id: string) => void
  displayMode: 'default' | 'dark' | 'glass' 
  onFocus: (position: THREE.Vector3, distance: number) => void
}) {
  const electronRefs = useRef<Array<THREE.Mesh | null>>([])
  const anglesRef = useRef<number[]>([])

  // Each shell uses a distinct, stable 3D orbital orientation.
  const orbitRotation: [number, number, number] = [
    0.25 + tilt * 0.55,
    tilt,
    0.18 + tilt * 0.35,
  ]

  useFrame((_, delta) => {
    if (!simulationOn) return

    electronRefs.current.forEach((mesh, index) => {
      if (!mesh) return

      const initialAngle = phase + (index / Math.max(electrons, 1)) * Math.PI * 2
      anglesRef.current[index] = (anglesRef.current[index] ?? initialAngle) + delta * speed
      const angle = anglesRef.current[index]

      // The electron follows the same circular plane as its visible orbit.
      mesh.position.set(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        0,
      )
    })
  })

  return (
    <group rotation={orbitRotation}>
      <mesh>
        <torusGeometry args={[radius, 0.012, 8, 144]} />
        <meshBasicMaterial
          color={displayMode === 'glass' ? '#13c8f5' : '#37cfff'}
          transparent
          opacity={displayMode === 'glass' ? 0.52 : 0.28}
          depthWrite={false}
          blending={displayMode === 'glass' ? THREE.AdditiveBlending : THREE.NormalBlending}
        />
      </mesh>

      <group>
        {Array.from({ length: electrons }, (_, index) => (
          <mesh
            key={`${shellNumber}-${index}`}
            ref={(mesh) => {
              electronRefs.current[index] = mesh
            }}
            position={[
              Math.cos(phase + (index / Math.max(electrons, 1)) * Math.PI * 2) * radius,
              Math.sin(phase + (index / Math.max(electrons, 1)) * Math.PI * 2) * radius,
              0,
            ]}
            onClick={(event) => {
              event.stopPropagation()
              const mesh = electronRefs.current[index]
              const electronId = `${shellNumber}-${index + 1}`
              onSelectElectron(electronId)

              if (mesh) {
                onFocus(mesh.getWorldPosition(new THREE.Vector3()), 1.8)
              }
            }}
          >
            <sphereGeometry args={[selectedElectron === `${shellNumber}-${index + 1}` ? 0.14 : 0.095, 20, 20]} />
            <meshStandardMaterial
              color={selectedElectron === `${shellNumber}-${index + 1}` ? "#ffffff" : "#53e7ff"}
              emissive={selectedElectron === `${shellNumber}-${index + 1}` ? "#42dfff" : "#079bd8"}
              emissiveIntensity={
                selectedElectron === `${shellNumber}-${index + 1}`
                  ? 4
                  : displayMode === 'glass' ? 3.2 : 2.5
              }
              metalness={0.2}
              roughness={0.2}
              transparent={displayMode === 'glass'}
              opacity={displayMode === 'glass' ? 0.82 : 1}
            />
            {selectedElectron === `${shellNumber}-${index + 1}` && (
              <mesh>
                <sphereGeometry args={[0.19, 24, 24]} />
                <meshBasicMaterial
                  color="#00dfff"
                  wireframe
                  transparent
                  opacity={0.95}
                  depthTest={false}
                />
              </mesh>
            )}
          </mesh>
        ))}
      </group>

      {showLabels && (
        <Html position={[radius, 0.15, 0]} center distanceFactor={10}>
          <div className="layer-label">Shell {shellNumber}</div>
        </Html>
      )}
    </group>
  )
}

function Nucleus({
  element,
  showLabels,
  showParticleLabels,
  onFocus,
}: {
  element: Element
  showLabels: boolean
  showParticleLabels: boolean
  onFocus: (position: THREE.Vector3, distance: number) => void
}) {
  const protonCount = element.atomicNumber
  const neutronCount =
    element.commonMassNumber === null
      ? null
      : Math.max(0, element.commonMassNumber - protonCount)

  const particles = Array.from(
    { length: protonCount + (neutronCount ?? 0) },
    (_, index) => {
      const angle = index * 2.399963
      const radius = 0.2 + 0.58 * Math.sqrt((index + 0.5) / Math.max(protonCount + (neutronCount ?? 0), 1))
      const isProton = index < protonCount

      return {
        id: index,
        proton: isProton,
        position: [
          Math.cos(angle) * radius,
          Math.sin(angle) * radius,
          Math.sin(index * 1.7) * 0.42,
        ] as [number, number, number],
      }
    },
  )

  return (
    <group>
      {particles.map((particle) => (
        <mesh
          key={particle.id}
          position={particle.position}
          onClick={(event) => {
            event.stopPropagation()
            onFocus(new THREE.Vector3(...particle.position), 1.35)
          }}
        >
          <sphereGeometry args={[0.22, 18, 18]} />
          <meshStandardMaterial
            color={particle.proton ? '#ff557d' : '#8a80ff'}
            emissive={particle.proton ? '#b91c48' : '#453ac2'}
            emissiveIntensity={0.65}
            roughness={0.3}
            metalness={0.15}
          />
          {showParticleLabels && (
            <Html center distanceFactor={5}>
              <span className={`nucleon-charge ${particle.proton ? 'proton-charge' : 'neutron-charge'}`}>
                {particle.proton ? 'p⁺' : 'n⁰'}
              </span>
            </Html>
          )}
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
        <Html position={[0, 1.25, 0]} center distanceFactor={10}>
          <div className="layer-label">
            Nucleus · {protonCount} p
            {neutronCount === null ? '' : ` · ${neutronCount} n`}
          </div>
        </Html>
      )}
    </group>
  )
}

function AtomScene({
  element,
  ionCharge = 0,
  showLabels,
  autoRotate,
  simulationOn = false,
  displayMode,
  zoomCommand,
  onZoomComplete,
  onElectronSelect,
  rotationCommand,
}: AtomicStructure3DProps) {
  const atomRef = useRef<THREE.Group>(null)
  const lastZoomId = useRef<number | null>(null)
  const lastRotationId = useRef<number | null>(null)
  const detailLevelRef = useRef(0)
  const [detailLevel, setDetailLevel] = useState(0)
  const [selectedElectron, setSelectedElectron] = useState<string | null>(null)
  const { camera, controls } = useThree() as {
    camera: THREE.PerspectiveCamera
    controls: { target: THREE.Vector3; update: () => void } | null
  }

  useFrame(() => {
    const cameraDistance = camera.position.distanceTo(
      controls?.target ?? new THREE.Vector3(0, 0, 0),
    )
    const nextDetailLevel = cameraDistance < 2.3 ? 2 : cameraDistance < 4.2 ? 1 : 0

    if (nextDetailLevel !== detailLevelRef.current) {
      detailLevelRef.current = nextDetailLevel
      setDetailLevel(nextDetailLevel)
    }

    if (rotationCommand && lastRotationId.current !== rotationCommand.id && controls) {
      lastRotationId.current = rotationCommand.id

      const target = controls.target.clone()
      const isReset = rotationCommand.direction === 'reset'

      if (isReset) {
        controls.target.set(0, 0, 0)
        camera.position.set(0, 0.2, 7.5)
      } else {
        const offset = camera.position.clone().sub(target)
        const spherical = new THREE.Spherical().setFromVector3(offset)

        if (rotationCommand.direction === 'left') spherical.theta -= Math.PI / 4
        if (rotationCommand.direction === 'right') spherical.theta += Math.PI / 4
        if (rotationCommand.direction === 'up') {
          spherical.phi = Math.max(0.12, spherical.phi - Math.PI / 8)
        }
        if (rotationCommand.direction === 'down') {
          spherical.phi = Math.min(Math.PI - 0.12, spherical.phi + Math.PI / 8)
        }

        camera.position.copy(
          target.clone().add(new THREE.Vector3().setFromSpherical(spherical)),
        )
      }

      camera.lookAt(controls.target)
      controls.update()
    }

    if (!zoomCommand || lastZoomId.current === zoomCommand.id || !controls) return

    lastZoomId.current = zoomCommand.id
    const target = controls.target
    const direction = camera.position.clone().sub(target)
    const distance = direction.length()
    const factor = zoomCommand.direction === 'in' ? 0.72 : 1.38
    const nextDistance = THREE.MathUtils.clamp(distance * factor, 0.5, 12)

    direction.normalize().multiplyScalar(nextDistance)
    camera.position.copy(target).add(direction)
    controls.update()
    onZoomComplete?.()
  })
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

  const background =
    displayMode === 'glass'
      ? null
      : displayMode === 'dark'
        ? '#101827'
        : '#f7faff'
  const electronCount = Math.max(0, element.atomicNumber - (ionCharge ?? 0))

  // Start with the element's neutral shell distribution, then adjust
  // the outer shell to represent the selected ion charge.
  const shellOccupancies = element.shells.length
    ? [...element.shells]
    : [element.atomicNumber]

  const neutralShellTotal = shellOccupancies.reduce((sum, count) => sum + count, 0)

  if (neutralShellTotal !== element.atomicNumber) {
    shellOccupancies.splice(0, shellOccupancies.length, element.atomicNumber)
  }

  let difference = electronCount - shellOccupancies.reduce((sum, count) => sum + count, 0)

  if (difference < 0) {
    for (let i = shellOccupancies.length - 1; i >= 0 && difference < 0; i--) {
      const removed = Math.min(shellOccupancies[i], -difference)
      shellOccupancies[i] -= removed
      difference += removed
    }
  } else if (difference > 0) {
    shellOccupancies[shellOccupancies.length - 1] += difference
  }

  const shellRadii = shellOccupancies.map(
    (_, index) => 1.35 + index * 0.42,
  )

  return (
    <>
      {displayMode !== 'glass' && background && (
        <>
          <color attach="background" args={[background]} />
          <fog attach="fog" args={[background, 10, 22]} />
        </>
      )}

      <ambientLight intensity={1.2} />
      <pointLight position={[4, 5, 6]} intensity={35} color="#c4f5ff" />
      <pointLight position={[-4, -3, -4]} intensity={20} color="#a99bff" />

      <group ref={atomRef}>
        <Nucleus
          element={element}
          showLabels={showLabels}
          showParticleLabels={detailLevel >= 2}
          onFocus={focusParticle}
        />

        {shellOccupancies.map((count, index) => (
          <ElectronOrbit
            key={`${element.atomicNumber}-shell-${index}`}
            radius={shellRadii[index]}
            tilt={(index % 3) * 0.72}
            speed={index % 2 === 0 ? 1.1 : -0.85}
            phase={index * 0.73}
            electrons={Math.max(0, Math.min(count, element.atomicNumber))}
            shellNumber={index + 1}
            showLabels={showLabels}
            simulationOn={simulationOn}
            displayMode={displayMode ?? 'default'}
            selectedElectron={selectedElectron}
            onSelectElectron={(id) => {
              setSelectedElectron(id)
              const [shellText, numberText] = id.split('-')
              onElectronSelect?.({
                id,
                shell: Number(shellText),
                number: Number(numberText),
              })
            }}
            onFocus={focusParticle}
          />
        ))}

        {showLabels && (
          <>
            <Html position={[3.1, 1.45, 0]} center distanceFactor={10}>
              <div className="layer-label">Electrons: {electronCount} (charge {ionCharge ?? 0})</div>
            </Html>
            {selectedElectron && (
              <Html position={[0, -2.25, 0]} center distanceFactor={10}>
                <div className="layer-label">
                  Selected electron · Shell {selectedElectron.split('-')[0]} · Electron {selectedElectron.split('-')[1]}
                </div>
              </Html>
            )}
            <Html position={[-2.5, -1.65, 0.5]} center distanceFactor={10}>
              <div className="layer-label">
                {element.name} ({element.symbol})
              </div>
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
  element,
  ionCharge = 0,
  showLabels,
  autoRotate = false,
  simulationOn = false,
  displayMode = 'default',
  zoomCommand,
  onZoomComplete,
  onElectronSelect,
  rotationCommand,
}: AtomicStructure3DProps) {
  return (
    <div className="neural-network-scene">
      <Canvas
        camera={{ position: [0, 0.2, 7.5], fov: 38 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: displayMode === 'glass' }}
      >
        <AtomScene
          element={element}
          ionCharge={ionCharge}
          showLabels={showLabels}
          autoRotate={autoRotate}
          simulationOn={simulationOn}
          displayMode={displayMode}
          zoomCommand={zoomCommand}
          onZoomComplete={onZoomComplete}
          onElectronSelect={onElectronSelect}
          rotationCommand={rotationCommand}
        />
      </Canvas>
    </div>
  )
}
