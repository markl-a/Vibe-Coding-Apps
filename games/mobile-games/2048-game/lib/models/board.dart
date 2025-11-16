import 'dart:math';
import 'tile.dart';

class Board {
  final int size;
  List<List<Tile?>> grid;
  int score = 0;
  int bestScore = 0;
  bool gameOver = false;
  bool won = false;

  Board({this.size = 4}) : grid = List.generate(
    size,
    (i) => List.generate(size, (j) => null),
  );

  void initBoard() {
    grid = List.generate(size, (i) => List.generate(size, (j) => null));
    score = 0;
    gameOver = false;
    won = false;
    addRandomTile();
    addRandomTile();
  }

  void addRandomTile() {
    List<Point<int>> emptyCells = [];
    for (int i = 0; i < size; i++) {
      for (int j = 0; j < size; j++) {
        if (grid[i][j] == null) {
          emptyCells.add(Point(i, j));
        }
      }
    }

    if (emptyCells.isNotEmpty) {
      final random = Random();
      final cell = emptyCells[random.nextInt(emptyCells.length)];
      final value = random.nextDouble() < 0.9 ? 2 : 4;
      grid[cell.x][cell.y] = Tile(value: value, row: cell.x, col: cell.y);
    }
  }

  bool move(Direction direction) {
    bool moved = false;
    List<List<Tile?>> newGrid = List.generate(
      size,
      (i) => List.generate(size, (j) => null),
    );

    switch (direction) {
      case Direction.up:
        moved = moveUp(newGrid);
        break;
      case Direction.down:
        moved = moveDown(newGrid);
        break;
      case Direction.left:
        moved = moveLeft(newGrid);
        break;
      case Direction.right:
        moved = moveRight(newGrid);
        break;
    }

    if (moved) {
      grid = newGrid;
      addRandomTile();
      checkGameOver();
    }

    return moved;
  }

  bool moveLeft(List<List<Tile?>> newGrid) {
    bool moved = false;

    for (int i = 0; i < size; i++) {
      List<Tile> tiles = [];
      for (int j = 0; j < size; j++) {
        if (grid[i][j] != null) {
          tiles.add(grid[i][j]!);
        }
      }

      List<Tile> merged = mergeTiles(tiles);
      for (int j = 0; j < merged.length; j++) {
        merged[j].row = i;
        merged[j].col = j;
        newGrid[i][j] = merged[j];
        if (grid[i][j]?.value != merged[j].value || j != merged[j].col) {
          moved = true;
        }
      }
    }

    return moved;
  }

  bool moveRight(List<List<Tile?>> newGrid) {
    bool moved = false;

    for (int i = 0; i < size; i++) {
      List<Tile> tiles = [];
      for (int j = size - 1; j >= 0; j--) {
        if (grid[i][j] != null) {
          tiles.add(grid[i][j]!);
        }
      }

      List<Tile> merged = mergeTiles(tiles);
      for (int j = 0; j < merged.length; j++) {
        merged[j].row = i;
        merged[j].col = size - 1 - j;
        newGrid[i][size - 1 - j] = merged[j];
        if (grid[i][size - 1 - j]?.value != merged[j].value ||
            size - 1 - j != merged[j].col) {
          moved = true;
        }
      }
    }

    return moved;
  }

  bool moveUp(List<List<Tile?>> newGrid) {
    bool moved = false;

    for (int j = 0; j < size; j++) {
      List<Tile> tiles = [];
      for (int i = 0; i < size; i++) {
        if (grid[i][j] != null) {
          tiles.add(grid[i][j]!);
        }
      }

      List<Tile> merged = mergeTiles(tiles);
      for (int i = 0; i < merged.length; i++) {
        merged[i].row = i;
        merged[i].col = j;
        newGrid[i][j] = merged[i];
        if (grid[i][j]?.value != merged[i].value || i != merged[i].row) {
          moved = true;
        }
      }
    }

    return moved;
  }

  bool moveDown(List<List<Tile?>> newGrid) {
    bool moved = false;

    for (int j = 0; j < size; j++) {
      List<Tile> tiles = [];
      for (int i = size - 1; i >= 0; i--) {
        if (grid[i][j] != null) {
          tiles.add(grid[i][j]!);
        }
      }

      List<Tile> merged = mergeTiles(tiles);
      for (int i = 0; i < merged.length; i++) {
        merged[i].row = size - 1 - i;
        merged[i].col = j;
        newGrid[size - 1 - i][j] = merged[i];
        if (grid[size - 1 - i][j]?.value != merged[i].value ||
            size - 1 - i != merged[i].row) {
          moved = true;
        }
      }
    }

    return moved;
  }

  List<Tile> mergeTiles(List<Tile> tiles) {
    List<Tile> result = [];
    int i = 0;

    while (i < tiles.length) {
      if (i + 1 < tiles.length && tiles[i].value == tiles[i + 1].value) {
        int newValue = tiles[i].value * 2;
        result.add(Tile(
          value: newValue,
          row: tiles[i].row,
          col: tiles[i].col,
        ));
        score += newValue;
        if (newValue == 2048) {
          won = true;
        }
        i += 2;
      } else {
        result.add(Tile(
          value: tiles[i].value,
          row: tiles[i].row,
          col: tiles[i].col,
        ));
        i++;
      }
    }

    return result;
  }

  void checkGameOver() {
    // Check if there are any empty cells
    for (int i = 0; i < size; i++) {
      for (int j = 0; j < size; j++) {
        if (grid[i][j] == null) {
          return;
        }
      }
    }

    // Check if any adjacent cells can be merged
    for (int i = 0; i < size; i++) {
      for (int j = 0; j < size; j++) {
        if (j < size - 1 && grid[i][j]!.value == grid[i][j + 1]!.value) {
          return;
        }
        if (i < size - 1 && grid[i][j]!.value == grid[i + 1][j]!.value) {
          return;
        }
      }
    }

    gameOver = true;
  }

  bool canMove() {
    return !gameOver;
  }
}

enum Direction { up, down, left, right }
