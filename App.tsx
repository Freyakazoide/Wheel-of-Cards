
import React, { useReducer, useState } from 'react';
import { Ajah, GamePhase, GlobalGameState } from './types';
import { gameReducer, getInitialState } from './services/gameEngine';
import PlayerArea from './components/PlayerArea';

const SetupScreen: React.FC<{ onStartGame: (ajahs: Ajah[]) => void }> = ({ onStartGame }) => {
    const [numPlayers, setNumPlayers] = useState(2);
    const [selectedAjahs, setSelectedAjahs] = useState<Ajah[]>(Object.values(Ajah).slice(0, 2));

    const handlePlayerCountChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const count = parseInt(e.target.value, 10);
        const newAjahs = Object.values(Ajah).slice(0, count);
        setNumPlayers(count);
        setSelectedAjahs(newAjahs);
    };

    const handleAjahChange = (index: number, ajah: Ajah) => {
        const newAjahs = [...selectedAjahs];
        newAjahs[index] = ajah;
        setSelectedAjahs(newAjahs);
    };

    const handleStart = () => {
        const ajahSet = new Set(selectedAjahs);
        if (ajahSet.size !== selectedAjahs.length) {
            alert("Duas Ajahs iguais não podem ser jogadas! Por favor, escolha Ajahs diferentes.");
            return;
        }
        onStartGame(selectedAjahs);
    };
    
    const isDuplicate = new Set(selectedAjahs).size !== selectedAjahs.length;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
            <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-md">
                <h1 className="text-4xl font-bold text-center mb-2 text-red-500">A Loucura de Rand Al'Thor</h1>
                <p className="text-center text-gray-400 mb-6">Setup do Jogo</p>
                
                <div className="mb-6">
                    <label htmlFor="player-count" className="block text-sm font-bold mb-2">Número de Jogadoras:</label>
                    <select id="player-count" value={numPlayers} onChange={handlePlayerCountChange} className="w-full bg-gray-700 p-2 rounded">
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                    </select>
                </div>

                {Array.from({ length: numPlayers }).map((_, index) => (
                    <div key={index} className="mb-4">
                        <label className="block text-sm font-bold mb-2">JOGADOR {index + 1}:</label>
                        <select value={selectedAjahs[index]} onChange={(e) => handleAjahChange(index, e.target.value as Ajah)} className="w-full bg-gray-700 p-2 rounded">
                            {Object.values(Ajah).map(ajah => (
                                <option key={ajah} value={ajah}>{ajah}</option>
                            ))}
                        </select>
                    </div>
                ))}
                
                {isDuplicate && <p className="text-red-500 text-center font-bold mb-4 animate-pulse">Ajahs não podem ser repetidas!</p>}

                <button onClick={handleStart} disabled={isDuplicate} className="w-full bg-red-700 hover:bg-red-600 text-white font-bold py-3 rounded-lg text-lg transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">
                    Iniciar Jogo
                </button>
            </div>
        </div>
    );
};

const SaidarPhaseManager: React.FC<{ gameState: GlobalGameState, dispatch: React.Dispatch<any> }> = ({ gameState, dispatch }) => {
    const [upgrades, setUpgrades] = useState({ chama: 0, escudo: 0, calice: 0 });
    const pointsToSpend = gameState.saidarPointsToSpend;
    const spentPoints = upgrades.chama + upgrades.escudo + upgrades.calice;
    const remainingPoints = pointsToSpend - spentPoints;
    const isChamaBlocked = gameState.activeRoundEffects.includes('EFEITO_BLOQUEIA_CHAMA_RODADA');

    const handleUpgrade = (track: 'chama' | 'escudo' | 'calice') => {
        if (remainingPoints > 0) {
            setUpgrades(prev => ({ ...prev, [track]: prev[track] + 1 }));
        }
    };
    
    const handleConfirm = () => {
        if (remainingPoints > 0) {
            alert(`Você ainda precisa gastar ${remainingPoints} ponto(s).`);
            return;
        }
        dispatch({ type: 'SPEND_SAIDAR_POINTS', upgrades });
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-800 p-8 rounded-lg shadow-xl border border-cyan-500 w-full max-w-2xl">
                <h2 className="text-2xl font-bold mb-2 text-cyan-300">Fase 5: Trilhas de Saidar</h2>
                <p className="mb-6 text-gray-300">Você deve gastar <span className="font-bold text-white">{pointsToSpend}</span> ponto(s) de Saidar. Restantes: <span className="font-bold text-xl text-yellow-400">{remainingPoints}</span></p>
                {isChamaBlocked && <p className="text-red-500 mb-4 animate-pulse font-bold text-center">A Trilha da Chama está bloqueada nesta rodada pelo 'Medo Paralisante'!</p>}
                
                <div className="flex justify-around mb-6 space-x-4">
                    <div className="text-center flex-1">
                        <h4 className="text-lg font-bold mb-2">Chama</h4>
                        <button onClick={() => handleUpgrade('chama')} disabled={isChamaBlocked || remainingPoints === 0} className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-500 disabled:bg-gray-500 disabled:cursor-not-allowed font-bold w-full">Avançar</button>
                        <p className="text-lg mt-2">{gameState.saidarTracks.chama} <span className="text-green-400 font-bold">(+{upgrades.chama})</span></p>
                    </div>
                     <div className="text-center flex-1">
                        <h4 className="text-lg font-bold mb-2">Escudo</h4>
                        <button onClick={() => handleUpgrade('escudo')} disabled={remainingPoints === 0} className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-500 disabled:bg-gray-500 disabled:cursor-not-allowed font-bold w-full">Avançar</button>
                        <p className="text-lg mt-2">{gameState.saidarTracks.escudo} <span className="text-green-400 font-bold">(+{upgrades.escudo})</span></p>
                    </div>
                     <div className="text-center flex-1">
                        <h4 className="text-lg font-bold mb-2">Cálice</h4>
                        <button onClick={() => handleUpgrade('calice')} disabled={remainingPoints === 0} className="px-4 py-2 bg-yellow-500 rounded-lg hover:bg-yellow-400 disabled:bg-gray-500 disabled:cursor-not-allowed font-bold w-full">Avançar</button>
                         <p className="text-lg mt-2">{gameState.saidarTracks.calice} <span className="text-green-400 font-bold">(+{upgrades.calice})</span></p>
                    </div>
                </div>
                
                <button onClick={handleConfirm} disabled={remainingPoints > 0} className="w-full mt-4 px-4 py-3 bg-green-700 rounded-lg hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed font-bold text-lg">Confirmar Avanços</button>
            </div>
        </div>
    );
};

const LogModal: React.FC<{ log: string[]; onClose: () => void }> = ({ log, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl border border-gray-600 w-full max-w-3xl max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Log do Jogo</h3>
          <button onClick={onClose} className="px-3 py-1 bg-red-600 rounded hover:bg-red-500 font-bold text-lg">&times;</button>
        </div>
        <div className="overflow-y-auto pr-2 flex flex-col-reverse">
          <ul className="space-y-1 text-sm text-gray-400">
            {log.map((entry, index) => (
              <li key={index} className="border-b border-gray-700/50 pb-1">{entry}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};


const GameBoard: React.FC<{ gameState: GlobalGameState, dispatch: React.Dispatch<any> }> = ({ gameState, dispatch }) => {
    const { players, currentPlayerIndex, gamePhase, randSanity, saidarTracks, activeMentalState, activeMadnessCard, log, activeRoundEffects, topMadnessCardPreview, permanentEnhancements } = gameState;
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);

    const handleRevealCards = (playerIndex: number) => (cardIndices: number[]) => {
        dispatch({ type: 'REVEAL_CARDS', playerIndex, cardIndices });
    };

    const handleStand = (playerIndex: number) => (cardIndices: number[]) => {
        dispatch({ type: 'STAND', playerIndex, cardIndices });
        dispatch({ type: 'END_AJAH_TURN' });
    };

    const handleEndTurn = () => {
        dispatch({ type: 'END_AJAH_TURN' });
    };

    const handleDeclineReaction = () => {
        dispatch({ type: 'DECLINE_REACTION' });
    }

    const handleUseAbility = (playerIndex: number) => (abilityId: string, options: any) => {
        dispatch({ type: 'USE_ABILITY', payload: { playerIndex, abilityId, options } });
    }

    const playerCount = players.length;
    const playerGridCols = playerCount === 4 ? 'xl:grid-cols-4' : (playerCount === 3 ? 'xl:grid-cols-3' : 'xl:grid-cols-2');

    return (
        <div className="p-4 lg:p-6 min-h-screen">
            {gamePhase === GamePhase.SaidarTracks && <SaidarPhaseManager gameState={gameState} dispatch={dispatch} />}
            {isLogModalOpen && <LogModal log={log} onClose={() => setIsLogModalOpen(false)} />}
            
            <header className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-lg flex flex-col md:flex-row justify-between items-center sticky top-4 z-10 border border-gray-700 mb-6">
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-red-500">A Loucura de Rand Al'Thor</h1>
                    <p className="text-cyan-300 font-semibold">{gamePhase}</p>
                </div>
                <div className="flex-1 flex justify-center items-center gap-8">
                    <div className="text-center">
                        <h2 className="text-lg">Sanidade de Rand</h2>
                        <p className="text-5xl font-bold text-red-400">{randSanity}</p>
                    </div>
                     <div className="text-center">
                        <h2 className="text-lg">Rodada</h2>
                        <p className="text-5xl font-bold">{gameState.currentRound}</p>
                    </div>
                </div>
                <div className="flex-1 flex items-center justify-end gap-x-4">
                     <div className="flex space-x-4 text-center">
                        <div><h3 className="text-sm">Chama</h3><p className="text-2xl font-bold">{saidarTracks.chama}</p></div>
                        <div><h3 className="text-sm">Escudo</h3><p className="text-2xl font-bold">{saidarTracks.escudo}</p></div>
                        <div><h3 className="text-sm">Cálice</h3><p className="text-2xl font-bold">{saidarTracks.calice}</p></div>
                        <div><h3 className="text-sm">Teia</h3><p className="text-2xl font-bold">{saidarTracks.teia}</p></div>
                    </div>
                     <button onClick={() => setIsLogModalOpen(true)} className="ml-4 px-4 py-2 bg-gray-600 rounded hover:bg-gray-500 text-sm font-bold">Ver Log</button>
                </div>
            </header>

            <main>
                <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                        <h3 className="text-xl font-bold mb-2 text-purple-400">Estado Mental Ativo</h3>
                        {activeMentalState ? (
                            <div>
                                <h4 className="font-bold text-lg">{activeMentalState.id} (Nível {activeMentalState.level})</h4>
                                <p className="text-gray-300 mt-1 text-sm">{activeMentalState.textoEfeito}</p>
                                {activeMentalState.textoAprimoramento && <p className="text-xs text-yellow-300 mt-2">Aprimoramento: {activeMentalState.textoAprimoramento}</p>}
                            </div>
                        ) : <p>Nenhum</p>}
                    </div>
                     <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex space-x-4 items-start justify-center">
                        <div>
                            <h3 className="text-xl font-bold mb-2 text-red-400">Loucura Ativa</h3>
                            {activeMadnessCard ? (
                                <div className="w-24 h-36 rounded-lg flex flex-col justify-center items-center p-2 shadow-lg bg-black ring-1 ring-red-500">
                                    <div className="text-4xl font-bold text-red-500">{activeMadnessCard.value}</div>
                                    <div className="text-xs mt-2 uppercase">LOUCURA</div>
                                </div>
                            ) : <p>Nenhuma</p>}
                        </div>
                        {topMadnessCardPreview && (
                            <div className="flex-1 max-w-[10rem]">
                                <h3 className="text-xl font-bold mb-2 text-blue-400">Próxima Loucura</h3>
                                <div className="w-24 h-36 rounded-lg flex flex-col justify-center items-center p-2 shadow-lg bg-gray-900 ring-1 ring-blue-500 opacity-70">
                                    <div className="text-4xl font-bold text-blue-400">{topMadnessCardPreview.value}</div>
                                    <div className="text-xs mt-2 uppercase">REVELADA</div>
                                </div>
                             </div>
                        )}
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                        <h3 className="text-xl font-bold mb-2 text-yellow-400">Aprimoramentos Permanentes</h3>
                        {permanentEnhancements.length > 0 ? (
                            <ul className="list-disc list-inside space-y-1 text-yellow-200 text-sm">
                                {permanentEnhancements.map((enh, i) => <li key={i}>{enh}</li>)}
                            </ul>
                        ) : <p className="text-gray-400">Nenhum</p>}
                    </div>
                </section>

                <section className={`grid grid-cols-1 md:grid-cols-2 ${playerGridCols} gap-6`}>
                    {players.map((player, index) => (
                        <PlayerArea
                            key={player.playerId}
                            player={player}
                            isCurrentPlayer={index === currentPlayerIndex}
                            gamePhase={gamePhase}
                            onRevealCards={handleRevealCards(index)}
                            onStand={handleStand(index)}
                            onEndTurn={handleEndTurn}
                            onDeclineReaction={handleDeclineReaction}
                            onUseAbility={handleUseAbility(index)}
                            activeRoundEffects={activeRoundEffects}
                            permanentEnhancements={permanentEnhancements}
                            playerCount={players.length}
                        />
                    ))}
                </section>
            </main>
        </div>
    );
};


const GameOverScreen: React.FC<{ winner: 'players' | 'madness', onRestart: () => void }> = ({ winner, onRestart }) => {
    const isVictory = winner === 'players';
    return (
        <div className="min-h-screen flex items-center justify-center text-center p-4">
            <div className="bg-gray-800 p-12 rounded-xl shadow-2xl">
                <h1 className={`text-6xl font-bold mb-4 ${isVictory ? 'text-cyan-400' : 'text-red-600'}`}>
                    {isVictory ? "Vitória!" : "Derrota"}
                </h1>
                <p className="text-xl mb-8">
                    {isVictory ? "As Ajahs conseguiram restaurar a sanidade de Rand. A Luz prevaleceu!" : "A loucura consumiu o Dragão Renascido. As Sombras caem sobre o mundo."}
                </p>
                <button onClick={onRestart} className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-lg">
                    Jogar Novamente
                </button>
            </div>
        </div>
    );
}


function App() {
    const [gameState, dispatch] = useReducer(gameReducer, getInitialState());

    const handleStartGame = (ajahs: Ajah[]) => {
        dispatch({ type: 'START_GAME', playerAjans: ajahs });
    };

    const handleRestart = () => {
        // This would typically involve a dispatch to reset state, but for simplicity, we'll reload.
        window.location.reload();
    }

    if(gameState.winner) {
        return <GameOverScreen winner={gameState.winner} onRestart={handleRestart}/>
    }

    if (gameState.gamePhase === GamePhase.Setup) {
        return <SetupScreen onStartGame={handleStartGame} />;
    }

    return <GameBoard gameState={gameState} dispatch={dispatch} />;
}

export default App;
