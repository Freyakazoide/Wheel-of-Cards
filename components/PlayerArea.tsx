import React, { useState } from 'react';
import { PlayerState, GamePhase } from '../types';
import CardComponent from './CardComponent';
import { AJAH_COLORS } from '../constants/decks';

interface PlayerAreaProps {
  player: PlayerState;
  isCurrentPlayer: boolean;
  gamePhase: GamePhase;
  onRevealCards: (cardIndices: number[]) => void;
  onStand: (cardIndices: number[]) => void;
  onEndTurn: () => void;
  activeRoundEffects: string[];
}

const PlayerArea: React.FC<PlayerAreaProps> = ({ player, isCurrentPlayer, gamePhase, onRevealCards, onStand, onEndTurn, activeRoundEffects }) => {
  const [selectedCardIndices, setSelectedCardIndices] = useState<number[]>([]);

  const isTurn = isCurrentPlayer && gamePhase === GamePhase.AjahTurns && player.revealedCards.length < 2;
  const isDesconfiancaActive = activeRoundEffects.includes('EFEITO_DESCONFIANCA');

  const handleCardClick = (index: number) => {
    if (!isTurn && !(isCurrentPlayer && canStand)) return;
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

  return (
    <div className={`p-4 rounded-lg border-2 transition-all duration-300 ${isCurrentPlayer ? 'border-cyan-400 shadow-cyan-500/20 shadow-lg' : 'border-gray-700'}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-xl font-bold px-3 py-1 rounded ${AJAH_COLORS[player.ajah]}`}>{player.playerId} ({player.ajah})</h3>
        <div className="text-lg">
          <span className="font-bold text-red-500">Vida:</span> {player.life} | <span className="font-bold text-yellow-400">Pontos:</span> {isDesconfiancaActive && player.revealedCards.length > 0 ? '?' : player.currentScore}
          {player.isStanding && <span className="ml-2 px-2 py-1 bg-gray-600 rounded text-sm">STAND</span>}
        </div>
      </div>

      <div className="mb-4">
        <h4 className="text-sm font-bold text-gray-400 mb-2">Cartas Reveladas:</h4>
        <div className="flex space-x-2 h-40 items-center bg-black/20 p-2 rounded">
          {player.revealedCards.length > 0 ? player.revealedCards.map((card, index) => (
            <CardComponent key={index} card={card} isFaceDown={isDesconfiancaActive} />
          )) : <span className="text-gray-500">Nenhuma carta revelada.</span>}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-bold text-gray-400 mb-2">Mão:</h4>
        <div className="flex space-x-2 h-40 items-center">
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

      {isTurn && (
        <div className="mt-4 flex space-x-2">
          <button
            onClick={handleReveal}
            disabled={selectedCardIndices.length !== 2}
            className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-500 disabled:bg-gray-500 disabled:cursor-not-allowed font-bold"
          >
            Revelar 2 Cartas
          </button>
        </div>
      )}
      {isCurrentPlayer && canStand && (
         <div className="mt-4 flex space-x-2">
           <button
            onClick={handleStand}
            disabled={selectedCardIndices.length !== 1}
            className="px-4 py-2 bg-yellow-600 rounded-lg hover:bg-yellow-500 disabled:bg-gray-500 disabled:cursor-not-allowed font-bold"
          >
            Revelar 3ª Carta (Stand)
          </button>
         </div>
      )}
       {isCurrentPlayer && player.revealedCards.length >= 2 && !isTurn && (
         <div className="mt-4">
           <button onClick={onEndTurn} className="px-4 py-2 bg-green-600 rounded-lg hover:bg-green-500 font-bold">
             Encerrar Turno
           </button>
         </div>
       )}

    </div>
  );
};

export default PlayerArea;
