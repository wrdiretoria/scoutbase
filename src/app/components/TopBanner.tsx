/**
 * TopBanner — faixa fixa acima da NavBar
 * Altura: 44px | Fundo: preto com gradiente verde discreto
 */
export default function TopBanner() {
  return (
    <>
      <style>{`
        .top-banner {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 201;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(90deg, #080808 0%, #0a120b 40%, #0a120b 60%, #080808 100%);
          border-bottom: 1px solid rgba(0, 255, 136, 0.10);
          user-select: none;
        }
        .top-banner-text {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.72);
          letter-spacing: 0.03em;
          font-family: system-ui, sans-serif;
          white-space: nowrap;
        }
        .top-banner-icon {
          font-size: 14px;
          line-height: 1;
          filter: drop-shadow(0 0 6px rgba(0, 255, 136, 0.45));
        }
        .top-banner-phrase {
          background: linear-gradient(90deg, rgba(255,255,255,0.65) 0%, rgba(0,255,136,0.90) 60%, rgba(255,255,255,0.65) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        @media (max-width: 480px) {
          .top-banner-text {
            font-size: 12px;
            letter-spacing: 0.01em;
          }
        }
      `}</style>

      <div className="top-banner" role="banner" aria-label="Slogan MeuCraque">
        <p className="top-banner-text">
          <span className="top-banner-icon" aria-hidden="true">⚽</span>
          <span className="top-banner-phrase">A vitrine dos talentos do futebol de base</span>
        </p>
      </div>
    </>
  )
}
