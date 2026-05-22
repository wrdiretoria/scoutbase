'use client'

export default function SpinningGlobe() {
  return (
    <>
      <style>{`
        @keyframes globeSpin {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes globeAura {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50%       { opacity: 0.70; transform: scale(1.06); }
        }
        @keyframes globeOrbit {
          0%   { transform: rotate(0deg)   translateX(66px) rotate(0deg); }
          100% { transform: rotate(360deg) translateX(66px) rotate(-360deg); }
        }
      `}</style>

      <div style={{
        width: '100%',
        height: '180px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}>

        {/* Pulsing aura */}
        <div style={{
          position: 'absolute',
          width: '170px',
          height: '170px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,255,136,0.10) 0%, rgba(0,255,136,0.02) 55%, transparent 72%)',
          animation: 'globeAura 4s ease-in-out infinite',
          pointerEvents: 'none',
        }} />

        {/* Outer ring */}
        <div style={{
          position: 'absolute',
          width: '148px',
          height: '148px',
          borderRadius: '50%',
          border: '1px solid rgba(0,255,136,0.10)',
          pointerEvents: 'none',
        }} />

        {/* Orbiting dot */}
        <div style={{
          position: 'absolute',
          width: '148px',
          height: '148px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'globeOrbit 8s linear infinite',
          pointerEvents: 'none',
        }}>
          <div style={{
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            background: '#00FF88',
            boxShadow: '0 0 6px #00FF88, 0 0 12px rgba(0,255,136,0.6)',
          }} />
        </div>

        {/* Globe sphere */}
        <div style={{
          position: 'relative',
          width: '128px',
          height: '128px',
          borderRadius: '50%',
          overflow: 'hidden',
          border: '1.5px solid rgba(0,255,136,0.28)',
          boxShadow:
            '0 0 0 3px rgba(0,255,136,0.05), ' +
            '0 8px 40px rgba(0,0,0,0.7)',
        }}>

          {/* Dark space base */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 40% 20%, #041a0c 0%, #020c06 55%, #010704 100%)',
          }} />

          {/* Spinning latitude + longitude grid — two layers at diff speeds for depth */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '200%',
            height: '100%',
            animation: 'globeSpin 10s linear infinite',
            backgroundImage: [
              'linear-gradient(rgba(0,255,136,0.22) 1px, transparent 1px)',
              'linear-gradient(90deg, rgba(0,255,136,0.22) 1px, transparent 1px)',
            ].join(', '),
            backgroundSize: '22px 22px',
          }} />

          {/* Second layer — slower, slightly different color for parallax */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '200%',
            height: '100%',
            animation: 'globeSpin 22s linear infinite reverse',
            backgroundImage: [
              'linear-gradient(rgba(0,255,136,0.07) 1px, transparent 1px)',
              'linear-gradient(90deg, rgba(0,255,136,0.07) 1px, transparent 1px)',
            ].join(', '),
            backgroundSize: '44px 44px',
          }} />

          {/* 3-D depth illusion: dark edges + subtle light source top-left */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: [
              'radial-gradient(circle at 32% 34%, rgba(0,255,136,0.09) 0%, transparent 42%)',
              'radial-gradient(circle at 50% 50%, transparent 48%, rgba(0,0,0,0.88) 100%)',
            ].join(', '),
            pointerEvents: 'none',
          }} />
        </div>

        {/* Equatorial glow stripe */}
        <div style={{
          position: 'absolute',
          width: '128px',
          height: '1px',
          background:
            'linear-gradient(90deg, transparent 0%, rgba(0,255,136,0.35) 25%, rgba(0,255,136,0.35) 75%, transparent 100%)',
          pointerEvents: 'none',
        }} />

        {/* City dots — fixed over the sphere */}
        {([
          [0,   -22],  // top centre
          [28,    8],  // right
          [-26,  14],  // left
          [10,   32],  // bottom-right
          [-14, -12],  // mid-left
          [20,  -36],  // top-right
        ] as [number, number][]).map(([x, y], i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `calc(50% + ${x}px)`,
            top:  `calc(50% + ${y}px)`,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
          }}>
            <div style={{
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              background: '#00FF88',
              boxShadow: '0 0 5px rgba(0,255,136,0.9)',
              opacity: 0.85,
            }} />
          </div>
        ))}
      </div>
    </>
  )
}
