
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

const calculateScore = (cards: Card[], permanentEnhancements: string[]): number => {
    const sum = cards.reduce((acc, card) => acc + card.value, 0);
    const bustLimit = permanentEnhancements.includes('APRIM_LIMITE_ESTOURO_10') ? 10 : 9;
    return sum > bustLimit ? sum - bustLimit : sum;
};


export const getInitialState = (): GlobalGameState => ({
  randSanity: 0,
  currentRound: 1,
  currentPlayerIndex: 0,
  saidarPointsToSpend: 2,
  activeMentalState: null,
  activeMadnessCard: null,
  topMadnessCardPreview: null,
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
  effects: {
    mentalStateEffectNullified: false,
    diplomaticSolutionUsed: false,
  }
});

const log = (state: GlobalGameState, message: string) => {
    state.log.unshift(`${new Date().toLocaleTimeString()}: ${message}`);
    if (state.log.length > 20) {
        state.log.pop();
    }
};

const applyDamageToPlayer = (draft: GlobalGameState, playerIndex: number, damage: number, source = "Loucura") => {
    if (damage <= 0) {
      log(draft, `${draft.players[playerIndex].playerId} não sofreu dano de ${source}.`);
      return;
    }
    const player = draft.players[playerIndex];
    let finalDamage = damage;
    
    // Ajah Branca: Rigor Lógico (Passiva)
    if(source === "Loucura" && player.ajah === Ajah.Branca && player.revealedCards.length === 2) {
        const sum = player.revealedCards.reduce((acc, card) => acc + card.value, 0);
        if (sum % 2 === 0) {
            finalDamage = 0;
            log(draft, `Habilidade (Branca): ${player.playerId} ignora o dano da Loucura devido a Rigor Lógico.`);
        }
    }

    // Ajah Amarela: Escudo Vital Escalonado (Passiva)
    if (source === "Loucura" && player.ajah === Ajah.Amarela && draft.activeMadnessCard) {
        const madnessValue = draft.activeMadnessCard.value;
        let reduction = 0;
        if (madnessValue <= 3) reduction = 1;
        else if (madnessValue <= 6) reduction = 2;
        else reduction = 4;
        finalDamage = Math.max(0, finalDamage - reduction);
        log(draft, `Habilidade (Amarela): Escudo Vital de ${player.playerId} reduziu o dano em ${reduction}.`);
    }

    // Habilidades de Escudo/Redução
    const shieldUsed = Math.min(player.shield, finalDamage);
    if (shieldUsed > 0) {
        finalDamage -= shieldUsed;
        player.shield -= shieldUsed;
        log(draft, `${player.playerId} usou ${shieldUsed} de escudo.`);
    }

    player.life -= finalDamage;
    log(draft, `${player.playerId} (${player.ajah}) sofreu ${finalDamage} de dano de ${source}. Vida restante: ${player.life}.`);
};

const checkAndApplyEnhancement = (draft: GlobalGameState) => {
    const mentalState = draft.activeMentalState;
    if (!mentalState || mentalState.idLogicaAprimoramento === 'APRIM_NENHUM') return;

    let conditionMet = false;
    switch(mentalState.idLogicaCondicao) {
        case 'COND_NENHUM_ESTOURO':
            conditionMet = draft.players.every(p => {
                const sum = p.revealedCards.reduce((acc, card) => acc + card.value, 0);
                const bustLimit = draft.permanentEnhancements.includes('APRIM_LIMITE_ESTOURO_10') ? 10 : 9;
                return sum <= bustLimit;
            });
            break;
        case 'COND_ALGUMA_AJAH_EM_STAND':
            conditionMet = draft.players.some(p => p.isStanding);
            break;
        case 'COND_CHAMA_LVL_3_MAIS':
            conditionMet = draft.saidarTracks.chama >= 3;
            break;
        case 'COND_NENHUMA':
        default:
            conditionMet = true; // Always apply if no specific condition
            break;
    }

    if(conditionMet && !draft.permanentEnhancements.includes(mentalState.idLogicaAprimoramento)) {
        log(draft, `Aprimoramento Permanente Ativado: '${mentalState.textoAprimoramento}'`);
        draft.permanentEnhancements.push(mentalState.idLogicaAprimoramento);
    }
}


const processAutomaticPhases = (draft: GlobalGameState) => {
    const phasesThatWaitForInput = [
        GamePhase.Setup,
        GamePhase.AjahTurns,
        GamePhase.SaidarTracks,
        GamePhase.GameOver,
        GamePhase.MadnessReaction,
    ];

    while (!phasesThatWaitForInput.includes(draft.gamePhase)) {
        switch (draft.gamePhase) {
            case GamePhase.MentalState:
                draft.activeRoundEffects = [];
                draft.topMadnessCardPreview = null;
                 Object.values(draft.players).forEach(p => Object.values(p.abilities).forEach(a => {
                    if (a.target) delete a.target; // Clear targets from previous round
                }));

                const [nextMentalState, ...remainingMentalDeck] = draft.mentalStateDeck;
                if (!nextMentalState) {
                    log(draft, "O baralho de Estados Mentais acabou! A loucura vence.");
                    draft.gamePhase = GamePhase.GameOver;
                    draft.winner = 'madness';
                    break;
                }
                draft.activeMentalState = nextMentalState;
                draft.mentalStateDeck = remainingMentalDeck;
                log(draft, `Fase 1: Estado Mental de Rand - '${nextMentalState.id}' foi revelado.`);
                
                if (draft.effects.mentalStateEffectNullified) {
                    log(draft, `O efeito do Estado Mental foi anulado por uma habilidade!`);
                    draft.effects.mentalStateEffectNullified = false;
                } else {
                    log(draft, `Efeito: ${nextMentalState.textoEfeito}`);
                    draft.activeRoundEffects.push(nextMentalState.idLogicaEfeito);
                }

                // Ajah Azul: Olhar Penetrante (Passiva)
                if (draft.players.some(p => p.ajah === Ajah.Azul)) {
                    draft.topMadnessCardPreview = draft.madnessDeck[0] || draft.madnessDiscard[0] || null;
                    if(draft.topMadnessCardPreview) {
                       log(draft, `Habilidade (Azul): A próxima carta da Loucura é revelada: Valor ${draft.topMadnessCardPreview.value}`);
                    }
                }
                
                draft.gamePhase = GamePhase.AjahTurns;
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

                const canReact = draft.players.some(p => p.ajah === Ajah.Vermelha && p.abilities['REPRESSAO_TOTAL']?.usesLeft > 0);
                if (canReact) {
                    log(draft, `A Ajah Vermelha pode reagir à Loucura.`);
                    draft.gamePhase = GamePhase.MadnessReaction;
                } else {
                    draft.gamePhase = GamePhase.MadnessDamage;
                }
                break;
            
            case GamePhase.MadnessDamage:
                if (!draft.activeMadnessCard) break; // Should not happen

                let madnessCardValue = draft.activeMadnessCard.value;
                if (draft.activeRoundEffects.includes('EFEITO_FURIA')) {
                    madnessCardValue += 2;
                    log(draft, `Efeito 'Fúria Cega' aumenta o valor da Loucura para ${madnessCardValue}.`);
                }

                const shieldBonus = Math.floor((draft.saidarTracks.escudo - 1) / 2);
                const baseDamage = Math.max(0, madnessCardValue - shieldBonus);
                log(draft, `Trilha do Escudo (Nível ${draft.saidarTracks.escudo}) reduz o dano em ${shieldBonus}. Dano base: ${baseDamage}.`);

                // Ajah Verde: Guardião Vigilante (Ativa)
                const vigilante = draft.players.find(p => p.ajah === Ajah.Verde && p.abilities['GUARDAO_VIGILANTE']?.target !== undefined);
                if (vigilante) {
                    const vigilanteIndex = draft.players.findIndex(p => p.playerId === vigilante.playerId);
                    const partnerIndex = vigilante.abilities['GUARDAO_VIGILANTE'].target.partnerIndex;
                    const damageForVigilante = Math.ceil(baseDamage / 2);
                    const damageForPartner = Math.floor(baseDamage / 2);
                    log(draft, `Habilidade (Verde): ${vigilante.playerId} usa Guardião Vigilante, dividindo o dano com ${draft.players[partnerIndex].playerId}.`);
                    applyDamageToPlayer(draft, vigilanteIndex, damageForVigilante);
                    applyDamageToPlayer(draft, partnerIndex, damageForPartner);
                    // Damage remaining players
                     draft.players.forEach((p, index) => {
                        if (index !== vigilanteIndex && index !== partnerIndex) {
                           applyDamageToPlayer(draft, index, baseDamage);
                        }
                    });

                } else {
                    // Standard / Sophisticated Damage Logic
                    const damageLogic = draft.activeMentalState?.idLogicaDano || 'DANO_PADRAO';
                    switch(damageLogic) {
                        case 'DANO_MAIOR_PONTUACAO': {
                            let targetIndex = 0;
                            let maxScore = -1;
                            draft.players.forEach((p, index) => {
                                if(p.currentScore > maxScore) {
                                    maxScore = p.currentScore;
                                    targetIndex = index;
                                }
                            });
                            log(draft, `Loucura ('Paranóia Seletiva') ataca ${draft.players[targetIndex].playerId} por ter a maior pontuação.`);
                            applyDamageToPlayer(draft, targetIndex, baseDamage);
                            break;
                        }
                        case 'DANO_MENOR_VIDA': {
                            let targetIndex = 0;
                            let minLife = 1000;
                            draft.players.forEach((p, index) => {
                                if(p.life < minLife) {
                                    minLife = p.life;
                                    targetIndex = index;
                                }
                            });
                            log(draft, `Loucura ('Desespero Sufocante') ataca ${draft.players[targetIndex].playerId} por ter a menor vida.`);
                            applyDamageToPlayer(draft, targetIndex, baseDamage);
                            break;
                        }
                        case 'DANO_PRIMEIRO_JOGADOR':
                            log(draft, `Loucura ataca o primeiro jogador: ${draft.players[0].playerId}.`);
                            applyDamageToPlayer(draft, 0, baseDamage + 1);
                            break;
                        case 'DANO_TODOS_MAIS_1':
                            log(draft, `Loucura ataca todos os jogadores com dano aumentado.`);
                            draft.players.forEach((p, index) => {
                                applyDamageToPlayer(draft, index, baseDamage + 1);
                            });
                            break;
                        case 'DANO_NENHUM':
                            log(draft, `Nenhum dano da Loucura nesta rodada.`);
                            break;
                        default: // DANO_PADRAO
                            log(draft, `Loucura ataca todos os jogadores.`);
                            draft.players.forEach((p, index) => {
                            applyDamageToPlayer(draft, index, baseDamage);
                            });
                            break;
                    }
                }


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
                    .reduce((sum, p) => {
                        const playerIndexInDraft = draft.players.findIndex(pl => pl.playerId === p.playerId);
                        if (playerIndexInDraft === -1) return sum;
                        const playerInDraft = draft.players[playerIndexInDraft];

                        let damageFromPlayer = playerInDraft.currentScore;
                        
                        // Ajah Verde: Táticas de Batalha (Passiva)
                        if (playerInDraft.ajah === Ajah.Verde && playerInDraft.revealedCards.length >= 2) {
                            const partnerIndex = playerInDraft.abilities['TATICAS_BATALHA']?.target?.partnerIndex;
                            if (partnerIndex !== undefined && draft.players[partnerIndex].revealedCards.length >= 2) {
                                damageFromPlayer += 2;
                                log(draft, `Habilidade (Verde): Táticas de Batalha de ${playerInDraft.playerId} adiciona 2 de dano.`);
                            }
                        }

                        // Ajah Vermelha: Escudo de Retaliação
                        if (playerInDraft.ajah === Ajah.Vermelha && damageFromPlayer > 0) {
                            const shieldGained = Math.floor(damageFromPlayer / 2);
                            playerInDraft.shield += shieldGained;
                            log(draft, `Habilidade (Vermelha): ${playerInDraft.playerId} ganhou ${shieldGained} de escudo por causar dano.`);
                        }
                        return sum + damageFromPlayer;
                    }, 0);
                
                log(draft, `Fase 4: Calculando dano à sanidade...`);
                log(draft, `Dano base (jogadoras não em stand): ${totalDamage}.`);
                log(draft, `Bônus da Trilha da Chama (Nível ${draft.saidarTracks.chama}): +${flameBonus} de dano.`);
                totalDamage += flameBonus;

                draft.randSanity -= totalDamage;
                log(draft, `Rand sofreu ${totalDamage} de dano à sanidade. Restante: ${draft.randSanity}.`);
                
                checkAndApplyEnhancement(draft);

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
                 draft.saidarPointsToSpend = 2;

                 draft.players.forEach(p => {
                    if (p.saidarBonus > 0) {
                        draft.saidarPointsToSpend += p.saidarBonus;
                        log(draft, `Bônus de Saidar de ${p.playerId}: +${p.saidarBonus}`);
                        p.saidarBonus = 0;
                    }
                 })

                 if (draft.effects.diplomaticSolutionUsed) {
                     draft.saidarPointsToSpend += 4;
                     log(draft, `Habilidade (Cinzenta): Solução Diplomática concede 4 pontos extras de Saidar.`);
                     draft.effects.diplomaticSolutionUsed = false;
                 } else {
                    draft.saidarTracks.teia++;
                    log(draft, `Teia da Influência avança para o nível ${draft.saidarTracks.teia}.`);
                 }
                 break;

            case GamePhase.Cleanup:
                log(draft, `Fase 6: Preparação para a próxima rodada.`);
                const extraCards = draft.permanentEnhancements.includes('APRIM_COMPRA_EXTRA') ? 1 : 0;
                if (extraCards > 0) log(draft, `Aprimoramento 'Compra Extra' concede 1 carta a mais.`);

                draft.players.forEach(p => {
                    // Ajah Marrom: Arquivo Mental
                    const archiveMentalAbility = p.abilities['ARQUIVO_MENTAL'];
                    if (p.ajah === Ajah.Marrom && archiveMentalAbility?.target) {
                        const cardToReturnIndex = p.revealedCards.findIndex(c => c.value === archiveMentalAbility.target?.cardValue);
                        if (cardToReturnIndex > -1) {
                            const [cardToReturn] = p.revealedCards.splice(cardToReturnIndex, 1);
                            p.drawDeck.unshift(cardToReturn);
                             log(draft, `Habilidade (Marrom): ${p.playerId} usou Arquivo Mental para retornar uma carta de valor ${cardToReturn.value} ao topo do baralho.`);
                        }
                        delete archiveMentalAbility.target;
                    }

                    p.discardPile.push(...p.revealedCards);
                    p.revealedCards = [];
                    while(p.hand.length < (4 + extraCards)) {
                        if (p.drawDeck.length === 0) {
                            if (p.discardPile.length === 0) break;
                            log(draft, `${p.playerId} reembaralhou o descarte.`);
                            p.drawDeck = shuffle(p.discardPile);
                            p.discardPile = [];
                        }
                        const drawnCard = p.drawDeck.pop();
                        if(drawnCard) p.hand.push(drawnCard);
                    }
                    p.isStanding = false;
                    p.currentScore = 0;
                    // Shield does not reset automatically
                    // Reset 1/round abilities
                    Object.values(p.abilities).forEach(a => a.usedThisRound = false);
                });
                if(draft.activeMadnessCard) {
                    draft.madnessDiscard.push(draft.activeMadnessCard);
                    draft.activeMadnessCard = null;
                }
                
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

const INITIAL_ABILITIES: Record<Ajah, PlayerState['abilities']> = {
    [Ajah.Azul]: { 'INTRIGA_SUTIL': { usesLeft: Infinity, usedThisRound: false } },
    [Ajah.Amarela]: { 'TOQUE_CURATIVO': { usesLeft: Infinity, usedThisRound: false } },
    [Ajah.Vermelha]: { 'REPRESSAO_TOTAL': { usesLeft: 1, usedThisRound: false } },
    [Ajah.Verde]: { 'TATICAS_BATALHA': { usesLeft: Infinity, usedThisRound: false }, 'GUARDAO_VIGILANTE': { usesLeft: Infinity, usedThisRound: false } },
    [Ajah.Cinzenta]: { 'INFLUENCIA_FUTURA': { usesLeft: 1, usedThisRound: false }, 'SOLUCAO_DIPLOMATICA': { usesLeft: 1, usedThisRound: false } },
    [Ajah.Negra]: { 'PALAVRA_CORROMPIDA': { usesLeft: Infinity, usedThisRound: false }, 'OFERENDA_TENEBROSA': { usesLeft: 1, usedThisRound: false } },
    [Ajah.Marrom]: { 'ESTUDO_CONCENTRADO': { usesLeft: Infinity, usedThisRound: false }, 'ARQUIVO_MENTAL': { usesLeft: Infinity, usedThisRound: false } },
    [Ajah.Branca]: { 'BARREIRA_MENTAL': { usesLeft: Infinity, usedThisRound: false } },
};

export const gameReducer = (state: GlobalGameState, action: GameAction): GlobalGameState => {
    switch (action.type) {
        case 'START_GAME':
            return produce(state, draft => {
                const playerCount = action.playerAjans.length;
                draft.randSanity = 50 + (playerCount - 1) * 20;
                draft.players = action.playerAjans.map((ajah, index) => {
                    const drawDeck = shuffle(AJAH_DECKS[ajah]);
                    const hand = drawDeck.splice(0, 4);
                    return {
                        playerId: `JOGADOR ${index + 1}`,
                        ajah,
                        life: 40,
                        hand,
                        drawDeck,
                        discardPile: [],
                        revealedCards: [],
                        currentScore: 0,
                        isStanding: false,
                        shield: 0,
                        saidarBonus: 0,
                        abilities: INITIAL_ABILITIES[ajah] || {}
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
                const sortedIndices = [...action.cardIndices].sort((a,b) => b-a);
                sortedIndices.forEach(index => {
                    cardsToReveal.push(player.hand.splice(index, 1)[0]);
                });
                
                player.revealedCards.push(...cardsToReveal);
                
                if (!draft.activeRoundEffects.includes('EFEITO_DESCONFIANCA')) {
                  player.currentScore = calculateScore(player.revealedCards, draft.permanentEnhancements);
                }

                log(draft, `${player.playerId} revelou ${cardsToReveal.length} carta(s). Pontuação atual: ${player.currentScore}.`);

                if (player.ajah === Ajah.Marrom) {
                    const cardValue = prompt(`Arquivo Mental: Qual o valor da carta para retornar ao topo do baralho no final da rodada? (Deixe em branco para não usar)`);
                    const val = parseInt(cardValue || '', 10);
                    if (!isNaN(val) && player.revealedCards.some(c => c.value === val)) {
                        player.abilities['ARQUIVO_MENTAL'].target = { cardValue: val };
                        log(draft, `Habilidade (Marrom): ${player.playerId} usará Arquivo Mental em uma carta de valor ${val}.`);
                    }
                }
                if (player.ajah === Ajah.Verde && player.revealedCards.length >= 2) {
                     const target = prompt(`Táticas de Batalha: Escolha outro jogador para se aliar (1-${draft.players.length}). Deixe em branco para não usar.`);
                     const targetIndex = parseInt(target || '', 10) - 1;
                     if (!isNaN(targetIndex) && targetIndex >= 0 && targetIndex < draft.players.length && targetIndex !== action.playerIndex) {
                         player.abilities['TATICAS_BATALHA'].target = { partnerIndex: targetIndex };
                         log(draft, `Habilidade (Verde): ${player.playerId} formou uma aliança com ${draft.players[targetIndex].playerId}.`);
                     }
                }
            });
        }

        case 'STAND': {
            return produce(state, draft => {
                const player = draft.players[action.playerIndex];

                // Barreira Mental (Branca) protection
                const brancaIsProtecting = draft.players.some(p => p.ajah === Ajah.Branca && p.abilities['BARREIRA_MENTAL']?.target === action.playerIndex);
                
                if (draft.activeRoundEffects.includes('EFEITO_HESITACAO')) {
                    const isFirstToStand = draft.players.every(p => !p.isStanding);
                    if (isFirstToStand) {
                        if (brancaIsProtecting) {
                            log(draft, `Habilidade (Branca): Barreira Mental protegeu ${player.playerId} de 'Hesitação'!`);
                        } else if (player.hand.length > 0) {
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
                    player.currentScore = calculateScore(player.revealedCards, draft.permanentEnhancements);
                }

                player.isStanding = true;
                log(draft, `${player.playerId} revelou ${cardsToReveal.length} carta(s) e está em 'Stand'. Pontuação final: ${player.currentScore}.`);
                
                 // Palavra Corrompida (Negra) check
                 const corruptingPlayer = draft.players.find(p => p.ajah === Ajah.Negra && p.abilities['PALAVRA_CORROMPIDA']?.target === action.playerIndex);
                 if (corruptingPlayer && player.revealedCards.length === 3) {
                     log(draft, `Habilidade (Negra): ${player.playerId} revelou 3 cartas sob efeito da Palavra Corrompida!`);
                     applyDamageToPlayer(draft, action.playerIndex, 7, 'Palavra Corrompida');
                     player.saidarBonus += 1;
                 }
            });
        }

        case 'END_AJAH_TURN': {
            return produce(state, draft => {
                 const allStandOrDone = draft.players.every(p => p.isStanding || p.revealedCards.length >= 2);

                if (allStandOrDone) {
                    log(draft, "Todas as Ajahs jogaram. A Fase 2 terminou.");

                    if (draft.activeRoundEffects.includes('EFEITO_DESCONFIANCA')) {
                        log(draft, `Efeito 'Desconfiança' ativo: calculando todas as pontuações agora.`);
                        draft.players.forEach(p => {
                            p.currentScore = calculateScore(p.revealedCards, draft.permanentEnhancements);
                            log(draft, `Pontuação final de ${p.playerId}: ${p.currentScore}.`);
                        });
                    }
                    if (draft.activeRoundEffects.includes('EFEITO_CALMA')) {
                        const bustLimit = draft.permanentEnhancements.includes('APRIM_LIMITE_ESTOURO_10') ? 10 : 9;
                        const noPlayerBusted = draft.players.every(p => {
                            const sum = p.revealedCards.reduce((acc, card) => acc + card.value, 0);
                            return sum <= bustLimit;
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
                    } while ((draft.players[nextPlayerIndex].isStanding || draft.players[nextPlayerIndex].revealedCards.length >= 2) && attempts <= playerCount);

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

                if (totalPointsToSpend > draft.saidarPointsToSpend || totalPointsToSpend < 0) {
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
        
        case 'DECLINE_REACTION': {
            return produce(state, draft => {
                 log(draft, `Reação recusada.`);
                 draft.gamePhase = GamePhase.MadnessDamage;
                 processAutomaticPhases(draft);
            });
        }

        case 'USE_ABILITY': {
            return produce(state, draft => {
                const { playerIndex, abilityId, options } = action.payload;
                const player = draft.players[playerIndex];
                const ability = player.abilities[abilityId];
                if(!ability) return;

                switch(abilityId) {
                    case 'TOQUE_CURATIVO': {
                        const targetPlayer = draft.players[options.targetIndex];
                        targetPlayer.life = Math.min(40, targetPlayer.life + 3);
                        ability.usedThisRound = true;
                        log(draft, `Habilidade (Amarela): ${player.playerId} curou 3 de vida de ${targetPlayer.playerId}.`);
                        break;
                    }
                    case 'REPRESSAO_TOTAL': {
                        if (draft.activeMadnessCard) {
                             log(draft, `Habilidade (Vermelha): ${player.playerId} usou Repressão Total para anular a carta da Loucura!`);
                             draft.activeMadnessCard.value = 0; // Effectively nullifies it
                             ability.usesLeft -= 1;
                             draft.gamePhase = GamePhase.MadnessDamage;
                             processAutomaticPhases(draft);
                        } else {
                             log(draft, `Habilidade (Vermelha): Repressão Total só pode ser usada durante a reação à Loucura.`);
                        }
                        break;
                    }
                     case 'GUARDAO_VIGILANTE': {
                        ability.target = { partnerIndex: options.targetIndex };
                        ability.usedThisRound = true;
                        log(draft, `Habilidade (Verde): ${player.playerId} protegerá ${draft.players[options.targetIndex].playerId} da próxima Loucura.`);
                        break;
                    }
                    case 'INFLUENCIA_FUTURA': {
                        const enhancementToRemove = draft.permanentEnhancements[options.enhancementIndex];
                        draft.permanentEnhancements.splice(options.enhancementIndex, 1);
                        ability.usesLeft -= 1;
                        log(draft, `Habilidade (Cinzenta): ${player.playerId} removeu o aprimoramento '${enhancementToRemove}'.`);
                        break;
                    }
                     case 'PALAVRA_CORROMPIDA': {
                        ability.target = options.targetIndex;
                        ability.usedThisRound = true;
                        log(draft, `Habilidade (Negra): ${player.playerId} usou Palavra Corrompida em ${draft.players[options.targetIndex].playerId}.`);
                        break;
                    }
                    case 'OFERENDA_TENEBROSA': {
                        player.life -= 10;
                        draft.effects.mentalStateEffectNullified = true;
                        ability.usesLeft -= 1;
                        log(draft, `Habilidade (Negra): ${player.playerId} sacrificou 10 de vida para anular o Estado Mental!`);
                        if (player.life <= 0) {
                             log(draft, `${player.playerId} caiu pelo seu próprio poder! A loucura venceu.`);
                             draft.gamePhase = GamePhase.GameOver;
                             draft.winner = 'madness';
                        }
                        break;
                    }
                    case 'INTRIGA_SUTIL': {
                         draft.effects.mentalStateEffectNullified = true;
                         ability.usedThisRound = true;
                         log(draft, `Habilidade (Azul): ${player.playerId} usou Intriga Sutil. O efeito do próximo Estado Mental será anulado.`);
                         break;
                    }
                    case 'SOLUCAO_DIPLOMATICA': {
                        draft.effects.diplomaticSolutionUsed = true;
                        ability.usesLeft -= 1;
                        log(draft, `Habilidade (Cinzenta): ${player.playerId} usou Solução Diplomática. O grupo ganhará 4 Saidar extras na próxima fase de Trilhas.`);
                        break;
                    }
                     case 'BARREIRA_MENTAL': {
                        ability.target = options.targetIndex;
                        ability.usedThisRound = true;
                        log(draft, `Habilidade (Branca): ${player.playerId} criou uma Barreira Mental para ${draft.players[options.targetIndex].playerId}.`);
                        break;
                    }
                    case 'ESTUDO_CONCENTRADO': {
                        const { cardIndices } = options;
                        const sortedIndices = [...cardIndices].sort((a: number, b: number) => b - a);
                        const discarded: Card[] = [];
                        sortedIndices.forEach((index: number) => {
                           discarded.push(player.hand.splice(index, 1)[0]);
                        });
                        player.discardPile.push(...discarded);
                        // draw new ones
                        for (let i = 0; i < discarded.length; i++) {
                             if (player.drawDeck.length === 0) {
                                if (player.discardPile.length === 0) break;
                                player.drawDeck = shuffle(player.discardPile);
                                player.discardPile = [];
                            }
                            const drawnCard = player.drawDeck.pop();
                            if(drawnCard) player.hand.push(drawnCard);
                        }
                        ability.usedThisRound = true;
                        log(draft, `Habilidade (Marrom): ${player.playerId} descartou ${discarded.length} e comprou ${discarded.length} cartas.`);
                        break;
                    }
                }
            });
        }

        case 'ADVANCE_PHASE': {
            return state;
        }

        default:
            return state;
    }
};
