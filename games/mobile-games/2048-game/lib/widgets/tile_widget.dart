import 'package:flutter/material.dart';
import '../models/tile.dart';

class TileWidget extends StatelessWidget {
  final Tile? tile;

  const TileWidget({super.key, this.tile});

  Color getTileColor(int? value) {
    if (value == null) return const Color(0xFFCDC1B4);

    switch (value) {
      case 2:
        return const Color(0xFFEEE4DA);
      case 4:
        return const Color(0xFFEDE0C8);
      case 8:
        return const Color(0xFFF2B179);
      case 16:
        return const Color(0xFFF59563);
      case 32:
        return const Color(0xFFF67C5F);
      case 64:
        return const Color(0xFFF65E3B);
      case 128:
        return const Color(0xFFEDCF72);
      case 256:
        return const Color(0xFFEDCC61);
      case 512:
        return const Color(0xFFEDC850);
      case 1024:
        return const Color(0xFFEDC53F);
      case 2048:
        return const Color(0xFFEDC22E);
      default:
        return const Color(0xFF3C3A32);
    }
  }

  Color getTextColor(int? value) {
    if (value == null) return Colors.transparent;
    return value <= 4 ? const Color(0xFF776E65) : Colors.white;
  }

  double getFontSize(int? value) {
    if (value == null) return 0;
    if (value >= 1000) return 24;
    if (value >= 100) return 32;
    return 40;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: getTileColor(tile?.value),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Center(
        child: tile != null
            ? Text(
                '${tile!.value}',
                style: TextStyle(
                  fontSize: getFontSize(tile!.value),
                  fontWeight: FontWeight.bold,
                  color: getTextColor(tile!.value),
                ),
              )
            : null,
      ),
    );
  }
}
