import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  spring,
} from 'remotion';

export type Tier = 'bronze' | 'prata' | 'ouro';

export interface AtletaData {
  nome: string;
  posicao: string;
  clube: string;
  pais: string;
  ovr: number;
  tier: Tier;
  foto?: string;
  atributos: {
    PAC: number;
    SHO: number;
    PAS: number;
    DRI: number;
    DEF: number;
    PHY: number;
  };
}

const ACCENT: Record<Tier, string> = {
  bronze: '#c8832a',
  prata:  '#b8b8b8',
  ouro:   '#d4a017',
};

function Attr({ label, valor, cor }: { label: string; valor: number; cor: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <span style={{
        fontSize: 38,
        fontWeight: 900,
        color: '#fff',
        fontFamily: 'Arial Black, sans-serif',
        lineHeight: 1,
      }}>
        {valor}
      </span>
      <span style={{
        fontSize: 14,
        fontWeight: 800,
        color: cor,
        fontFamily: 'Arial, sans-serif',
        letterSpacing: 2,
      }}>
        {label}
      </span>
    </div>
  );
}

export function AtletaCard({ atleta }: { atleta: AtletaData }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cor = ACCENT[atleta.tier];

  const cardS  = spring({ frame, fps, config: { damping: 16, stiffness: 65 }, from: 0.82, to: 1 });
  const cardOp = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: 'clamp' });
  const photoS = spring({ frame: frame - 12, fps, config: { damping: 14, stiffness: 55 }, from: 0.7, to: 1 });
  const photoOp = interpolate(frame, [12, 32], [0, 1], { extrapolateRight: 'clamp' });
  const nameOp = interpolate(frame, [35, 52], [0, 1], { extrapolateRight: 'clamp' });
  const nameY  = interpolate(frame, [35, 52], [18, 0], { extrapolateRight: 'clamp' });
  const atOp   = interpolate(frame, [50, 65], [0, 1], { extrapolateRight: 'clamp' });
  const atY    = interpolate(frame, [50, 65], [14, 0], { extrapolateRight: 'clamp' });
  const lineW  = interpolate(frame, [48, 68], [0, 100], { extrapolateRight: 'clamp' });

  const sobrenome = atleta.nome.split(' ').slice(-1)[0].toUpperCase();
  const resto     = atleta.nome.split(' ').slice(0, -1).join(' ').toUpperCase();

  const W = 680, H = 500;

  return (
    <AbsoluteFill style={{ background: '#060606' }}>

      {/* Fundo: grade sutil */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `linear-gradient(#0e0e0e 1px, transparent 1px), linear-gradient(90deg, #0e0e0e 1px, transparent 1px)`,
        backgroundSize: '48px 48px',
      }} />

      {/* Glow central atrás do card */}
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 900, height: 700,
        borderRadius: '50%',
        background: `radial-gradient(ellipse, ${cor}18 0%, transparent 65%)`,
        opacity: cardOp,
      }} />

      {/* CARD */}
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{
          width: W,
          transform: `scale(${cardS})`,
          opacity: cardOp,
          position: 'relative',
        }}>

          {/* Borda exterior com glow */}
          <div style={{
            position: 'absolute', inset: -2,
            borderRadius: 20,
            background: `linear-gradient(145deg, ${cor}cc, ${cor}22, ${cor}88)`,
            filter: `blur(1px) drop-shadow(0 0 24px ${cor}88)`,
          }} />

          {/* Card body */}
          <div style={{
            position: 'relative',
            background: 'linear-gradient(155deg, #111111 0%, #080808 55%, #0f0f0f 100%)',
            borderRadius: 18,
            border: `1px solid ${cor}55`,
            padding: '26px 28px 22px',
            overflow: 'hidden',
            zIndex: 1,
          }}>

            {/* Risca de luz no topo */}
            <div style={{
              position: 'absolute', top: 0, left: '10%', right: '10%',
              height: 1,
              background: `linear-gradient(90deg, transparent, ${cor}bb, transparent)`,
            }} />

            {/* Colunas laterais de luz */}
            <div style={{ position: 'absolute', top: '5%', bottom: '5%', left: 0, width: 1, background: `linear-gradient(180deg, transparent, ${cor}44, transparent)` }} />
            <div style={{ position: 'absolute', top: '5%', bottom: '5%', right: 0, width: 1, background: `linear-gradient(180deg, transparent, ${cor}44, transparent)` }} />

            {/* === LINHA SUPERIOR: OVR / TIER / ESCUDO === */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>

              {/* Esquerda: OVR + Pos + Flag */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, minWidth: 60 }}>
                <span style={{ fontSize: 52, fontWeight: 900, color: cor, fontFamily: 'Arial Black', lineHeight: 1, textShadow: `0 0 20px ${cor}` }}>
                  {atleta.ovr}
                </span>
                <span style={{ fontSize: 18, fontWeight: 900, color: cor, fontFamily: 'Arial Black', letterSpacing: 2 }}>
                  {atleta.posicao}
                </span>
                <div style={{ width: 36, height: 1, background: `${cor}55`, margin: '4px 0' }} />
                {/* Bandeira BR inline SVG */}
                <svg width={34} height={22} viewBox="0 0 34 22" style={{ borderRadius: 2 }}>
                  <rect width={34} height={22} fill="#009c3b" />
                  <polygon points="17,2 32,11 17,20 2,11" fill="#ffdf00" />
                  <circle cx={17} cy={11} r={5} fill="#002776" />
                  <rect x={11} y={10.2} width={12} height={1.5} fill="#fff" />
                </svg>
              </div>

              {/* Centro: Tier badge */}
              <div style={{
                alignSelf: 'center',
                padding: '3px 14px',
                border: `1px solid ${cor}55`,
                borderRadius: 20,
                background: `${cor}0d`,
              }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: cor, letterSpacing: 5, textTransform: 'uppercase', fontFamily: 'Arial' }}>
                  {atleta.tier}
                </span>
              </div>

              {/* Direita: Escudo clube */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 60 }}>
                <div style={{
                  width: 50, height: 50, borderRadius: '50%',
                  border: `1.5px solid ${cor}55`,
                  background: '#181818',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 0 12px ${cor}33`,
                }}>
                  <svg width={28} height={28} viewBox="0 0 28 28">
                    <circle cx={14} cy={14} r={12} fill="#111" stroke={`${cor}44`} strokeWidth={1}/>
                    <text x={14} y={19} textAnchor="middle" fontSize={16} fill={cor} fontFamily="Arial Black" opacity={0.8}>⚽</text>
                  </svg>
                </div>
                <span style={{ fontSize: 9, color: `${cor}99`, fontFamily: 'Arial', letterSpacing: 1, textAlign: 'center', maxWidth: 58, lineHeight: 1.2 }}>
                  {atleta.clube}
                </span>
              </div>
            </div>

            {/* === FOTO === */}
            <div style={{
              width: W - 56,
              height: 380,
              position: 'relative',
              transform: `scale(${photoS})`,
              opacity: photoOp,
              margin: '0 auto 18px',
            }}>
              {/* Glow no rodapé da foto */}
              <div style={{
                position: 'absolute', bottom: -4, left: '50%',
                transform: 'translateX(-50%)',
                width: '70%', height: 30,
                background: `radial-gradient(ellipse, ${cor}55 0%, transparent 70%)`,
                filter: 'blur(6px)',
              }} />

              {atleta.foto ? (
                <img
                  src={atleta.foto}
                  style={{
                    width: '100%', height: '100%',
                    objectFit: 'cover', objectPosition: 'top center',
                    clipPath: 'polygon(8% 0%, 92% 0%, 100% 8%, 100% 92%, 92% 100%, 8% 100%, 0% 92%, 0% 8%)',
                  }}
                />
              ) : (
                <div style={{
                  width: '100%', height: '100%',
                  clipPath: 'polygon(8% 0%, 92% 0%, 100% 8%, 100% 92%, 92% 100%, 8% 100%, 0% 92%, 0% 8%)',
                  background: 'linear-gradient(180deg, #0e0e0e 0%, #070707 100%)',
                  display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                  overflow: 'hidden',
                }}>
                  {/* Gramado no fundo do placeholder */}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '35%', background: 'linear-gradient(180deg, transparent, #071403)' }} />
                  {/* Holofote suave */}
                  <div style={{
                    position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                    width: '60%', height: '80%',
                    background: `radial-gradient(ellipse at 50% 0%, ${cor}12 0%, transparent 70%)`,
                  }} />
                  {/* Silhueta */}
                  <svg width={280} height={360} viewBox="0 0 280 360" style={{ position: 'relative', zIndex: 1, marginBottom: 0 }}>
                    <ellipse cx={140} cy={52} rx={30} ry={34} fill="#141414" />
                    <ellipse cx={140} cy={36} rx={32} ry={20} fill="#0e0e0e" />
                    <path d="M 86 88 Q 76 86 70 108 L 62 148 L 218 148 L 210 108 Q 204 86 194 88 L 168 78 Q 152 122 140 122 Q 128 122 112 78 Z" fill="#141414" />
                    <text x={140} y={135} textAnchor="middle" fontSize={30} fontWeight={900} fill={cor} opacity={0.55} fontFamily="Arial Black">10</text>
                    <path d="M 70 108 Q 46 120 42 158 Q 56 162 62 148" fill="#141414" />
                    <path d="M 210 108 Q 234 120 238 158 Q 224 162 218 148" fill="#141414" />
                    <circle cx={244} cy={166} r={22} fill="#111" stroke={`${cor}33`} strokeWidth={1}/>
                    <path d="M 88 148 L 90 212 L 140 212 L 140 212 L 190 212 L 192 148 Z" fill="#0e0e0e" />
                    <rect x={92} y={210} width={42} height={128} rx={10} fill="#121212" />
                    <rect x={146} y={210} width={42} height={128} rx={10} fill="#121212" />
                    <ellipse cx={113} cy={342} rx={28} ry={10} fill="#0a0a0a" />
                    <ellipse cx={167} cy={342} rx={28} ry={10} fill="#0a0a0a" />
                    <path d={`M 87 336 Q 113 330 139 336`} stroke={cor} strokeWidth={1.5} fill="none" opacity={0.45}/>
                    <path d={`M 141 336 Q 167 330 193 336`} stroke={cor} strokeWidth={1.5} fill="none" opacity={0.45}/>
                  </svg>
                </div>
              )}

              {/* Borda octogonal */}
              <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} width={W - 56} height={380}>
                <defs>
                  <filter id="gl"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                </defs>
                <polygon
                  points={`${(W-56)*.08},0 ${(W-56)*.92},0 ${W-56},${380*.08} ${W-56},${380*.92} ${(W-56)*.92},${380} ${(W-56)*.08},${380} 0,${380*.92} 0,${380*.08}`}
                  fill="none" stroke={cor} strokeWidth={2} filter="url(#gl)"
                />
              </svg>
            </div>

            {/* === NOME === */}
            <div style={{ textAlign: 'center', opacity: nameOp, transform: `translateY(${nameY}px)`, marginBottom: 10 }}>
              {resto && (
                <div style={{ fontSize: 17, color: `${cor}cc`, fontFamily: 'Arial', letterSpacing: 6, textTransform: 'uppercase', marginBottom: 1 }}>
                  {resto}
                </div>
              )}
              <div style={{
                fontSize: 56,
                fontWeight: 900,
                color: '#fff',
                fontFamily: 'Arial Black, sans-serif',
                textTransform: 'uppercase',
                letterSpacing: 5,
                lineHeight: 1,
                textShadow: `0 0 32px ${cor}44`,
              }}>
                {sobrenome}
              </div>
            </div>

            {/* Linha divisória animada */}
            <div style={{
              height: 1,
              width: `${lineW}%`,
              margin: '0 auto 14px',
              background: `linear-gradient(90deg, transparent, ${cor}, #00ff44, ${cor}, transparent)`,
              opacity: nameOp,
            }} />

            {/* === ATRIBUTOS === */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '0 12px',
              opacity: atOp,
              transform: `translateY(${atY}px)`,
            }}>
              {Object.entries(atleta.atributos).map(([l, v]) => (
                <Attr key={l} label={l} valor={v} cor={cor} />
              ))}
            </div>

            {/* Rodapé */}
            <div style={{ textAlign: 'center', marginTop: 14, opacity: atOp * 0.6 }}>
              <span style={{ fontSize: 10, color: '#00ff44', fontFamily: 'Arial', letterSpacing: 5, textTransform: 'uppercase', fontWeight: 700 }}>
                meucraque.com
              </span>
            </div>

          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
