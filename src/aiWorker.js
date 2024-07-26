// AI Worker logic goes here
import { MCTSNode, getValidMoves, checkWinner } from './gomokuLogic';

const BOARD_SIZE = 15;

self.onmessage = function(e) {
  const { board, simulationTime } = e.data;
  const bestMove = findBestMove(board, simulationTime);
  self.postMessage(bestMove);
};

function findBestMove(board, simulationTime) {
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
}
