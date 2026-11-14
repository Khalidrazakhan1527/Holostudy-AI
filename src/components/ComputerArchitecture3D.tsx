import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { Canvas } from '@react-three/fiber'
import { Html, Line, OrbitControls, Stars } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'

function ArchitectureCameraControls({
  zoomCommand,
  onZoomComplete,
  rotationCommand,
}: {
  zoomCommand: { direction: 'in' | 'out'; id: number } | null
  onZoomComplete?: () => void
  rotationCommand: {
    direction: 'left' | 'right' | 'up' | 'down' | 'full' | 'reset'
    id: number
  } | null
}) {
  const { camera, controls } = useThree() as {
    camera: THREE.PerspectiveCamera
    controls: {
      target: THREE.Vector3
      update: () => void
      minDistance: number
      maxDistance: number
    } | null
  }

  const lastZoomId = useRef<number | null>(null)
  const lastRotationId = useRef<number | null>(null)

  useEffect(() => {
    if (!zoomCommand || lastZoomId.current === zoomCommand.id || !controls) return
    lastZoomId.current = zoomCommand.id

    const direction = camera.position.clone().sub(controls.target)
    const factor = zoomCommand.direction === 'in' ? 0.72 : 1.38
    const distance = THREE.MathUtils.clamp(
      direction.length() * factor,
      controls.minDistance,
      controls.maxDistance,
    )

    camera.position.copy(controls.target).add(direction.normalize().multiplyScalar(distance))
    controls.update()
    onZoomComplete?.()
  }, [zoomCommand, camera, controls, onZoomComplete])

  useEffect(() => {
    if (!rotationCommand || lastRotationId.current === rotationCommand.id || !controls) return
    lastRotationId.current = rotationCommand.id

    const target = controls.target.clone()
    const offset = camera.position.clone().sub(target)

    if (rotationCommand.direction === 'reset') {
      camera.position.set(0, 0.4, 9.5)
      controls.target.set(0, 0, 0)
    } else if (rotationCommand.direction === 'left' || rotationCommand.direction === 'right') {
      offset.applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        rotationCommand.direction === 'left' ? 0.35 : -0.35,
      )
      camera.position.copy(target).add(offset)
    } else if (rotationCommand.direction === 'up' || rotationCommand.direction === 'down') {
      offset.applyAxisAngle(
        new THREE.Vector3(1, 0, 0),
        rotationCommand.direction === 'up' ? 0.25 : -0.25,
      )
      camera.position.copy(target).add(offset)
    } else if (rotationCommand.direction === 'full') {
      offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * 2)
      camera.position.copy(target).add(offset)
    }

    controls.update()
  }, [rotationCommand, camera, controls])

  return null
}

type ComponentInfo = {
  id: string
  name: string
  description: string
  color: string
  position: [number, number, number]
  size: [number, number, number]
}

const COMPONENTS: ComponentInfo[] = [
  {
    id: 'alu',
    name: 'Arithmetic Logic Unit (ALU)',
    description:
      'Performs arithmetic operations such as addition and subtraction, along with logical comparisons.',
    color: '#39d9ff',
    position: [-1.05, 0.35, 0.2],
    size: [1.15, 0.82, 0.75],
  },
  {
    id: 'control-unit',
    name: 'Control Unit',
    description:
      'Coordinates instruction processing and generates control signals for CPU operations.',
    color: '#a58bff',
    position: [1.05, 0.35, 0.2],
    size: [1.15, 0.82, 0.75],
  },
  {
    id: 'registers',
    name: 'CPU Registers',
    description:
      'Small, fast storage locations inside the CPU that hold operands, addresses and intermediate results.',
    color: '#45e4b2',
    position: [0, -0.75, 0.2],
    size: [1.65, 0.48, 0.65],
  },
  {
    id: 'ram',
    name: 'Main Memory (RAM)',
    description:
      'Stores programs and data currently being used. The CPU reads instructions and data from memory.',
    color: '#ffbd62',
    position: [3.25, 0.1, 0],
    size: [1.15, 1.35, 0.7],
  },
  {
    id: 'storage',
    name: 'Secondary Storage',
    description:
      'Provides persistent storage for programs and files, unlike volatile main memory.',
    color: '#ff7199',
    position: [-3.25, 0.1, 0],
    size: [1.15, 1.35, 0.7],
  },
]

function ArchitectureBlock({
  component,
  selected,
  showLabels,
  onSelect,
  displayMode,
}: {
  component: ComponentInfo
  selected: boolean
  showLabels: boolean
  onSelect: (component: ComponentInfo) => void
  displayMode: 'default' | 'dark' | 'glass'
}) {
  return (
    <group position={component.position}>
      <mesh
        onClick={(event: ThreeEvent<MouseEvent>) => {
          event.stopPropagation()
          onSelect(component)
        }}
        onPointerOver={() => {
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto'
        }}
      >
        <boxGeometry args={component.size} />
        <meshPhysicalMaterial
          color={selected ? '#f5fbff' : component.color}
          emissive={component.color}
          emissiveIntensity={
            displayMode === 'glass'
              ? selected ? 1.3 : 0.7
              : selected ? 0.9 : 0.28
          }
          metalness={0.35}
          roughness={0.28}
          transparent
          opacity={displayMode === 'glass' ? 0.48 : 0.88}
          clearcoat={0.7}
          depthWrite={displayMode !== 'glass'}
        />
      </mesh>

      <mesh scale={[1.045, 1.07, 1.12]}>
        <boxGeometry args={component.size} />
        <meshBasicMaterial
          color={component.color}
          wireframe
          transparent
          opacity={
            displayMode === 'glass'
              ? selected ? 0.98 : 0.65
              : selected ? 0.8 : 0.3
          }
          depthWrite={false}
        />
      </mesh>

      {showLabels && (
        <Html
          position={[0, component.size[1] / 2 + 0.22, 0]}
          center
          distanceFactor={9}
          style={{ pointerEvents: 'none', whiteSpace: 'nowrap' }}
        >
          <span className={`layer-label architecture-part-label${selected ? ' architecture-part-label-selected' : ''}`}>
            {component.name}
          </span>
        </Html>
      )}
    </group>
  )
}

function DataPathways({ simulationOn }: { simulationOn: boolean }) {
  const paths: {
    id: string
    points: [number, number, number][]
    color: string
  }[] = [
    {
      id: 'alu-registers',
      points: [
        [-1.05, -0.12, 0.25],
        [-0.75, -0.5, 0.3],
        [-0.3, -0.75, 0.3],
      ],
      color: '#39d9ff',
    },
    {
      id: 'control-registers',
      points: [
        [1.05, -0.12, 0.25],
        [0.75, -0.5, 0.3],
        [0.3, -0.75, 0.3],
      ],
      color: '#a58bff',
    },
    {
      id: 'ram-cpu',
      points: [
        [2.65, 0.1, 0.05],
        [2.0, -0.5, 0.12],
        [1.1, -0.95, 0.18],
        [0.65, -0.75, 0.25],
      ],
      color: '#ffbd62',
    },
    {
      id: 'storage-ram',
      points: [
        [-2.65, 0.1, 0.05],
        [-2.0, -0.5, 0.12],
        [-1.15, -0.95, 0.18],
        [-0.65, -0.75, 0.25],
      ],
      color: '#ff7199',
    },
  ]

  return (
    <group>
      {paths.map((path) => (
        <group key={path.id}>
          <Line
            points={path.points}
            color={path.color}
            lineWidth={2}
            transparent
            opacity={simulationOn ? 0.9 : 0.3}
          />
          {simulationOn && (
            <mesh position={path.points[1]}>
              <sphereGeometry args={[0.065, 12, 12]} />
              <meshBasicMaterial color={path.color} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  )
}

export type ComputerArchitecture3DProps = {
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

export default function ComputerArchitecture3D({
  showLabels = true,
  autoRotate = false,
  simulationOn = true,
  displayMode = 'default',
  zoomCommand = null,
  onZoomComplete,
  rotationCommand = null,
}: ComputerArchitecture3DProps) {
  const [selectedComponent, setSelectedComponent] =
    useState<ComponentInfo | null>(null)
  const [isSplit, setIsSplit] = useState(false)

  const background =
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
              ? `radial-gradient(ellipse at center, ${background} 0%, #030711 100%)`
              : `radial-gradient(ellipse at center, ${background} 0%, #e8f3fc 100%)`,
      }}
    >
      <Canvas
        camera={{ position: [0, 0.4, 9.5], fov: 42 }}
        dpr={[1, 1.7]}
        gl={{ antialias: true, alpha: true }}
      >
        {displayMode !== 'glass' && (
          <color attach="background" args={[background]} />
        )}
        <ArchitectureCameraControls
          zoomCommand={zoomCommand}
          onZoomComplete={onZoomComplete}
          rotationCommand={rotationCommand}
        />
        <ambientLight intensity={1.15} />
        <pointLight position={[0, 4, 5]} intensity={32} color="#b6e9ff" />
        <pointLight position={[-4, 1, 2]} intensity={18} color="#36bfff" />
        <pointLight position={[4, -2, -2]} intensity={18} color="#a58bff" />

        <Stars radius={45} depth={35} count={500} factor={2} fade speed={0.3} />

        {/* CPU enclosure */}
        <mesh position={isSplit ? [0, 0, -1.3] : [0, 0, -0.55]}>
          <boxGeometry args={[3.15, 2.75, 0.16]} />
          <meshBasicMaterial
            color="#55cfff"
            wireframe
            transparent
            opacity={0.3}
          />
        </mesh>

        <Html
          position={isSplit ? [0, 1.95, -1.2] : [0, 1.65, -0.4]}
          center
          distanceFactor={10}
          style={{ pointerEvents: 'none', whiteSpace: 'nowrap' }}
        >
          <span
            style={{
              color: '#6fe4ff',
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: 2,
            }}
          >
            CENTRAL PROCESSING UNIT
          </span>
        </Html>

        {COMPONENTS.map((component) => {
          const splitOffsets: Record<string, [number, number, number]> = {
            alu: [-0.65, 0.55, 0.65],
            'control-unit': [0.65, 0.55, 0.65],
            registers: [0, -0.65, 0.9],
            ram: [0.8, 0, 0.35],
            storage: [-0.8, 0, 0.35],
          }
          const offset = splitOffsets[component.id] ?? [0, 0, 0]
          const displayedComponent: ComponentInfo = {
            ...component,
            position: isSplit
              ? [
                  component.position[0] + offset[0],
                  component.position[1] + offset[1],
                  component.position[2] + offset[2],
                ]
              : component.position,
          }

          return (
            <ArchitectureBlock
              key={component.id}
              component={displayedComponent}
              selected={selectedComponent?.id === component.id}
              showLabels={showLabels}
              onSelect={setSelectedComponent}
              displayMode={displayMode}
            />
          )
        })}

        <DataPathways simulationOn={simulationOn} />

        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.07}
          minDistance={5.5}
          maxDistance={15}
          autoRotate={autoRotate}
          autoRotateSpeed={0.55}
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
        COMPUTER ARCHITECTURE · SELECT A COMPONENT
      </div>

      <div
        style={{
          position: 'absolute',
          top: 14,
          right: 14,
          zIndex: 5,
        }}
      >
        <button
          type="button"
          onClick={() => setIsSplit((value) => !value)}
          aria-pressed={isSplit}
          style={{
            padding: '9px 12px',
            borderRadius: 8,
            border: '1px solid rgba(93, 205, 255, 0.55)',
            background: isSplit ? 'rgba(40, 120, 190, 0.9)' : 'rgba(4, 15, 31, 0.92)',
            color: '#e8f7ff',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {isSplit ? 'Reset Model' : 'Split Model'}
        </button>
      </div>

      {selectedComponent && (
        <section
          aria-live="polite"
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            width: 'min(290px, calc(100% - 32px))',
            padding: 14,
            borderRadius: 12,
            border: `1px solid ${selectedComponent.color}99`,
            background: 'rgba(4, 15, 31, 0.95)',
            boxShadow: '0 10px 36px rgba(0,0,0,0.3)',
            color: '#e8f7ff',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            <strong style={{ fontSize: 14 }}>{selectedComponent.name}</strong>
            <button
              type="button"
              aria-label="Close component details"
              onClick={() => setSelectedComponent(null)}
              style={{
                border: 0,
                color: '#c5e8fa',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: 20,
              }}
            >
              ×
            </button>
          </div>
          <p
            style={{
              fontSize: 12,
              lineHeight: 1.6,
              color: '#a9c6db',
              marginBottom: 0,
            }}
          >
            {selectedComponent.description}
          </p>
        </section>
      )}
    </div>
  )
}
