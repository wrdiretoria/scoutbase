import { Composition, registerRoot } from 'remotion';
import { AtletaCard } from './AtletaCard';
import type { AtletaData } from './AtletaCard';

const atletaMock: AtletaData = {
  nome: 'Gabriel Silva',
  posicao: 'ATA',
  clube: 'SC Corinthians',
  pais: 'Brasil',
  ovr: 78,
  tier: 'ouro',
  foto: '/meucraque-player.png',
  atributos: {
    PAC: 85,
    SHO: 80,
    PAS: 72,
    DRI: 83,
    DEF: 35,
    PHY: 74,
  },
};

function RemotionRoot() {
  return (
    <Composition
      id="AtletaCard"
      component={AtletaCard}
      durationInFrames={120}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{ atleta: atletaMock }}
    />
  );
}

registerRoot(RemotionRoot);
