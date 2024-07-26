import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";

const BOARD_SIZE = 15;
const WINNING_LENGTH = 5;

const Index = () => {
  const [board, setBoard] = useState(Array(BOARD_SIZE).fill(Array(BOARD_SIZE).fill(null)));
  const [currentPlayer, setCurrentPlayer] = useState('X');
  const [winner, setWinner] = useState(null);
  const [gameMode, setGameMode] = useState('pvp'); // 'pvp' or 'ai'

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

  const evaluate = (board) => {
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (board[row][col]) {
          if (checkWinner(board, row, col)) {
            return board[row][col] === 'X' ? -1000 : 1000;
          }
        }
      }
    }
    return 0;
  };

  const minimax = (board, depth, isMax, alpha, beta) => {
    const score = evaluate(board);

    if (score === 1000 || score === -1000) {
      return score;
    }

    if (depth === 0) {
      return score;
    }

    if (isMax) {
      let best = -Infinity;
      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          if (!board[row][col]) {
            board[row][col] = 'O';
            best = Math.max(best, minimax(board, depth - 1, !isMax, alpha, beta));
            board[row][col] = null;
            alpha = Math.max(alpha, best);
            if (beta <= alpha) break;
          }
        }
      }
      return best;
    } else {
      let best = Infinity;
      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          if (!board[row][col]) {
            board[row][col] = 'X';
            best = Math.min(best, minimax(board, depth - 1, !isMax, alpha, beta));
            board[row][col] = null;
            beta = Math.min(beta, best);
            if (beta <= alpha) break;
          }
        }
      }
      return best;
    }
  };

  const findBestMove = (board) => {
    let bestVal = -Infinity;
    let bestMove = { row: -1, col: -1 };

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (!board[row][col]) {
          board[row][col] = 'O';
          let moveVal = minimax(board, 3, false, -Infinity, Infinity);
          board[row][col] = null;
          if (moveVal > bestVal) {
            bestMove.row = row;
            bestMove.col = col;
            bestVal = moveVal;
          }
        }
      }
    }
    return bestMove;
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
