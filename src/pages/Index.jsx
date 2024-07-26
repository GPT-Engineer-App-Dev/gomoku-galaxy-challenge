import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { BOARD_SIZE, checkWinner } from '../gomokuLogic';

const DEFAULT_SIMULATION_TIME = 3000; // Default time for MCTS in milliseconds

const Index = () => {
  const workerRef = useRef();
  const [board, setBoard] = useState(Array(BOARD_SIZE).fill(Array(BOARD_SIZE).fill(null)));
  const [currentPlayer, setCurrentPlayer] = useState('X');
  const [winner, setWinner] = useState(null);
  const [gameMode, setGameMode] = useState('pvp'); // 'pvp' or 'ai'
  const [simulationTime, setSimulationTime] = useState(DEFAULT_SIMULATION_TIME);
  const [isAIThinking, setIsAIThinking] = useState(false);

  useEffect(() => {
    workerRef.current = new Worker(new URL('../aiWorker.js', import.meta.url));
    workerRef.current.onmessage = (e) => {
      const aiMove = e.data;
      handleMove(aiMove.row, aiMove.col);
      setIsAIThinking(false);
    };

    return () => {
      workerRef.current.terminate();
    };
  }, []);

  useEffect(() => {
    if (gameMode === 'ai' && currentPlayer === 'O' && !winner) {
      setIsAIThinking(true);
      workerRef.current.postMessage({ board, simulationTime });
    }
  }, [currentPlayer, gameMode, winner, board, simulationTime]);

  const handleMove = (row, col) => {
    if (board[row][col] || winner) return;

    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = currentPlayer;
    setBoard(newBoard);

    if (checkWinner(newBoard, row, col)) {
      setWinner(currentPlayer);
    } else {
      setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
    }
  };

  const checkWinner = (board, row, col) => {
    const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];
    return directions.some(([dx, dy]) => {
      return countConsecutive(board, row, col, dx, dy) + countConsecutive(board, row, col, -dx, -dy) - 1 >= WINNING_LENGTH;
    });
  };

  const countConsecutive = (board, row, col, dx, dy) => {
    const player = board[row][col];
    let count = 0;
    while (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE && board[row][col] === player) {
      count++;
      row += dx;
      col += dy;
    }
    return count;
  };

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
          <p className="text-xl">AI is thinking...</p>
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
                disabled={!!cell || !!winner || (gameMode === 'ai' && currentPlayer === 'O')}
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
    </div>
  );
};

export default Index;
