// board.js
// Pure Minesweeper rules with no drawing. The board is plain data so it can
// sit in State while the player is away in Snake.

const Board = {
  create(size, mineCount) {
    const cells = [];
    for (let i = 0; i < size * size; i++) {
      cells.push({ mine: false, revealed: false, flagged: false, exploded: false, adjacent: 0 });
    }
    return { size, mineCount, cells, minesPlaced: false };
  },

  index(board, col, row) { return row * board.size + col; },
  col(board, i) { return i % board.size; },
  row(board, i) { return Math.floor(i / board.size); },

  neighbors(board, i) {
    const out = [];
    const c = this.col(board, i);
    const r = this.row(board, i);
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nc = c + dc;
        const nr = r + dr;
        if (nc < 0 || nr < 0 || nc >= board.size || nr >= board.size) continue;
        out.push(this.index(board, nc, nr));
      }
    }
    return out;
  },

  // Mines are placed on the first click so the first tile (and the tiles
  // around it) are always safe.
  placeMines(board, safeIndex) {
    const forbidden = new Set([safeIndex, ...this.neighbors(board, safeIndex)]);
    const pool = [];
    for (let i = 0; i < board.cells.length; i++) {
      if (!forbidden.has(i)) pool.push(i);
    }
    // Fisher-Yates shuffle, then take the first mineCount cells.
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    pool.slice(0, board.mineCount).forEach(i => { board.cells[i].mine = true; });
    board.cells.forEach((cell, i) => {
      cell.adjacent = this.neighbors(board, i).filter(n => board.cells[n].mine).length;
    });
    board.minesPlaced = true;
  },

  // Reveals a safe tile. If it has no neighboring mines, the reveal spreads.
  // Returns the list of tiles that were opened.
  floodReveal(board, start) {
    const opened = [];
    const stack = [start];
    while (stack.length) {
      const i = stack.pop();
      const cell = board.cells[i];
      if (cell.revealed || cell.flagged || cell.mine) continue;
      cell.revealed = true;
      opened.push(i);
      if (cell.adjacent === 0) {
        this.neighbors(board, i).forEach(n => stack.push(n));
      }
    }
    return opened;
  },

  // The board is cleared when every tile without a mine is open.
  isCleared(board) {
    return board.minesPlaced && board.cells.every(c => c.mine || c.revealed);
  },

  mineIndexes(board) {
    const out = [];
    board.cells.forEach((c, i) => { if (c.mine) out.push(i); });
    return out;
  },

  flagsUsed(board) {
    return board.cells.filter(c => c.flagged).length;
  },

  // Mines still hidden: total minus the ones already blown up.
  minesHidden(board) {
    return board.mineCount - board.cells.filter(c => c.exploded).length;
  }
};
