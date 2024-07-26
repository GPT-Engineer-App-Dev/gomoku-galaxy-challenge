import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";

const BOARD_SIZE = 15;
const WINNING_LENGTH = 5;
const SIMULATION_TIME = 1000; // Time for MCTS in milliseconds

const getValidMoves = (board) => {
  const moves = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (!board[row][col]) {
        if (hasNeighbor(board, row, col)) {
          moves.push({ row, col });
        }
      }
    }
  }
  return moves;
};

const hasNeighbor = (board, row, col) => {
  for (let i = Math.max(0, row - 1); i <= Math.min(BOARD_SIZE - 1, row + 1); i++) {
    for (let j = Math.max(0, col - 1); j <= Math.min(BOARD_SIZE - 1, col + 1); j++) {
      if (board[i][j]) return true;
    }
  }
  return false;
};

const DEFAULT_SIMULATION_TIME = 3000; // Default time for MCTS in milliseconds

class MCTSNode {
  constructor(board, player, move = null, parent = null) {
    this.board = board;
    this.player = player;
    this.move = move;
    this.parent = parent;
    this.children = [];
    this.wins = 0;
    this.visits = 0;
    this.untriedMoves = getValidMoves(board);
  }

  UCTSelectChild() {
    return this.children.reduce((best, child) => {
      const uctValue = child.wins / child.visits + 
        Math.sqrt(2 * Math.log(this.visits) / child.visits);
      return uctValue > best.uctValue ? { node: child, uctValue } : best;
    }, { node: null, uctValue: -Infinity }).node;
  }

  addChild(move, board) {
    const childNode = new MCTSNode(board, this.player === 'X' ? 'O' : 'X', move, this);
    this.untriedMoves = this.untriedMoves.filter(m => m.row !== move.row || m.col !== move.col);
    this.children.push(childNode);
    return childNode;
  }

  update(result) {
    this.visits++;
    this.wins += result;
  }
}

const Index = () => {
  const [board, setBoard] = useState(Array(BOARD_SIZE).fill(Array(BOARD_SIZE).fill(null)));
  const [currentPlayer, setCurrentPlayer] = useState('X');
  const [winner, setWinner] = useState(null);
  const [gameMode, setGameMode] = useState('pvp'); // 'pvp' or 'ai'
  const [simulationTime, setSimulationTime] = useState(DEFAULT_SIMULATION_TIME);

  useEffect(() => {
    if (gameMode === 'ai' && currentPlayer === 'O' && !winner) {
      const aiMove = findBestMove(board);
      handleMove(aiMove.row, aiMove.col);
    }
  }, [currentPlayer, gameMode, winner]);

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

  const findBestMove = (board) => {
    const rootNode = new MCTSNode(board, 'O');
    const endTime = Date.now() + simulationTime;

    while (Date.now() < endTime) {
      let node = rootNode;
      let tempBoard = board.map(row => [...row]);

      // Selection
      while (node.untriedMoves.length === 0 && node.children.length > 0) {
        node = node.UCTSelectChild();
        tempBoard[node.move.row][node.move.col] = node.player;
      }

      // Expansion
      if (node.untriedMoves.length > 0) {
        const move = node.untriedMoves[Math.floor(Math.random() * node.untriedMoves.length)];
        tempBoard[move.row][move.col] = node.player;
        node = node.addChild(move, tempBoard);
      }

      // Simulation
      let currentPlayer = node.player === 'X' ? 'O' : 'X';
      while (!checkWinner(tempBoard, node.move.row, node.move.col)) {
        const validMoves = getValidMoves(tempBoard);
        if (validMoves.length === 0) break;
        const move = validMoves[Math.floor(Math.random() * validMoves.length)];
        tempBoard[move.row][move.col] = currentPlayer;
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
      }

      // Backpropagation
      while (node !== null) {
        node.update(currentPlayer === 'O' ? 1 : 0);
        node = node.parent;
      }
    }

    return rootNode.children.reduce((best, child) => 
      child.visits > best.visits ? child : best
    ).move;
  };

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
