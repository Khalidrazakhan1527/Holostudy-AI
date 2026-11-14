import { Canvas, useFrame } from '@react-three/fiber'
import { Html, OrbitControls, Stars, useGLTF } from '@react-three/drei'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

type Props = {
  showLabels?: boolean
  autoRotate?: boolean
  simulationOn?: boolean
  displayMode?: 'default' | 'dark' | 'glass'
}


function BloodFlowParticles({
  running,
  model,
}: {
  running: boolean
  model: THREE.Group
}) {
  const arterialRef = useRef<THREE.Points>(null)
  const venousRef = useRef<THREE.Points>(null)

  const paths = useMemo(() => {
    const arterial: THREE.Vector3[] = []
    const venous: THREE.Vector3[] = []

    model.updateMatrixWorld(true)

    model.traverse((object) => {
      if (!(object instanceof THREE.Mesh) || !object.visible) return
      const name = object.name.toLowerCase()
      const isArtery =
        name.includes('aorta') ||
        name.includes('artery') ||
        name.includes('arterial') ||
        name.includes('pulmonary trunk')
      const isVein =
        name.includes('vein') ||
        name.includes('vena cava') ||
        name.includes('venous')

      if (!isArtery && !isVein) return

      const geometry = object.geometry
      const position = geometry.getAttribute('position')
      if (!position || position.count === 0) return

      // Sample real mesh vertices and transform them into viewer coordinates.
      const destination = isArtery ? arterial : venous
      const step = Math.max(1, Math.floor(position.count / 160))
      const vertex = new THREE.Vector3()

      for (let i = 0; i < position.count; i += step) {
        vertex.fromBufferAttribute(position, i)
        vertex.applyMatrix4(object.matrixWorld)
        destination.push(vertex.clone())
      }
    })

    return { arterial, venous }
  }, [model])

  const arterialGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    geometry.setFromPoints(paths.arterial)
    return geometry
  }, [paths])

  const venousGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    geometry.setFromPoints(paths.venous)
    return geometry
  }, [paths])

  useFrame(({ clock }) => {
    if (!running) return
    const pulse = 0.75 + Math.sin(clock.elapsedTime * Math.PI * 2 * 1.2) * 0.25

    if (arterialRef.current) {
      const material = arterialRef.current.material as THREE.PointsMaterial
      material.opacity = pulse
      material.size = 0.025 + pulse * 0.018
    }

    if (venousRef.current) {
      const material = venousRef.current.material as THREE.PointsMaterial
      material.opacity = 0.65 + pulse * 0.25
      material.size = 0.025 + pulse * 0.012
    }
  })

  return (
    <group>
      <points ref={arterialRef} geometry={arterialGeometry}>
        <pointsMaterial color="#ff344f" size={0.035} sizeAttenuation transparent opacity={0.9} />
      </points>
      <points ref={venousRef} geometry={venousGeometry}>
        <pointsMaterial color="#28a7ff" size={0.035} sizeAttenuation transparent opacity={0.85} />
      </points>
    </group>
  )
}


function HologramScan() {
  const beamRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.MeshBasicMaterial>(null)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (beamRef.current) {
      beamRef.current.position.y = -2.35 + ((t * 0.72) % 4.7)
    }
    if (materialRef.current) {
      materialRef.current.opacity = 0.16 + (Math.sin(t * 4.2) + 1) * 0.045
    }
  })

  return (
    <group>
      <mesh ref={beamRef} position={[0, -2.35, 0.42]}>
        <planeGeometry args={[2.8, 0.018]} />
        <meshBasicMaterial
          ref={materialRef}
          color="#53f5ff"
          transparent
          opacity={0.2}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}


function HologramPlatform() {
  const groupRef = useRef<THREE.Group>(null)
  const ringRefs = useRef<(THREE.Mesh | null)[]>([])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (groupRef.current) {
      groupRef.current.position.y = -2.18 + Math.sin(t * 1.4) * 0.025
    }
    ringRefs.current.forEach((ring, i) => {
      if (!ring) return
      ring.rotation.z = t * (i % 2 === 0 ? 0.12 : -0.09)
      const pulse = 1 + Math.sin(t * 2 + i * 0.8) * 0.018
      ring.scale.setScalar(pulse)
    })
  })

  return (
    <group ref={groupRef} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh position={[0, 0, -0.035]}>
        <circleGeometry args={[1.12, 80]} />
        <meshBasicMaterial
          color="#32dfff"
          transparent
          opacity={0.09}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {[0.72, 0.91, 1.08, 1.27].map((radius, i) => (
        <mesh
          key={radius}
          ref={(el) => { ringRefs.current[i] = el }}
          position={[0, 0, i * 0.006]}
        >
          <ringGeometry args={[radius - 0.008, radius, 128]} />
          <meshBasicMaterial
            color={i === 1 ? '#8afaff' : '#19cfff'}
            transparent
            opacity={i === 1 ? 0.85 : 0.48}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>
      ))}

      {Array.from({ length: 28 }, (_, i) => {
        const angle = (i / 28) * Math.PI * 2
        const radius = i % 3 === 0 ? 1.16 : 0.98
        return (
          <mesh
            key={i}
            position={[
              Math.cos(angle) * radius,
              Math.sin(angle) * radius,
              0.012,
            ]}
          >
            <circleGeometry args={[i % 4 === 0 ? 0.018 : 0.009, 10]} />
            <meshBasicMaterial
              color="#48eaff"
              transparent
              opacity={0.8}
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

function CardiovascularModel({
  showLabels,
  simulationOn,
  displayMode,
}: Pick<Props, 'showLabels' | 'simulationOn' | 'displayMode'>) {
  const { scene } = useGLTF('/models/circulatory-system.glb')
  const rootRef = useRef<THREE.Group>(null)
  const heartRefs = useRef<THREE.Object3D[]>([])
  const model = useMemo(() => {
    const clone = scene.clone(true)
    clone.updateMatrixWorld(true)

    const bounds = new THREE.Box3().setFromObject(clone)
    const size = bounds.getSize(new THREE.Vector3())
    const center = bounds.getCenter(new THREE.Vector3())
    const maxDimension = Math.max(size.x, size.y, size.z)

    if (!Number.isFinite(maxDimension) || maxDimension <= 0) {
      console.error('Cardiovascular GLB has invalid geometry bounds.')
      return clone
    }

    const scale = 4.8 / maxDimension
    clone.scale.setScalar(scale)
    clone.position.set(-center.x * scale, -center.y * scale, -center.z * scale)

    const hearts: THREE.Object3D[] = []
    clone.traverse((object) => {
      const name = object.name.toLowerCase()

      if (object instanceof THREE.Mesh) {
        object.castShadow = true
        object.receiveShadow = true

        // The source asset includes a low-opacity body envelope.
        // Hide it so the actual cardiovascular anatomy is unobstructed.
        if (name.includes('orientation envelope')) {
          object.visible = false
          return
        }

        const materials = Array.isArray(object.material)
          ? object.material
          : [object.material]

        const updated = materials.map((material) => {
          const next = material.clone()

          if (next instanceof THREE.MeshStandardMaterial ||
              next instanceof THREE.MeshPhysicalMaterial) {
            next.roughness = 0.42
            next.metalness = 0.18
            next.envMapIntensity = 1.4

            // Keep the original vessel colours, but make the model visibly projected.
            next.color.lerp(new THREE.Color('#39c9ed'), displayMode === 'glass' ? 0.35 : 0)
            next.emissive.set('#00bfe8')
            next.emissiveIntensity = displayMode === 'glass' ? 0.65 : 0.03
            next.transparent = displayMode === 'glass'
            next.opacity = displayMode === 'glass' ? 0.78 : 1
            next.depthWrite = displayMode !== 'glass'
            next.needsUpdate = true
          }

          return next
        })

        object.material = Array.isArray(object.material) ? updated : updated[0]
      }

      if (
        name.includes('left ventricle') ||
        name.includes('right ventricle') ||
        name.includes('left atrium') ||
        name.includes('right atrium')
      ) {
        hearts.push(object)
      }
    })

    // Add a cyan edge overlay in Glass mode for a true holographic look.
    {
      const meshes: THREE.Mesh[] = []

      clone.traverse((object) => {
        if (
          object instanceof THREE.Mesh &&
          object.visible &&
          !object.name.toLowerCase().includes('orientation envelope')
        ) {
          meshes.push(object)
        }
      })

      meshes.forEach((mesh) => {
        // Cleaner contour edges keep the anatomy readable instead of filling it with triangles.
        const edgeGeometry = new THREE.EdgesGeometry(mesh.geometry, 18)
        const edgeMaterial = new THREE.LineBasicMaterial({
          color: '#55f3ff',
          transparent: true,
          opacity: displayMode === 'glass' ? 0.85 : 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          toneMapped: false,
        })

        const wireframe = new THREE.LineSegments(edgeGeometry, edgeMaterial)
        wireframe.name = 'hologram-wireframe'
        wireframe.renderOrder = 3
        mesh.add(wireframe)
      })
    }

    heartRefs.current = hearts
    return clone
  }, [scene, displayMode])

  useFrame(({ clock }) => {
    // Smooth two-stage heartbeat: a main contraction followed by a lighter beat.
    const t = clock.elapsedTime % 0.833
    const mainBeat = Math.exp(-Math.pow((t - 0.12) / 0.055, 2))
    const secondaryBeat = 0.32 * Math.exp(-Math.pow((t - 0.29) / 0.045, 2))
    const pulse = simulationOn ? Math.min(1, mainBeat + secondaryBeat) : 0

    heartRefs.current.forEach((part) => {
      // Preserve the source model's original scale and apply only a subtle pulse.
      const base = part.userData.baseHeartbeatScale as THREE.Vector3 | undefined
      if (!base) {
        part.userData.baseHeartbeatScale = part.scale.clone()
      }
      const original = part.userData.baseHeartbeatScale as THREE.Vector3
      const factor = 1 + pulse * 0.018
      part.scale.set(original.x * factor, original.y * factor, original.z * factor)
    })
  })

  return (
    <group ref={rootRef}>
      <primitive object={model} />
      {simulationOn && <BloodFlowParticles running={simulationOn} model={model} />}
      {showLabels && (
        <Html
          position={[0, 2.55, 0]}
          center
          distanceFactor={8}
          style={{ pointerEvents: 'none', whiteSpace: 'nowrap' }}
        >
          <div style={{
            color: '#8feaff',
            background: 'rgba(3, 12, 28, 0.9)',
            border: '1px solid rgba(80, 205, 255, 0.55)',
            borderRadius: 6,
            padding: '6px 10px',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 1,
          }}>
            HUMAN CARDIOVASCULAR SYSTEM
          </div>
        </Html>
      )}
    </group>
  )
}

useGLTF.preload('/models/circulatory-system.glb')

export default function CardiovascularSystem3D({
  showLabels = true,
  autoRotate = false,
  simulationOn = false,
  displayMode = 'default',
}: Props) {
  const background = displayMode === 'default' ? '#f7faff' : '#030711'

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      overflow: 'hidden',
      background: displayMode === 'default' ? '#f7faff' : 'radial-gradient(ellipse at 50% 42%, #09263b 0%, #041321 52%, #020711 100%)',
    }}>
      <Canvas
        camera={{ position: [0, 0.05, 5.6], fov: 36 }}
        dpr={[1, 1.7]}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={[background]} />
        <ambientLight intensity={1.05} />
        <hemisphereLight args={['#d9efff', '#351523', 1.5]} />
        <directionalLight position={[3, 5, 6]} intensity={2.2} color="#fff0e8" />
        <pointLight position={[-3, 1.5, 3]} intensity={7} color="#4bafff" />
        <pointLight position={[3, -1.5, 2]} intensity={5} color="#ff526f" />
        <pointLight position={[0, 3, -3]} intensity={4} color="#5bdfff" />
        <Stars radius={35} depth={25} count={350} factor={1.6} fade speed={0.2} />

        <CardiovascularModel
          showLabels={showLabels}
          simulationOn={simulationOn}
          displayMode={displayMode}
        />
        <HologramPlatform />
        <HologramScan />

        <OrbitControls
          makeDefault
          autoRotate={autoRotate}
          autoRotateSpeed={0.7}
          enableDamping
          dampingFactor={0.08}
          minDistance={2.2}
          maxDistance={12}
          target={[0, 0, 0]}
        />
      </Canvas>
    </div>
  )
}
