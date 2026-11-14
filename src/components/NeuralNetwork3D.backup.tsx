import { useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'

import { OrbitControls, Html, Line, Stars } from '@react-three/drei'

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
  { name: 'Input Layer', count: 4, x: -3.1 },
  { name: 'Hidden Layer 1', count: 5, x: -1.05 },
  { name: 'Hidden Layer 2', count: 4, x: 1.05 },
  { name: 'Output Layer', count: 3, x: 3.1 },
]

const COLORS = ['#38bdf8', '#8b7cff', '#a78bfa', '#34d399']

function createNeurons(): Neuron[] {
  const neurons: Neuron[] = []
  let id = 0

  LAYERS.forEach((layer, layerIndex) => {
    for (let i = 0; i < layer.count; i++) {
      const spacing = 1.05
      const y = (layer.count - 1) * spacing / 2 - i * spacing

      neurons.push({
        id,
        layer: layerIndex,
        index: i,
        position: [layer.x, y, 0],
        label: `${layer.name} · Neuron ${i + 1}`,
      })

      id++
    }
  })

  return neurons
}

const NEURONS = createNeurons()

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
        <sphereGeometry args={[selected ? 0.19 : 0.14, 24, 24]} />
        <meshStandardMaterial
          color={selected ? '#ffffff' : color}
          emissive={color}
          emissiveIntensity={selected ? 2.2 : 0.75}
          roughness={0.25}
          metalness={0.15}
        />
      </mesh>

      <mesh scale={selected ? 1.7 : 1.35}>
        <sphereGeometry args={[0.14, 20, 20]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={selected ? 0.23 : 0.09}
          depthWrite={false}
        />
      </mesh>

      {selected && (
        <mesh>
          <sphereGeometry args={[0.27, 24, 24]} />
          <meshBasicMaterial
            color={color}
            wireframe
            transparent
            opacity={0.75}
          />
        </mesh>
      )}

      {showLabels && (
        <Html
          position={[0.2, 0.17, 0]}
          distanceFactor={8}
          style={{ pointerEvents: 'none' }}
        >
          <div className={`neuron-label ${selected ? 'neuron-label-selected' : ''}`}>
            N{neuron.id + 1}
          </div>
        </Html>
      )}
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
    const result: { start: Neuron; end: Neuron }[] = []

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

      <ambientLight intensity={1.8} />
      <pointLight position={[0, 3, 5]} intensity={35} color="#b7e9ff" />
      <pointLight position={[-4, 2, 1]} intensity={18} color="#9d8cff" />
      <pointLight position={[4, -2, 2]} intensity={12} color="#7cebd4" />

      <Stars
        radius={35}
        depth={15}
        count={160}
        factor={1.2}
        saturation={0}
        fade
        speed={0.15}
      />

      {connections.map(({ start, end }) => (
        <Line
          key={`${start.id}-${end.id}`}
          points={[start.position, end.position]}
          color={start.layer === 2 ? '#9a8bea' : '#75bcd7'}
          transparent
          opacity={0.42}
          lineWidth={0.8}
        />
      ))}

      {LAYERS.map((layer, index) => (
        <group key={layer.name}>
          <Line
            points={[
              [layer.x, -2.7, -0.3],
              [layer.x, 2.7, -0.3],
            ]}
            color={COLORS[index]}
            transparent
            opacity={0.2}
            lineWidth={1}
            dashed
            dashSize={0.08}
            gapSize={0.07}
          />

          {showLabels && (
            <Html
              position={[layer.x, 2.65, 0]}
              center
              distanceFactor={8}
              style={{ pointerEvents: 'none' }}
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
        dampingFactor={0.08}
        minDistance={4}
        maxDistance={15}
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
        camera={{ position: [0, 0.3, 9.5], fov: 43 }}
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
