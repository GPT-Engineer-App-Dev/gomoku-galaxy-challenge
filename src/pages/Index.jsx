import React, { useState } from 'react';
import { Button } from "@/components/ui/button";

const BOARD_SIZE = 15;

const Index = () => {
  const [board, setBoard] = useState(Array(BOARD_SIZE).fill(Array(BOARD_SIZE).fill(null)));
  const [currentPlayer, setCurrentPlayer] = useState('X');
  const [winner, setWinner] = useState(null);

  const handleClick = (row, col) => {
    if (board[row][col] || winner) return;

    const newBoard = board.map(row => [...row]);
    newBoard[row][col] = currentPlayer;
    setBoard(newBoard);

    if (checkWinner(newBoard, row, col)) {
      setWinner(currentPlayer);
    } else {
      setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
    }
  };

  const checkWinner = (board, row, col) => {
    const directions = [
      [1, 0], [0, 1], [1, 1], [1, -1]
    ];

    return directions.some(([dx, dy]) => {
      return countConsecutive(board, row, col, dx, dy) + countConsecutive(board, row, col, -dx, -dy) - 1 >= 5;
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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold mb-6">Gomoku</h1>
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
                onClick={() => handleClick(rowIndex, colIndex)}
                disabled={!!cell || !!winner}
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
