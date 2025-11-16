import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/board.dart';
import '../widgets/game_board.dart';
import '../widgets/score_card.dart';

class GameScreen extends StatefulWidget {
  const GameScreen({super.key});

  @override
  State<GameScreen> createState() => _GameScreenState();
}

class _GameScreenState extends State<GameScreen> {
  late Board board;
  int bestScore = 0;

  @override
  void initState() {
    super.initState();
    board = Board();
    loadBestScore();
    board.initBoard();
  }

  Future<void> loadBestScore() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      bestScore = prefs.getInt('bestScore') ?? 0;
    });
  }

  Future<void> saveBestScore(int score) async {
    final prefs = await SharedPreferences.getInstance();
    if (score > bestScore) {
      await prefs.setInt('bestScore', score);
      setState(() {
        bestScore = score;
      });
    }
  }

  void handleSwipe(Direction direction) {
    setState(() {
      board.move(direction);
      if (board.score > bestScore) {
        saveBestScore(board.score);
      }
    });
  }

  void resetGame() {
    setState(() {
      board.initBoard();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          '2048',
          style: TextStyle(
            fontSize: 32,
            fontWeight: FontWeight.bold,
          ),
        ),
        centerTitle: true,
        elevation: 0,
        backgroundColor: const Color(0xFFEDC22E),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  ScoreCard(
                    title: 'SCORE',
                    score: board.score,
                  ),
                  ScoreCard(
                    title: 'BEST',
                    score: bestScore,
                  ),
                ],
              ),
              const SizedBox(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Expanded(
                    child: Text(
                      'Join the tiles, get to 2048!',
                      style: TextStyle(
                        fontSize: 16,
                        color: Colors.black54,
                      ),
                    ),
                  ),
                  ElevatedButton(
                    onPressed: resetGame,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF8F7A66),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 20,
                        vertical: 12,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: const Text(
                      'New Game',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              Expanded(
                child: GameBoard(
                  board: board,
                  onSwipe: handleSwipe,
                ),
              ),
              if (board.gameOver || board.won)
                Positioned.fill(
                  child: Container(
                    color: Colors.black.withOpacity(0.5),
                    child: Center(
                      child: Container(
                        padding: const EdgeInsets.all(30),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(15),
                        ),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              board.won ? 'You Win!' : 'Game Over!',
                              style: const TextStyle(
                                fontSize: 36,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF776E65),
                              ),
                            ),
                            const SizedBox(height: 10),
                            Text(
                              'Score: ${board.score}',
                              style: const TextStyle(
                                fontSize: 24,
                                color: Colors.black54,
                              ),
                            ),
                            const SizedBox(height: 20),
                            ElevatedButton(
                              onPressed: resetGame,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF8F7A66),
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 30,
                                  vertical: 15,
                                ),
                              ),
                              child: const Text(
                                'Try Again',
                                style: TextStyle(fontSize: 18),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
