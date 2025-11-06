
export enum Ajah {
  Azul = "Azul",
  Amarela = "Amarela",
  Branca = "Branca",
  Marrom = "Marrom",
  Cinzenta = "Cinzenta",
  Verde = "Verde",
  Vermelha = "Vermelha",
  Negra = "Negra",
}

export enum GamePhase {
  Setup = "Setup",
  MentalState = "Fase 1: Estado Mental de Rand",
  AjahTurns = "Fase 2: Turnos das Ajahs",
  MadnessTurn = "Fase 3: Turno da Loucura de Rand",
  MadnessReaction = "Fase 3.1: Reação à Loucura",
  MadnessDamage = "Fase 3.2: Dano da Loucura",
  SanityDamage = "Fase 4: Cálculo de Dano à Sanidade",
  SaidarTracks = "Fase 5: Trilhas de Saidar",
  Cleanup = "Fase 6: Preparação",
  GameOver = "Fim de Jogo",
}

export interface Card {
  value: number;
  ajah: Ajah;
}

export interface PlayerState {
  playerId: string;
  ajah: Ajah;
  life: number;
  hand: Card[];
  drawDeck: Card[];
  discardPile: Card[];
  revealedCards: Card[];
  currentScore: number;
  isStanding: boolean;
  shield: number; // For Ajah Vermelha
  saidarBonus: number; // For Ajah Negra
  abilities: {
    [abilityId: string]: {
      usesLeft: number; // For 1/game abilities
      usedThisRound: boolean; // For 1/round abilities
      // FIX: Changed target type to `any` to allow for more complex ability targeting data.
      target?: any; // For targeted abilities, can be player index, card value, etc.
    };
  };
}

export interface MentalStateCard {
  id: string;
  level: number;
  textoEfeito: string;
  idLogicaEfeito: string;
  textoAprimoramento: string;
  idLogicaAprimoramento: string;
  idLogicaCondicao: string;
  idLogicaDano: string;
}

export interface MadnessCard {
  value: number;
}

export interface SaadarTracks {
  chama: number;
  escudo: number;
  calice: number;
  teia: number;
}

export interface GlobalGameState {
  randSanity: number;
  currentRound: number;
  currentPlayerIndex: number;
  saidarPointsToSpend: number;
  activeMentalState: MentalStateCard | null;
  activeMadnessCard: MadnessCard | null;
  topMadnessCardPreview: MadnessCard | null; // For Ajah Azul
  permanentEnhancements: string[];
  saidarTracks: SaadarTracks;
  players: PlayerState[];
  gamePhase: GamePhase;
  madnessDeck: MadnessCard[];
  madnessDiscard: MadnessCard[];
  mentalStateDeck: MentalStateCard[];
  log: string[];
  winner: 'players' | 'madness' | null;
  activeRoundEffects: string[];
  effects: {
    mentalStateEffectNullified: boolean; // Ajah Negra/Azul
    diplomaticSolutionUsed: boolean; // Ajah Cinzenta
  };
}

export type GameAction =
  | { type: 'SETUP_GAME'; playerCount: number }
  | { type: 'START_GAME'; playerAjans: Ajah[] }
  | { type: 'REVEAL_CARDS'; playerIndex: number; cardIndices: number[] }
  | { type: 'STAND'; playerIndex: number; cardIndices: number[] }
  | { type: 'END_AJAH_TURN' }
  | { type: 'SPEND_SAIDAR_POINTS'; upgrades: { chama: number; escudo: number; calice: number } }
  | { type: 'ADVANCE_PHASE' }
  | { type: 'DECLINE_REACTION' }
  // Ajah Abilities
  | { type: 'USE_ABILITY'; payload: { playerIndex: number; abilityId: string; options?: any } };
