import React from 'react';
import { Card } from '../types';
import { AJAH_COLORS } from '../constants/decks';

interface CardProps {
  card: Card;
  onClick?: () => void;
  isSelected?: boolean;
  isFaceDown?: boolean;
}

const CardComponent: React.FC<CardProps> = ({ card, onClick, isSelected, isFaceDown }) => {
  const ajahColor = AJAH_COLORS[card.ajah];
  const selectedClass = isSelected ? 'ring-4 ring-offset-2 ring-offset-gray-800 ring-cyan-400' : 'ring-1 ring-gray-500';

  if (isFaceDown) {
    return (
      <div className="w-24 h-36 rounded-lg bg-gray-700 border-2 border-gray-500 flex items-center justify-center p-2 shadow-lg">
        <span className="text-gray-400 text-sm font-bold uppercase tracking-widest" style={{ writingMode: 'vertical-rl' }}>
          Revelada
        </span>
      </div>
    );
  }

  return (
    <div
      className={`w-24 h-36 rounded-lg flex flex-col justify-center items-center p-2 shadow-lg cursor-pointer transform hover:scale-105 transition-transform duration-200 ${ajahColor} ${selectedClass}`}
      onClick={onClick}
    >
      <div className="text-4xl font-bold">{card.value}</div>
      <div className="text-xs mt-2 uppercase">{card.ajah}</div>
    </div>
  );
};

export default CardComponent;
