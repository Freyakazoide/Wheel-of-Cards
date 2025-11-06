
import React, { useState } from 'react';
import { PlayerState, GamePhase, Ajah, GlobalGameState } from '../types';
import CardComponent from './CardComponent';
import { AJAH_COLORS } from '../constants/decks';
import { AJAH_ABILITIES } from '../constants/abilities';

interface PlayerAreaProps {
  player: PlayerState;
  isCurrentPlayer: boolean;
  gamePhase: GamePhase;
  onRevealCards: (cardIndices: number[]) => void;
  onStand: (cardIndices: number[]) => void;
  onEndTurn: () => void;
  onDeclineReaction: () => void;
  onUseAbility: (abilityId: string, options?: any) => void;
  activeRoundEffects: string[];
  permanentEnhancements: string[];
  playerCount: number;
}

const PlayerArea: React.FC<PlayerAreaProps> = ({ player, isCurrentPlayer, gamePhase, onRevealCards, onStand, onEndTurn, onDeclineReaction, onUseAbility, activeRoundEffects, permanentEnhancements, playerCount }) => {
  const [selectedCardIndices, setSelectedCardIndices] = useState<number[]>([]);

  const isTurn = isCurrentPlayer && gamePhase === GamePhase.AjahTurns && !player.isStanding && player.revealedCards.length < 2;
  const isDesconfiancaActive = activeRoundEffects.includes('EFEITO_DESCONFIANCA');
  
  const handleCardClick = (index: number) => {
    if (!isTurn && !(isCurrentPlayer && canStand) && player.ajah !== Ajah.Marrom) return;
    setSelectedCardIndices(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const handleReveal = () => {
    if (selectedCardIndices.length !== 2) {
      alert("Você DEVE revelar 2 cartas.");
      return;
    }
    onRevealCards(selectedCardIndices);
    setSelectedCardIndices([]);
  };
  
  const handleStand = () => {
    if (selectedCardIndices.length !== 1) {
        alert("Você DEVE revelar 1 carta adicional para ficar em 'Stand'.");
        return;
    }
    onStand(selectedCardIndices);
    setSelectedCardIndices([]);
  }

  const canStand = player.revealedCards.length === 2 && !player.isStanding;
  
  const renderAbilityButton = (abilityId: string) => {
      const abilityState = player.abilities[abilityId];
      if (!abilityState) return null;

      const playerIndex = parseInt(player.playerId.split(' ')[1], 10) - 1;

      switch(abilityId) {
          case 'TOQUE_CURATIVO': 
            return gamePhase === GamePhase.AjahTurns && !abilityState.usedThisRound && (
                <button onClick={() => {
                    const target = prompt(`Curar qual jogador? (1-${playerCount})`);
                    const targetIndex = parseInt(target || '', 10) - 1;
                    if (!isNaN(targetIndex) && targetIndex >= 0 && targetIndex < playerCount) {
                         onUseAbility('TOQUE_CURATIVO', { targetIndex });
                    } else {
                        alert("Jogador inválido.");
                    }
                }} className="px-3 py-1 bg-yellow-600 rounded hover:bg-yellow-500 text-sm mt-1 w-full">Usar Toque Curativo</button>
            );
          case 'REPRESSAO_TOTAL':
            return gamePhase === GamePhase.MadnessReaction && abilityState.usesLeft > 0 && player.ajah === Ajah.Vermelha && (
                <div className="flex space-x-2">
                  <button onClick={() => onUseAbility('REPRESSAO_TOTAL')} className="flex-1 px-3 py-1 bg-red-800 rounded hover:bg-red-700 text-sm mt-1">Usar Repressão Total</button>
                  <button onClick={onDeclineReaction} className="flex-1 px-3 py-1 bg-gray-600 rounded hover:bg-gray-500 text-sm mt-1">Não Usar</button>
                </div>
            );
          case 'GUARDAO_VIGILANTE':
            return isTurn && !abilityState.usedThisRound && (
                <button onClick={() => {
                     const target = prompt(`Dividir o dano com qual jogador? (1-${playerCount})`);
                     const targetIndex = parseInt(target || '', 10) - 1;
                     if (!isNaN(targetIndex) && targetIndex >= 0 && targetIndex < playerCount && targetIndex !== playerIndex) {
                          onUseAbility('GUARDAO_VIGILANTE', { targetIndex });
                     } else {
                         alert("Alvo inválido.");
                     }
                }} className="px-3 py-1 bg-green-700 rounded hover:bg-green-600 text-sm mt-1 w-full">Usar Guardião Vigilante</button>
            );
          case 'INFLUENCIA_FUTURA':
            return isTurn && abilityState.usesLeft > 0 && permanentEnhancements.length > 0 && (
                <button onClick={() => {
                    const promptText = `Qual aprimoramento remover?\n` + permanentEnhancements.map((p, i) => `${i + 1}: ${p}`).join('\n');
                    const choice = prompt(promptText);
                    const enhancementIndex = parseInt(choice || '', 10) - 1;
                    if (!isNaN(enhancementIndex) && enhancementIndex >= 0 && enhancementIndex < permanentEnhancements.length) {
                         onUseAbility('INFLUENCIA_FUTURA', { enhancementIndex });
                    } else {
                        alert("Escolha inválida.");
                    }
                }} className="px-3 py-1 bg-gray-600 rounded hover:bg-gray-500 text-sm mt-1 w-full">Usar Influência Futura</button>
            );
          case 'PALAVRA_CORROMPIDA':
            return isTurn && !abilityState.usedThisRound && (
                 <button onClick={() => {
                     const target = prompt(`Usar Palavra Corrompida em qual jogador? (1-${playerCount})`);
                     const targetIndex = parseInt(target || '', 10) - 1;
                     if (!isNaN(targetIndex) && targetIndex >= 0 && targetIndex < playerCount && targetIndex !== playerIndex) {
                          onUseAbility('PALAVRA_CORROMPIDA', { targetIndex });
                     } else {
                         alert("Alvo inválido.");
                     }
                }} className="px-3 py-1 bg-purple-800 rounded hover:bg-purple-700 text-sm mt-1 w-full">Usar Palavra Corrompida</button>
            )
          case 'OFERENDA_TENEBROSA':
             return abilityState.usesLeft > 0 && gamePhase === GamePhase.MentalState && (
                <button onClick={() => {
                    if(window.confirm("Tem certeza que quer perder 10 de vida para anular o Estado Mental?")) {
                        onUseAbility('OFERENDA_TENEBROSA');
                    }
                }} className="px-3 py-1 bg-purple-900 rounded hover:bg-purple-800 text-sm mt-1 w-full">Usar Oferenda Tenebrosa</button>
            );
          case 'INTRIGA_SUTIL':
            return !abilityState.usedThisRound && gamePhase === GamePhase.MentalState && (
                <button onClick={() => onUseAbility('INTRIGA_SUTIL')} className="px-3 py-1 bg-blue-700 rounded hover:bg-blue-600 text-sm mt-1 w-full">Usar Intriga Sutil</button>
            );
          case 'SOLUCAO_DIPLOMATICA':
             return abilityState.usesLeft > 0 && gamePhase === GamePhase.MentalState && (
                <button onClick={() => onUseAbility('SOLUCAO_DIPLOMATICA')} className="px-3 py-1 bg-gray-600 rounded hover:bg-gray-500 text-sm mt-1 w-full">Usar Solução Diplomática</button>
            );
          case 'BARREIRA_MENTAL':
            return !abilityState.usedThisRound && gamePhase === GamePhase.MentalState && (
                <button onClick={() => {
                     const target = prompt(`Proteger qual jogador do Efeito Mental? (1-${playerCount})`);
                     const targetIndex = parseInt(target || '', 10) - 1;
                     if (!isNaN(targetIndex) && targetIndex >= 0 && targetIndex < playerCount) {
                          onUseAbility('BARREIRA_MENTAL', { targetIndex });
                     } else {
                         alert("Alvo inválido.");
                     }
                }} className="px-3 py-1 bg-gray-300 text-black rounded hover:bg-white text-sm mt-1 w-full">Usar Barreira Mental</button>
            );
          case 'ESTUDO_CONCENTRADO':
            return !abilityState.usedThisRound && isTurn && (
                 <button 
                    onClick={() => {
                        onUseAbility('ESTUDO_CONCENTRADO', { cardIndices: selectedCardIndices });
                        setSelectedCardIndices([]);
                    }}
                    disabled={selectedCardIndices.length === 0 || selectedCardIndices.length > 2}
                    className="px-3 py-1 bg-yellow-900 rounded hover:bg-yellow-800 disabled:bg-gray-500 text-sm mt-1 w-full">
                    Descartar e Comprar ({selectedCardIndices.length})
                </button>
            );
          default:
            return null;
      }
  }


  return (
    <div className={`p-4 rounded-lg border-2 transition-all duration-300 ${isCurrentPlayer ? 'border-cyan-400 shadow-cyan-500/20 shadow-lg' : 'border-gray-700'} ${gamePhase === GamePhase.MadnessReaction && player.ajah === Ajah.Vermelha ? 'animate-pulse border-red-500' : ''}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
            <h3 className="text-2xl font-bold uppercase tracking-wider">{player.playerId}</h3>
            <h4 className={`text-lg font-semibold px-3 py-1 rounded inline-block mt-1 ${AJAH_COLORS[player.ajah]}`}>{`Ajah ${player.ajah}`}</h4>
        </div>
        <div className="text-lg text-right">
          <div>
            <span className="font-bold text-red-500">Vida:</span> {player.life}
            {player.shield > 0 && <span className="font-bold text-blue-400"> +{player.shield}</span>}
          </div>
          <div>
            <span className="font-bold text-yellow-400">Pontos:</span> {isDesconfiancaActive && player.revealedCards.length > 0 ? '?' : player.currentScore}
            {player.isStanding && <span className="ml-2 px-2 py-1 bg-gray-600 rounded text-sm">STAND</span>}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <h4 className="text-sm font-bold text-gray-400 mb-2">Cartas Reveladas:</h4>
        <div className="flex space-x-2 h-40 items-center bg-black/20 p-2 rounded min-h-[10rem]">
          {player.revealedCards.length > 0 ? player.revealedCards.map((card, index) => (
            <CardComponent key={index} card={card} isFaceDown={isDesconfiancaActive} />
          )) : <span className="text-gray-500 pl-2">Nenhuma carta revelada.</span>}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-bold text-gray-400 mb-2">Mão ({player.hand.length}):</h4>
        <div className="flex space-x-2 h-40 items-center min-h-[10rem]">
           {player.hand.map((card, index) => (
            <CardComponent
              key={index}
              card={card}
              onClick={() => handleCardClick(index)}
              isSelected={selectedCardIndices.includes(index)}
            />
          ))}
        </div>
      </div>
      
       <div className="mt-4 flex flex-wrap gap-2">
            {isTurn && (
                <>
                <button
                    onClick={handleReveal}
                    disabled={selectedCardIndices.length !== 2}
                    className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-500 disabled:bg-gray-500 disabled:cursor-not-allowed font-bold"
                >
                    Revelar 2 Cartas
                </button>
                 {AJAH_ABILITIES[player.ajah].map(ability => ability.id === 'ESTUDO_CONCENTRADO' && renderAbilityButton(ability.id))}
                </>
            )}
            {isCurrentPlayer && canStand && (
                <button
                    onClick={handleStand}
                    disabled={selectedCardIndices.length !== 1}
                    className="px-4 py-2 bg-yellow-600 rounded-lg hover:bg-yellow-500 disabled:bg-gray-500 disabled:cursor-not-allowed font-bold"
                >
                    Revelar 3ª Carta (Stand)
                </button>
            )}
            {isCurrentPlayer && (player.isStanding || player.revealedCards.length >= 2) && gamePhase === GamePhase.AjahTurns && (
                 <button onClick={onEndTurn} className="px-4 py-2 bg-green-600 rounded-lg hover:bg-green-500 font-bold">
                    Encerrar Turno
                </button>
            )}
       </div>

       <div className="mt-4 pt-4 border-t border-gray-600">
            <h4 className="text-lg font-bold text-gray-300 mb-2">Habilidades da Ajah {player.ajah}</h4>
            <div className="space-y-3">
                {AJAH_ABILITIES[player.ajah].map(ability => (
                    <div key={ability.id} className={`p-3 rounded ${ability.type === 'Passiva' ? 'bg-green-900/30' : 'bg-gray-800/50'}`}>
                        <h5 className="font-bold text-cyan-400">{ability.name}
                           {ability.type === 'Passiva' 
                                ? <span className="ml-2 text-xs font-semibold px-2 py-0.5 bg-green-500/30 text-green-300 rounded-full">Passiva</span>
                                : <span className="ml-2 text-xs font-semibold px-2 py-0.5 bg-blue-500/30 text-blue-300 rounded-full">Ativa</span>
                           }
                        </h5>
                        <p className="text-sm text-gray-300 mt-1">{ability.description}</p>
                        {ability.type === 'Ativa' && renderAbilityButton(ability.id)}
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};

export default PlayerArea;
