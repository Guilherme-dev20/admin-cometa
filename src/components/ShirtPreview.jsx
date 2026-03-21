import { useRef, Suspense, useMemo, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF, Environment, useProgress } from '@react-three/drei'
import * as THREE from 'three'

const MODELS = {
  camiseta:   '/models/camisateste2.glb',
  mangalonga: '/models/mangalonga.glb',
}

// Preload imediato — roda assim que o arquivo é importado
useGLTF.preload('/models/camisateste2.glb')
useGLTF.preload('/models/mangalonga.glb')

function GLBShirt({ modelo = 'camiseta', textureDataUrl, rotRef, snapRef }) {
  const { scene } = useGLTF(MODELS[modelo] || MODELS.camiseta)
  const { gl } = useThree()
  const groupRef = useRef()
  const maxAniso = gl.capabilities.getMaxAnisotropy()

  const clone = useMemo(() => {
    const c = scene.clone(true)
    const box = new THREE.Box3().setFromObject(c)
    const sz = box.getSize(new THREE.Vector3())
    const max = Math.max(sz.x, sz.y, sz.z)
    if (max > 0) c.scale.setScalar(2.2 / max)
    const center = new THREE.Box3().setFromObject(c).getCenter(new THREE.Vector3())
    c.position.sub(center)
    return c
  }, [scene])

  useEffect(() => {
    const apply = (dataUrl) => {
      const img = new window.Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        canvas.getContext('2d').drawImage(img, 0, 0)
        const tex = new THREE.CanvasTexture(canvas)
        tex.colorSpace = THREE.SRGBColorSpace
        tex.flipY = false
        tex.anisotropy = maxAniso
        tex.needsUpdate = true
        const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: tex, roughness: 0.75, metalness: 0 })
        clone.traverse((c) => { if (c.isMesh) c.material = mat })
      }
      img.src = dataUrl
    }

    if (textureDataUrl) {
      apply(textureDataUrl)
    } else {
      clone.traverse((c) => {
        if (c.isMesh) c.material = new THREE.MeshStandardMaterial({ color: new THREE.Color('#cccccc'), roughness: 0.75 })
      })
    }
  }, [clone, textureDataUrl, maxAniso])

  useFrame((state) => {
    if (!groupRef.current) return
    if (snapRef.current !== null) {
      rotRef.current += (snapRef.current - rotRef.current) * 0.1
      if (Math.abs(snapRef.current - rotRef.current) < 0.005) {
        rotRef.current = snapRef.current
        snapRef.current = null
      }
    }
    groupRef.current.rotation.y = rotRef.current
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.06
  })

  return <group ref={groupRef}><primitive object={clone} /></group>
}

// Barra de progresso fora do Canvas — sempre visível
function LoadingBar() {
  const { active, progress } = useProgress()
  if (!active && progress >= 100) return null
  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(2,6,23,0.85)', zIndex: 10, borderRadius: 'inherit',
    }}>
      <div style={{ width: 120, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden', marginBottom: 8 }}>
        <div style={{
          width: `${progress}%`, height: '100%',
          background: 'linear-gradient(to right,#9333ea,#d946ef)',
          transition: 'width 0.3s ease',
        }} />
      </div>
      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontFamily: 'sans-serif' }}>
        Carregando modelo {Math.round(progress)}%
      </p>
    </div>
  )
}

export default function ShirtPreview({ modelo, textureDataUrl, snap }) {
  const rotRef = useRef(0)
  const snapRef = useRef(null)
  const dragRef = useRef(null)

  useEffect(() => {
    if (snap != null) snapRef.current = snap.angle
  }, [snap])

  function onPointerDown(e) {
    dragRef.current = { x: e.clientX, rot: rotRef.current }
    snapRef.current = null
  }
  function onPointerMove(e) {
    if (!dragRef.current) return
    rotRef.current = dragRef.current.rot + (e.clientX - dragRef.current.x) * 0.012
  }
  function onPointerUp() { dragRef.current = null }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <LoadingBar />
      <Canvas
        camera={{ position: [0, 0, 3.5], fov: 44 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent', width: '100%', height: '100%', cursor: 'grab', touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <ambientLight intensity={0.35} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} />
        <pointLight position={[0, 2, 2]} intensity={0.6} color="#8B5CF6" />
        <Suspense fallback={null}>
          <GLBShirt modelo={modelo} textureDataUrl={textureDataUrl} rotRef={rotRef} snapRef={snapRef} />
        </Suspense>
        <Environment preset="city" />
      </Canvas>
    </div>
  )
}
