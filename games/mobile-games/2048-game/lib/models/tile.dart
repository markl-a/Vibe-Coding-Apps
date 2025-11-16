class Tile {
  int value;
  int row;
  int col;

  Tile({
    required this.value,
    required this.row,
    required this.col,
  });

  Tile copyWith({int? value, int? row, int? col}) {
    return Tile(
      value: value ?? this.value,
      row: row ?? this.row,
      col: col ?? this.col,
    );
  }
}
