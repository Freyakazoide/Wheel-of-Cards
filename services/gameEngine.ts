import { produce } from 'immer';
import { GlobalGameState, GameAction, GamePhase, PlayerState, Card, Ajah } from '../types';
import { AJAH_DECKS, MADNESS_DECK_TEMPLATE, MENTAL_STATE_DECK_TEMPLATE } from '../constants/decks';

// Fisher-Yates shuffle algorithm
const shuffle = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const calculateScore = (cards: Card[]): number => {
    const sum = cards.reduce((acc, card) => acc + card.value, 0);
    return sum > 9 ? sum - 9 : sum;
};

export const getInitialState = (): GlobalGameState => ({
  randSanity: 0,
  currentRound: 1,
  currentPlayerIndex: 0,
  saidarPointsToSpend: 2,
  activeMentalState: null,
  activeMadnessCard: null,
  permanentEnhancements: [],
  saidarTracks: { chama: 1, escudo: 1, calice: 1, teia: 1 },
  players: [],
  gamePhase: GamePhase.Setup,
  madnessDeck: shuffle(MADNESS_DECK_TEMPLATE),
  madnessDiscard: [],
  mentalStateDeck: shuffle(MENTAL_STATE_DECK_TEMPLATE),
  log: ["Bem-vindo a 'A Loucura de Rand Al'Thor'!"],
  winner: null,
  activeRoundEffects: [],
});

const log = (state: GlobalGameState, message: string) => {
    state.log.unshift(`${new Date().toLocaleTimeString()}: ${message}`);
    if (state.log.length > 20) {
        state.log.pop();
    }
};

// This new function will handle all phase transitions that don't require user input.
// It mutates the draft directly and is designed to be called from within a `produce` block.
const processAutomaticPhases = (draft: GlobalGameState) => {
    const phasesThatWaitForInput = [
        GamePhase.Setup,
        GamePhase.AjahTurns,
        GamePhase.SaidarTracks,
        GamePhase.GameOver,
    ];

    // Keep processing phases until we hit one that requires user input.
    while (!phasesThatWaitForInput.includes(draft.gamePhase)) {
        switch (draft.gamePhase) {
            case GamePhase.MentalState:
                draft.activeRoundEffects = []; // Reset effects for the new round.
                const [nextMentalState, ...remainingMentalDeck] = draft.mentalStateDeck;
                if (!nextMentalState) {
                    log(draft, "O baralho de Estados Mentais acabou! A loucura vence.");
                    draft.gamePhase = GamePhase.GameOver;
                    draft.winner = 'madness';
                    break; // Exit switch, loop will terminate due to GameOver phase
                }
                draft.activeMentalState = nextMentalState;
                draft.mentalStateDeck = remainingMentalDeck;
                log(draft, `Fase 1: Estado Mental de Rand - '${nextMentalState.id}' foi revelado.`);
                log(draft, `Efeito: ${nextMentalState.textoEfeito}`);

                // Store effect logic ID to be checked in other phases
                draft.activeRoundEffects.push(nextMentalState.idLogicaEfeito);

                draft.gamePhase = GamePhase.AjahTurns; // This will stop the loop
                break;

            case GamePhase.MadnessTurn:
                let [nextMadnessCard, ...remainingMadnessDeck] = draft.madnessDeck;
                if (!nextMadnessCard) {
                    draft.madnessDeck = shuffle(draft.madnessDiscard);
                    draft.madnessDiscard = [];
                    [nextMadnessCard, ...remainingMadnessDeck] = draft.madnessDeck;
                }
                draft.activeMadnessCard = nextMadnessCard;
                draft.madnessDeck = remainingMadnessDeck;
                log(draft, `Fase 3: A Loucura ataca! Valor da carta: ${nextMadnessCard.value}.`);

                let madnessCardValue = nextMadnessCard.value;
                if (draft.activeRoundEffects.includes('EFEITO_FURIA')) {
                    madnessCardValue += 2;
                    log(draft, `Efeito 'Fúria Cega' aumenta o valor da Loucura para ${madnessCardValue}.`);
                }

                const shieldBonus = Math.floor((draft.saidarTracks.escudo - 1) / 2);
                const baseDamage = Math.max(0, madnessCardValue - shieldBonus);
                log(draft, `Trilha do Escudo (Nível ${draft.saidarTracks.escudo}) reduz o dano em ${shieldBonus}. Dano base: ${baseDamage}.`);

                draft.players.forEach(p => {
                    p.life -= baseDamage;
                    log(draft, `${p.playerId} (${p.ajah}) sofreu ${baseDamage} de dano. Vida restante: ${p.life}.`);
                });

                // Here we'd apply danoDirecionado from activeMentalState

                if (draft.players.some(p => p.life <= 0)) {
                    log(draft, "Uma Ajah caiu! A loucura venceu.");
                    draft.gamePhase = GamePhase.GameOver;
                    draft.winner = 'madness';
                } else {
                   draft.gamePhase = GamePhase.SanityDamage;
                }
                break;
            
            case GamePhase.SanityDamage:
                const flameBonus = Math.floor((draft.saidarTracks.chama - 1) / 3);
                let totalDamage = draft.players
                    .filter(p => !p.isStanding)
                    .reduce((sum, p) => sum + p.currentScore, 0);
                
                log(draft, `Fase 4: Calculando dano à sanidade...`);
                log(draft, `Dano base (jogadoras não em stand): ${totalDamage}.`);
                log(draft, `Bônus da Trilha da Chama (Nível ${draft.saidarTracks.chama}): +${flameBonus} de dano.`);
                totalDamage += flameBonus;

                draft.randSanity -= totalDamage;
                log(draft, `Rand sofreu ${totalDamage} de dano à sanidade. Restante: ${draft.randSanity}.`);

                if (draft.randSanity <= 0) {
                    log(draft, "A sanidade de Rand foi restaurada! As Ajahs venceram!");
                    draft.gamePhase = GamePhase.GameOver;
                    draft.winner = 'players';
                } else {
                    draft.gamePhase = GamePhase.SaidarTracks;
                }
                break;
            
             case GamePhase.SaidarTracks:
                 log(draft, `Fase 5: Avançando as Trilhas de Saidar.`);
                 draft.saidarPointsToSpend = 2; // Can be modified by effects
                 draft.saidarTracks.teia++;
                 log(draft, `Teia da Influência avança para o nível ${draft.saidarTracks.teia}.`);
                 // Now this phase waits for user input via SPEND_SAIDAR_POINTS action.
                 break;

            case GamePhase.Cleanup:
                log(draft, `Fase 6: Preparação para a próxima rodada.`);
                // Discard cards
                draft.players.forEach(p => {
                    p.discardPile.push(...p.revealedCards);
                    p.revealedCards = [];
                    // Draw back up to 4
                    while(p.hand.length < 4) {
                        if (p.drawDeck.length === 0) {
                            if (p.discardPile.length === 0) break; // No cards left anywhere
                            log(draft, `${p.playerId} reembaralhou o descarte.`);
                            p.drawDeck = shuffle(p.discardPile);
                            p.discardPile = [];
                        }
                        const drawnCard = p.drawDeck.pop();
                        if(drawnCard) p.hand.push(drawnCard);
                    }
                    // Reset flags
                    p.isStanding = false;
                    p.currentScore = 0;
                });
                if(draft.activeMadnessCard) {
                    draft.madnessDiscard.push(draft.activeMadnessCard);
                    draft.activeMadnessCard = null;
                }
                // Check enhancement condition
                // ...
                
                // Advance round
                draft.currentRound++;
                draft.currentPlayerIndex = (draft.currentPlayerIndex + 1) % draft.players.length;
                
                if (draft.currentRound > 10) {
                     log(draft, "A décima rodada terminou! A loucura venceu.");
                    draft.gamePhase = GamePhase.GameOver;
                    draft.winner = 'madness';
                } else {
                    draft.gamePhase = GamePhase.MentalState;
                }
                break;
        }
    }
};


export const gameReducer = (state: GlobalGameState, action: GameAction): GlobalGameState => {
    switch (action.type) {
        case 'START_GAME':
            return produce(state, draft => {
                const playerCount = action.playerAjans.length;
                draft.randSanity = 50 + (playerCount - 1) * 20; // Example formula
                draft.players = action.playerAjans.map((ajah, index) => {
                    const drawDeck = shuffle(AJAH_DECKS[ajah]);
                    const hand = drawDeck.splice(0, 4);
                    return {
                        playerId: `Jogador ${index + 1}`,
                        ajah,
                        life: 40,
                        hand,
                        drawDeck,
                        discardPile: [],
                        revealedCards: [],
                        currentScore: 0,
                        isStanding: false,
                    };
                });
                draft.gamePhase = GamePhase.MentalState;
                log(draft, `O jogo começou com ${playerCount} jogadoras. A sanidade de Rand é ${draft.randSanity}.`);
                processAutomaticPhases(draft);
            });
        
        case 'REVEAL_CARDS': {
            return produce(state, draft => {
                const player = draft.players[action.playerIndex];
                const cardsToReveal: Card[] = [];
                // Sort indices descending to avoid splice issues
                const sortedIndices = [...action.cardIndices].sort((a,b) => b-a);
                sortedIndices.forEach(index => {
                    cardsToReveal.push(player.hand.splice(index, 1)[0]);
                });
                
                player.revealedCards.push(...cardsToReveal);
                
                if (!draft.activeRoundEffects.includes('EFEITO_DESCONFIANCA')) {
                  player.currentScore = calculateScore(player.revealedCards);
                }

                log(draft, `${player.playerId} revelou ${cardsToReveal.length} carta(s). Pontuação atual: ${player.currentScore}.`);
            });
        }

        case 'STAND': {
            return produce(state, draft => {
                const player = draft.players[action.playerIndex];

                if (draft.activeRoundEffects.includes('EFEITO_HESITACAO')) {
                    const isFirstToStand = draft.players.every(p => !p.isStanding);
                    if (isFirstToStand) {
                        if (player.hand.length > 0) {
                            const randomIndex = Math.floor(Math.random() * player.hand.length);
                            const [discardedCard] = player.hand.splice(randomIndex, 1);
                            player.discardPile.push(discardedCard);
                            log(draft, `${player.playerId} foi o primeiro a ficar em 'Stand' e descartou uma carta aleatória devido à 'Hesitação'.`);
                        }
                    }
                }

                const cardsToReveal: Card[] = [];
                const sortedIndices = [...action.cardIndices].sort((a,b) => b-a);
                sortedIndices.forEach(index => {
                    cardsToReveal.push(player.hand.splice(index, 1)[0]);
                });

                player.revealedCards.push(...cardsToReveal);
                
                if (!draft.activeRoundEffects.includes('EFEITO_DESCONFIANCA')) {
                    player.currentScore = calculateScore(player.revealedCards);
                }

                player.isStanding = true;
                log(draft, `${player.playerId} revelou ${cardsToReveal.length} carta(s) e está em 'Stand'. Pontuação final: ${player.currentScore}.`);
            });
        }

        case 'END_AJAH_TURN': {
            return produce(state, draft => {
                const allPlayersHavePlayed = draft.players.every(p => p.revealedCards.length >= 2);
                
                if (allPlayersHavePlayed) {
                    log(draft, "Todas as Ajahs jogaram. A Fase 2 terminou.");

                    if (draft.activeRoundEffects.includes('EFEITO_DESCONFIANCA')) {
                        log(draft, `Efeito 'Desconfiança' ativo: calculando todas as pontuações agora.`);
                        draft.players.forEach(p => {
                            p.currentScore = calculateScore(p.revealedCards);
                            log(draft, `Pontuação final de ${p.playerId}: ${p.currentScore}.`);
                        });
                    }
                    if (draft.activeRoundEffects.includes('EFEITO_CALMA')) {
                        const noPlayerBusted = draft.players.every(p => {
                            const sum = p.revealedCards.reduce((acc, card) => acc + card.value, 0);
                            return sum <= 9;
                        });
                        if (noPlayerBusted) {
                            log(draft, `Efeito 'Calma Enganosa' ativo: Nenhum jogador estourou. Rand recupera 5 de Sanidade.`);
                            draft.randSanity += 5;
                        } else {
                            log(draft, `Efeito 'Calma Enganosa': Pelo menos um jogador estourou. Nenhum bônus.`);
                        }
                    }

                    draft.gamePhase = GamePhase.MadnessTurn;
                    processAutomaticPhases(draft);
                } else {
                    let nextPlayerIndex = draft.currentPlayerIndex;
                    const playerCount = draft.players.length;
                    let attempts = 0;
                    do {
                        nextPlayerIndex = (nextPlayerIndex + 1) % playerCount;
                        attempts++;
                    } while (draft.players[nextPlayerIndex].revealedCards.length >= 2 && attempts <= playerCount);

                    if (attempts <= playerCount) {
                        draft.currentPlayerIndex = nextPlayerIndex;
                        log(draft, `Turno encerrado. Próxima jogadora: ${draft.players[draft.currentPlayerIndex].playerId}.`);
                    } else {
                        log(draft, "Todas as Ajahs jogaram (fallback). A Fase 2 terminou.");
                        draft.gamePhase = GamePhase.MadnessTurn;
                        processAutomaticPhases(draft);
                    }
                }
            });
        }

        case 'SPEND_SAIDAR_POINTS': {
            return produce(state, draft => {
                const { upgrades } = action;
                const totalPointsToSpend = upgrades.chama + upgrades.escudo + upgrades.calice;

                if (totalPointsToSpend > draft.saidarPointsToSpend || totalPointsToSpend <= 0) {
                    log(draft, `Tentativa de gasto de pontos inválida.`);
                    return; 
                }
                
                if (upgrades.chama > 0 && draft.activeRoundEffects.includes('EFEITO_BLOQUEIA_CHAMA_RODADA')) {
                    log(draft, `Efeito 'Medo Paralisante' impede o avanço na Trilha da Chama.`);
                    return;
                }

                draft.saidarTracks.chama += upgrades.chama;
                draft.saidarTracks.escudo += upgrades.escudo;
                draft.saidarTracks.calice += upgrades.calice;
                draft.saidarPointsToSpend -= totalPointsToSpend;
                log(draft, `Trilhas avançadas. Chama: +${upgrades.chama}, Escudo: +${upgrades.escudo}, Cálice: +${upgrades.calice}.`);
                
                if(draft.saidarPointsToSpend === 0) {
                    draft.gamePhase = GamePhase.Cleanup;
                    processAutomaticPhases(draft);
                }
            });
        }


        case 'ADVANCE_PHASE': {
            // This action is now a no-op as the only phase that might have used it (SaidarTracks)
            // is handled automatically. We keep it to avoid breaking types, but it does nothing.
            return state;
        }

        default:
            return state;
    }
};
