import { useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import {
  OrbitControls,
  Html,
  Line,
  Float,
  Sparkles,
} from '@react-three/drei'
import * as THREE from 'three'

type Neuron = {
  id: number
  layer: number
  index: number
  position: [number, number, number]
  label: string
}

type NeuralNetwork3DProps = {
  showLabels: boolean
  onSelectNeuron: (neuron: Neuron | null) => void
}

const LAYERS = [
  { name: 'Input Layer', count: 4, x: -3.5 },
  { name: 'Hidden Layer 1', count: 5, x: -1.2 },
  { name: 'Hidden Layer 2', count: 4, x: 1.2 },
  { name: 'Output Layer', count: 3, x: 3.5 },
]

const COLORS = ['#13c8f5', '#8b70ff', '#a184ff', '#21d6ad']

function createNeurons(): Neuron[] {
  const neurons: Neuron[] = []
  let id = 0

  LAYERS.forEach((layer, layerIndex) => {
    for (let i = 0; i < layer.count; i++) {
      const spacing = 1.12
      const y = ((layer.count - 1) * spacing) / 2 - i * spacing

      // Slight depth variation makes the network visibly three-dimensional.
      const z = Math.sin(i * 1.7 + layerIndex * 0.9) * 0.62

      neurons.push({
        id,
        layer: layerIndex,
        index: i,
        position: [layer.x, y, z],
        label: `${layer.name} · Neuron ${i + 1}`,
      })

      id++
    }
  })

  return neurons
}

const NEURONS = createNeurons()

type Connection = {
  start: Neuron
  end: Neuron
}

function NeuronNode({
  neuron,
  selected,
  showLabels,
  onSelect,
}: {
  neuron: Neuron
  selected: boolean
  showLabels: boolean
  onSelect: (event: ThreeEvent<MouseEvent>) => void
}) {
  const color = COLORS[neuron.layer]

  return (
    <group position={neuron.position}>
      <Float
        speed={0.65 + neuron.index * 0.08}
        rotationIntensity={0.08}
        floatIntensity={0.12}
      >
        {/* Outer holographic aura */}
        <mesh>
          <sphereGeometry args={[selected ? 0.38 : 0.29, 24, 24]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={selected ? 0.12 : 0.055}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Clickable neuron core */}
        <mesh
          onClick={onSelect}
          onPointerOver={(event) => {
            event.stopPropagation()
            document.body.style.cursor = 'pointer'
          }}
          onPointerOut={() => {
            document.body.style.cursor = 'auto'
          }}
        >
          <sphereGeometry args={[selected ? 0.19 : 0.145, 32, 32]} />
          <meshStandardMaterial
            color={selected ? '#ffffff' : color}
            emissive={color}
            emissiveIntensity={selected ? 3 : 1.7}
            roughness={0.18}
            metalness={0.1}
          />
        </mesh>

        {/* Fine wireframe around each neuron */}
        <mesh scale={selected ? 1.85 : 1.55}>
          <icosahedronGeometry args={[0.16, 1]} />
          <meshBasicMaterial
            color={color}
            wireframe
            transparent
            opacity={selected ? 0.85 : 0.36}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {selected && (
          <mesh>
            <torusGeometry args={[0.31, 0.012, 8, 48]} />
            <meshBasicMaterial
              color="#ffffff"
              transparent
              opacity={0.9}
            />
          </mesh>
        )}
      </Float>

      {showLabels && (
        <Html
          position={[0.2, 0.22, 0]}
          center={false}
          distanceFactor={10}
          style={{
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          <div className={`neuron-label ${selected ? 'neuron-label-selected' : ''}`}>
            N{neuron.id + 1}
          </div>
        </Html>
      )}
    </group>
  )
}

function ConnectionBeam({
  connection,
  index,
}: {
  connection: Connection
  index: number
}) {
  const particleMesh = useRef<THREE.Mesh | null>(null)
  const glowMesh = useRef<THREE.Mesh | null>(null)

  const points = useMemo(
    () => [
      new THREE.Vector3(...connection.start.position),
      new THREE.Vector3(...connection.end.position),
    ],
    [connection],
  )

  const curve = useMemo(
    () => new THREE.LineCurve3(points[0], points[1]),
    [points],
  )

  const progress = useMemo(
    () => ({ value: (index * 0.137) % 1 }),
    [index],
  )

  useFrame((_, delta) => {
    progress.value = (progress.value + delta * 0.32) % 1
    const position = curve.getPoint(progress.value)

    if (particleMesh.current) {
      particleMesh.current.position.copy(position)
    }

    if (glowMesh.current) {
      glowMesh.current.position.copy(position)
    }
  })

  return (
    <group>
      {/* Main connection */}
      <Line
        points={points}
        color={COLORS[connection.start.layer]}
        transparent
        opacity={0.48}
        lineWidth={1.25}
      />

      {/* Soft holographic light around the connection */}
      <Line
        points={points}
        color="#8defff"
        transparent
        opacity={0.2}
        lineWidth={2.8}
      />

      {/* Bright moving energy core */}
      <mesh
        ref={(node) => {
          particleMesh.current = node
        }}
      >
        <sphereGeometry args={[0.045, 16, 16]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={1}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Larger cyan glow follows the energy core */}
      <mesh
        ref={(node) => {
          glowMesh.current = node
        }}
      >
        <sphereGeometry args={[0.095, 16, 16]} />
        <meshBasicMaterial
          color="#3ce7ff"
          transparent
          opacity={0.25}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  )
}

function HologramRing({
  radius,
  tube,
  color,
  speed,
  tilt = 0,
}: {
  radius: number
  tube: number
  color: string
  speed: number
  tilt?: number
}) {
  const ringRef = useMemo(() => ({ rotation: 0 }), [])

  useFrame((_, delta) => {
    ringRef.rotation += delta * speed
  })

  return (
    <group rotation={[Math.PI / 2 + tilt, 0, ringRef.rotation]}>
      <mesh>
        <torusGeometry args={[radius, tube, 8, 128]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.78}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh>
        <torusGeometry args={[radius, tube * 3.5, 6, 128]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.075}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  )
}

function HologramPlatform() {
  return (
    <group position={[0, -3.0, 0]}>
      {/* Transparent circular projection surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <circleGeometry args={[3.15, 96]} />
        <meshBasicMaterial
          color="#54dfff"
          transparent
          opacity={0.045}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Concentric rotating hologram rings */}
      <HologramRing
        radius={2.85}
        tube={0.018}
        color="#29d9ff"
        speed={0.22}
      />
      <HologramRing
        radius={2.48}
        tube={0.012}
        color="#8b79ff"
        speed={-0.32}
        tilt={0.035}
      />
      <HologramRing
        radius={1.95}
        tube={0.009}
        color="#48e8d2"
        speed={0.42}
        tilt={-0.025}
      />

      {/* Small luminous markers around the platform */}
      {Array.from({ length: 24 }, (_, i) => {
        const angle = (i / 24) * Math.PI * 2
        const radius = i % 3 === 0 ? 2.68 : 2.77

        return (
          <mesh
            key={i}
            position={[
              Math.cos(angle) * radius,
              0.025,
              Math.sin(angle) * radius,
            ]}
          >
            <boxGeometry args={[i % 3 === 0 ? 0.12 : 0.045, 0.018, 0.025]} />
            <meshBasicMaterial
              color={i % 3 === 0 ? "#a5f4ff" : "#5bcbef"}
              transparent
              opacity={0.85}
            />
          </mesh>
        )
      })}
    </group>
  )
}

function NetworkScene({
  showLabels,
  selectedNeuron,
  onSelectNeuron,
}: {
  showLabels: boolean
  selectedNeuron: number | null
  onSelectNeuron: (neuron: Neuron | null) => void
}) {
  const connections = useMemo(() => {
    const result: Connection[] = []

    NEURONS.forEach((neuron) => {
      const nextLayer = NEURONS.filter(
        (candidate) => candidate.layer === neuron.layer + 1,
      )

      nextLayer.forEach((nextNeuron) => {
        result.push({ start: neuron, end: nextNeuron })
      })
    })

    return result
  }, [])

  return (
    <>
      <color attach="background" args={['#f7faff']} />

      <fog attach="fog" args={['#f7faff', 10, 22]} />

      <ambientLight intensity={1.2} />
      <pointLight position={[0, 3, 5]} intensity={24} color="#a9eaff" />
      <pointLight position={[-4, 2, 2]} intensity={16} color="#a995ff" />
      <pointLight position={[4, -2, 3]} intensity={13} color="#82f5d9" />

      {/* Subtle floating particles in the scene */}
      <Sparkles
        count={90}
        scale={[10, 6, 5]}
        size={2.1}
        speed={0.18}
        opacity={0.42}
        color="#74cde9"
      />

      {/* Soft floor grid */}
      <gridHelper
        args={[14, 28, '#c5ddec', '#e2edf6']}
        position={[0, -3.05, 0]}
      />

      <HologramPlatform />

      {connections.map((connection, index) => (
        <ConnectionBeam
          key={`${connection.start.id}-${connection.end.id}`}
          connection={connection}
          index={index}
        />
      ))}

      {LAYERS.map((layer, index) => (
        <group key={layer.name}>
          <Line
            points={[
              [layer.x, -2.9, -0.7],
              [layer.x, 2.9, -0.7],
            ]}
            color={COLORS[index]}
            transparent
            opacity={0.24}
            lineWidth={1}
            dashed
            dashSize={0.08}
            gapSize={0.09}
          />

          {showLabels && (
            <Html
              position={[layer.x, 2.85, 0]}
              center
              distanceFactor={10}
              style={{
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              <div className="layer-label">{layer.name}</div>
            </Html>
          )}
        </group>
      ))}

      {NEURONS.map((neuron) => (
        <NeuronNode
          key={neuron.id}
          neuron={neuron}
          selected={selectedNeuron === neuron.id}
          showLabels={showLabels}
          onSelect={(event) => {
            event.stopPropagation()
            onSelectNeuron(neuron)
          }}
        />
      ))}

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.07}
        rotateSpeed={0.7}
        zoomSpeed={1.4}
        minDistance={0.3}
        maxDistance={25}
        target={[0, 0, 0]}
      />
    </>
  )
}

export default function NeuralNetwork3D({
  showLabels,
  onSelectNeuron,
}: NeuralNetwork3DProps) {
  const [selectedNeuron, setSelectedNeuron] = useState<number | null>(null)

  function handleSelect(neuron: Neuron | null) {
    setSelectedNeuron(neuron?.id ?? null)
    onSelectNeuron(neuron)
  }

  return (
    <div className="neural-network-scene">
      <Canvas
        camera={{ position: [0, 0.15, 10.5], fov: 37 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: false }}
        onPointerMissed={() => handleSelect(null)}
      >
        <NetworkScene
          showLabels={showLabels}
          selectedNeuron={selectedNeuron}
          onSelectNeuron={handleSelect}
        />
      </Canvas>
    </div>
  )
}
