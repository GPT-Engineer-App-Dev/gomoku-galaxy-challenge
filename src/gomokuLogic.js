const BOARD_SIZE = 15;
const WINNING_LENGTH = 5;

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

export { BOARD_SIZE, WINNING_LENGTH, getValidMoves, checkWinner, MCTSNode };
