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

  const evaluateWindow = (window, player) => {
    const opponent = player === 'X' ? 'O' : 'X';
    let score = 0;

    if (window.filter(cell => cell === player).length === 5) {
      score += 100;
    } else if (window.filter(cell => cell === player).length === 4 && window.filter(cell => cell === null).length === 1) {
      score += 10;
    } else if (window.filter(cell => cell === player).length === 3 && window.filter(cell => cell === null).length === 2) {
      score += 5;
    }

    if (window.filter(cell => cell === opponent).length === 4 && window.filter(cell => cell === null).length === 1) {
      score -= 50;
    }

    return score;
  };

  const evaluateBoard = (board, player) => {
    let score = 0;

    // Evaluate horizontally
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE - 4; col++) {
        let window = board[row].slice(col, col + 5);
        score += evaluateWindow(window, player);
      }
    }

    // Evaluate vertically
    for (let col = 0; col < BOARD_SIZE; col++) {
      for (let row = 0; row < BOARD_SIZE - 4; row++) {
        let window = [board[row][col], board[row+1][col], board[row+2][col], board[row+3][col], board[row+4][col]];
        score += evaluateWindow(window, player);
      }
    }

    // Evaluate diagonally (top-left to bottom-right)
    for (let row = 0; row < BOARD_SIZE - 4; row++) {
      for (let col = 0; col < BOARD_SIZE - 4; col++) {
        let window = [board[row][col], board[row+1][col+1], board[row+2][col+2], board[row+3][col+3], board[row+4][col+4]];
        score += evaluateWindow(window, player);
      }
    }

    // Evaluate diagonally (top-right to bottom-left)
    for (let row = 0; row < BOARD_SIZE - 4; row++) {
      for (let col = 4; col < BOARD_SIZE; col++) {
        let window = [board[row][col], board[row+1][col-1], board[row+2][col-2], board[row+3][col-3], board[row+4][col-4]];
        score += evaluateWindow(window, player);
      }
    }

    return score;
  };

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

  const findBestMove = (board) => {
    const validMoves = getValidMoves(board);
    let bestScore = -Infinity;
    let bestMove = null;

    for (const move of validMoves) {
      board[move.row][move.col] = 'O';
      let score = evaluateBoard(board, 'O') - evaluateBoard(board, 'X');
      board[move.row][move.col] = null;

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return bestMove || validMoves[0];
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
