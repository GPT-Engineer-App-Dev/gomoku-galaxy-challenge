import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { BOARD_SIZE, WINNING_LENGTH, checkWinner } from '../gomokuLogic';

const DEFAULT_SIMULATION_TIME = 3000; // Default time for MCTS in milliseconds

const Index = () => {
  const workerRef = useRef();
  const [board, setBoard] = useState(Array(BOARD_SIZE).fill(Array(BOARD_SIZE).fill(null)));
  const [currentPlayer, setCurrentPlayer] = useState('X');
  const [winner, setWinner] = useState(null);
  const [gameMode, setGameMode] = useState('pvp'); // 'pvp' or 'ai'
  const [simulationTime, setSimulationTime] = useState(DEFAULT_SIMULATION_TIME);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [aiStats, setAiStats] = useState(null);

  useEffect(() => {
    workerRef.current = new Worker(new URL('../aiWorker.js', import.meta.url), { type: 'module' });
    workerRef.current.onmessage = (e) => {
      const { move, simulations, winRate, totalVisits } = e.data;
      if (!winner && currentPlayer === 'O') {
        handleMove(move.row, move.col);
      }
      setAiStats({ simulations, winRate, totalVisits });
      setIsAIThinking(false);
    };
    workerRef.current.onerror = (error) => {
      console.error('AI Worker error:', error);
      setIsAIThinking(false);
    };

    return () => {
      workerRef.current.terminate();
    };
  }, []);

  useEffect(() => {
    if (gameMode === 'ai' && currentPlayer === 'O' && !winner && !isAIThinking) {
      setIsAIThinking(true);
      workerRef.current.postMessage({ board, simulationTime });

      // Set a timeout to handle cases where the AI doesn't respond
      const timeoutId = setTimeout(() => {
        console.error('AI timed out');
        setIsAIThinking(false);
        // Make a random move as a fallback
        const emptySpots = board.flatMap((row, i) => 
          row.map((cell, j) => cell === null ? [i, j] : null).filter(Boolean)
        );
        if (emptySpots.length > 0) {
          const [row, col] = emptySpots[Math.floor(Math.random() * emptySpots.length)];
          handleMove(row, col);
        }
      }, simulationTime + 1000); // Wait for simulationTime plus 1 second

      return () => clearTimeout(timeoutId);
    }
  }, [currentPlayer, gameMode, winner, board, simulationTime, isAIThinking, handleMove]);

  const handleMove = useCallback((row, col) => {
    if (board[row][col] || winner || isAIThinking || (gameMode === 'ai' && currentPlayer === 'O')) return;

    setBoard(prevBoard => {
      const newBoard = prevBoard.map(r => [...r]);
      newBoard[row][col] = currentPlayer;
      
      if (checkWinner(newBoard, row, col)) {
        setWinner(currentPlayer);
      } else {
        setCurrentPlayer(prev => prev === 'X' ? 'O' : 'X');
      }
      
      return newBoard;
    });
  }, [board, winner, isAIThinking, gameMode, currentPlayer]);

  // The checkWinner function is now imported from gomokuLogic.js

  const resetGame = () => {
    setBoard(Array(BOARD_SIZE).fill(Array(BOARD_SIZE).fill(null)));
    setCurrentPlayer('X');
    setWinner(null);
  };

  // Remove these functions as they are now defined outside the component

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold mb-6">Gomoku</h1>
      <div className="mb-4 space-x-4">
        <Button onClick={() => setGameMode('pvp')} variant={gameMode === 'pvp' ? 'default' : 'outline'}>
          Player vs Player
        </Button>
        <Button onClick={() => setGameMode('ai')} variant={gameMode === 'ai' ? 'default' : 'outline'}>
          Player vs AI
        </Button>
      </div>
      <div className="mb-4">
        {winner ? (
          <p className="text-xl font-semibold">Winner: {winner}</p>
        ) : isAIThinking ? (
          <div className="flex items-center">
            <p className="text-xl mr-2">AI is thinking...</p>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <p className="text-xl">Current player: {currentPlayer}</p>
        )}
      </div>
      {gameMode === 'ai' && (
        <div className="mb-4">
          <label htmlFor="ai-strength" className="block text-sm font-medium text-gray-700">
            AI Strength (thinking time: {simulationTime / 1000}s)
          </label>
          <input
            type="range"
            id="ai-strength"
            name="ai-strength"
            min="1000"
            max="10000"
            step="1000"
            value={simulationTime}
            onChange={(e) => setSimulationTime(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      )}
      <div className="bg-white p-4 rounded-lg shadow-lg">
        {board.map((row, rowIndex) => (
          <div key={rowIndex} className="flex">
            {row.map((cell, colIndex) => (
              <button
                key={`${rowIndex}-${colIndex}`}
                className="w-8 h-8 border border-gray-300 flex items-center justify-center text-xl font-bold"
                onClick={() => handleMove(rowIndex, colIndex)}
                disabled={!!cell || !!winner || isAIThinking || (gameMode === 'ai' && currentPlayer === 'O')}
              >
                {cell}
              </button>
            ))}
          </div>
        ))}
      </div>
      <Button onClick={resetGame} className="mt-6">
        Reset Game
      </Button>
      {gameMode === 'ai' && aiStats && (
        <div className="mt-4 p-4 bg-gray-100 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">AI Introspection</h3>
          <p>Simulations: {aiStats.simulations}</p>
          <p>Win Rate: {(aiStats.winRate * 100).toFixed(2)}%</p>
          <p>Total Visits: {aiStats.totalVisits}</p>
        </div>
      )}
    </div>
  );
};

export default Index;
