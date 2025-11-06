import { Ajah } from '../types';

export interface AbilityInfo {
  id: string;
  name: string;
  description: string;
  type: 'Ativa' | 'Passiva';
}

export const AJAH_ABILITIES: Record<Ajah, AbilityInfo[]> = {
  [Ajah.Azul]: [
    { id: 'OLHAR_PENETRANTE', name: 'Olhar Penetrante', description: 'Após os Estados Mentais serem revelados, revela a carta do topo do baralho da Loucura de Rand.', type: 'Passiva' },
    { id: 'INTRIGA_SUTIL', name: 'Intriga Sutil', description: '1/rodada, antes da Fase de Estado Mental, pode anular o Efeito Único de um Estado Mental.', type: 'Ativa' },
  ],
  [Ajah.Amarela]: [
    { id: 'TOQUE_CURATIVO', name: 'Toque Curativo', description: '1/rodada, cura 3 de vida em si ou em um aliado.', type: 'Ativa' },
    { id: 'ESCUDO_VITAL', name: 'Escudo Vital Escalonado', description: 'No início da rodada, um escudo passivo reduz o dano da carta de Loucura de Rand (Val 1-3: -1 dano; Val 4-6: -2 dano; Val 7-9: -4 dano).', type: 'Passiva' },
  ],
  [Ajah.Vermelha]: [
    { id: 'ESCUDO_RETALIACAO', name: 'Escudo de Retaliação', description: 'Após causar dano à Sanidade de Rand, ganha um escudo igual a metade do dano causado (arredondado para baixo).', type: 'Passiva' },
    { id: 'REPRESSAO_TOTAL', name: 'Repressão Total', description: '1/jogo, no Turno da Loucura, pode anular completamente o dano da carta de Loucura de Rand.', type: 'Ativa' },
  ],
  [Ajah.Verde]: [
    { id: 'TATICAS_BATALHA', name: 'Táticas de Batalha', description: 'Se você e outro jogador revelarem 2+ cartas, ambos causam +2 de dano à Sanidade de Rand.', type: 'Passiva' },
    { id: 'GUARDAO_VIGILANTE', name: 'Guardião Vigilante', description: '1/rodada, antes da Loucura ser revelada, pode escolher um jogador para dividir o dano da Loucura com você (arredondado para cima para você).', type: 'Ativa' },
  ],
  [Ajah.Cinzenta]: [
    { id: 'INFLUENCIA_FUTURA', name: 'Influência Futura', description: '1/jogo, pode remover 1 Aprimoramento Permanente de Rand.', type: 'Ativa' },
    { id: 'SOLUCAO_DIPLOMATICA', name: 'Solução Diplomática', description: '1/jogo, no início da Fase de Estado Mental, pode escolher não avançar nas Trilhas. Se o fizer, o grupo ganha 4 Saidar extras na próxima rodada.', type: 'Ativa' },
  ],
  [Ajah.Negra]: [
    { id: 'PALAVRA_CORROMPIDA', name: 'Palavra Corrompida', description: '1/rodada, antes dos turnos, escolhe um jogador. Se ele revelar 3 cartas, ele perde 7 de vida e ganha 1 Saidar extra na próxima rodada.', type: 'Ativa' },
    { id: 'OFERENDA_TENEBROSA', name: 'Oferenda Tenebrosa', description: '1/jogo, no início do Turno da Loucura, pode perder 10 de vida para anular o Efeito Único do Estado Mental da rodada.', type: 'Ativa' },
  ],
  [Ajah.Marrom]: [
    { id: 'ESTUDO_CONCENTRADO', name: 'Estudo Concentrado', description: 'No início do seu turno, pode descartar até 2 cartas da mão e comprar o mesmo número de cartas novas.', type: 'Ativa' },
    { id: 'ARQUIVO_MENTAL', name: 'Arquivo Mental', description: '1/rodada, após revelar suas cartas, pode colocar uma das cartas reveladas de volta no topo do seu baralho.', type: 'Passiva' },
  ],
  [Ajah.Branca]: [
    { id: 'RIGOR_LOGICO', name: 'Rigor Lógico', description: 'Se você revelar exatamente 2 cartas e a soma delas for um número par, você ignora o dano da carta da Loucura de Rand.', type: 'Passiva' },
    { id: 'BARREIRA_MENTAL', name: 'Barreira Mental', description: '1/rodada, quando um Estado Mental é revelado, pode escolher um jogador para reduzir pela metade o Efeito Único do Estado Mental para ele.', type: 'Ativa' },
  ],
};
