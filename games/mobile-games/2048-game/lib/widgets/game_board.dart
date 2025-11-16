import 'package:flutter/material.dart';
import '../models/board.dart';
import 'tile_widget.dart';

class GameBoard extends StatelessWidget {
  final Board board;
  final Function(Direction) onSwipe;

  const GameBoard({
    super.key,
    required this.board,
    required this.onSwipe,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onVerticalDragEnd: (details) {
        if (details.primaryVelocity! < 0) {
          onSwipe(Direction.up);
        } else if (details.primaryVelocity! > 0) {
          onSwipe(Direction.down);
        }
      },
      onHorizontalDragEnd: (details) {
        if (details.primaryVelocity! < 0) {
          onSwipe(Direction.left);
        } else if (details.primaryVelocity! > 0) {
          onSwipe(Direction.right);
        }
      },
      child: AspectRatio(
        aspectRatio: 1,
        child: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: const Color(0xFFBBADA0),
            borderRadius: BorderRadius.circular(8),
          ),
          child: GridView.builder(
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: board.size,
              mainAxisSpacing: 8,
              crossAxisSpacing: 8,
            ),
            itemCount: board.size * board.size,
            itemBuilder: (context, index) {
              int row = index ~/ board.size;
              int col = index % board.size;
              final tile = board.grid[row][col];

              return TileWidget(tile: tile);
            },
          ),
        ),
      ),
    );
  }
}
