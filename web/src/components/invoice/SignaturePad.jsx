import React, { useRef, useEffect } from 'react'
import SignaturePad from 'signature_pad'

export default function SignaturePadComponent({ onChange }) {
  const canvasRef = useRef(null)
  const padRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    padRef.current = new SignaturePad(canvas, {
      backgroundColor: 'rgb(255,255,255)',
      penColor: '#000000',
      minWidth: 1,
      maxWidth: 3,
    })

    function resize() {
      const ratio = Math.max(window.devicePixelRatio || 1, 1)
      canvas.width = canvas.offsetWidth * ratio
      canvas.height = canvas.offsetHeight * ratio
      canvas.getContext('2d').scale(ratio, ratio)
      padRef.current.clear()
      if (onChange) onChange(null)
    }

    resize()
    window.addEventListener('resize', resize)

    padRef.current.addEventListener('endStroke', () => {
      if (!padRef.current.isEmpty() && onChange) {
        onChange(padRef.current.toDataURL('image/png'))
      }
    })

    return () => window.removeEventListener('resize', resize)
  }, [])

  function clear() {
    padRef.current?.clear()
    if (onChange) onChange(null)
  }

  return (
    <div>
      <div style={{
        border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12,
        background: '#ffffff', position: 'relative', overflow: 'hidden',
      }}>
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: 120, display: 'block', touchAction: 'none' }}
        />
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          pointerEvents: 'none', color: 'rgba(0,0,0,0.2)',
          fontSize: 13, whiteSpace: 'nowrap',
        }}>
          ✍️ Sign here
        </div>
      </div>
      <button onClick={clear} style={{
        marginTop: 8, padding: '6px 16px', borderRadius: 8,
        background: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.10)',
        fontSize: 13, color: 'rgba(255,255,255,0.5)',
      }}>Clear</button>
    </div>
  )
}

