#!/usr/bin/env python3
"""
passgen.py - 安全密碼生成器
使用 AI 輔助開發的密碼生成與強度評估工具
"""

import argparse
import random
import string
import sys
import secrets
from typing import List, Dict
import re


class PasswordGenerator:
    """密碼生成器類別"""

    # 常用單字庫（用於生成記憶短語）
    WORD_LIST = [
        'apple', 'banana', 'cherry', 'dragon', 'eagle', 'falcon',
        'garden', 'harbor', 'island', 'jungle', 'kingdom', 'laptop',
        'mountain', 'network', 'ocean', 'planet', 'quantum', 'rocket',
        'silver', 'thunder', 'umbrella', 'victory', 'winter', 'yellow',
        'azure', 'bronze', 'crystal', 'diamond', 'emerald', 'forest'
    ]

    def __init__(self):
        self.lowercase = string.ascii_lowercase
        self.uppercase = string.ascii_uppercase
        self.digits = string.digits
        self.symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?"

    def generate_random(self, length: int = 16, use_uppercase: bool = True,
                       use_digits: bool = True, use_symbols: bool = True,
                       exclude_ambiguous: bool = False) -> str:
        """生成隨機密碼"""
        chars = self.lowercase

        if use_uppercase:
            chars += self.uppercase
        if use_digits:
            chars += self.digits
        if use_symbols:
            chars += self.symbols

        # 排除容易混淆的字元
        if exclude_ambiguous:
            ambiguous = 'il1Lo0O'
            chars = ''.join(c for c in chars if c not in ambiguous)

        # 使用 secrets 模組生成安全的隨機密碼
        password = ''.join(secrets.choice(chars) for _ in range(length))

        return password

    def generate_pin(self, length: int = 6) -> str:
        """生成 PIN 碼"""
        return ''.join(secrets.choice(self.digits) for _ in range(length))

    def generate_passphrase(self, word_count: int = 4,
                           separator: str = '-',
                           capitalize: bool = True,
                           add_number: bool = True) -> str:
        """生成記憶短語"""
        words = [secrets.choice(self.WORD_LIST) for _ in range(word_count)]

        if capitalize:
            words = [w.capitalize() for w in words]

        passphrase = separator.join(words)

        if add_number:
            passphrase += separator + str(secrets.randbelow(100))

        return passphrase

    def generate_alphanumeric(self, length: int = 12) -> str:
        """生成只包含字母和數字的密碼"""
        chars = self.lowercase + self.uppercase + self.digits
        return ''.join(secrets.choice(chars) for _ in range(length))

    @staticmethod
    def calculate_strength(password: str) -> Dict[str, any]:
        """計算密碼強度"""
        strength = {
            'score': 0,
            'length': len(password),
            'has_lowercase': bool(re.search(r'[a-z]', password)),
            'has_uppercase': bool(re.search(r'[A-Z]', password)),
            'has_digits': bool(re.search(r'\d', password)),
            'has_symbols': bool(re.search(r'[^a-zA-Z0-9]', password)),
            'entropy': 0,
            'rating': ''
        }

        # 計算分數
        if strength['length'] >= 8:
            strength['score'] += 1
        if strength['length'] >= 12:
            strength['score'] += 1
        if strength['length'] >= 16:
            strength['score'] += 1

        if strength['has_lowercase']:
            strength['score'] += 1
        if strength['has_uppercase']:
            strength['score'] += 1
        if strength['has_digits']:
            strength['score'] += 1
        if strength['has_symbols']:
            strength['score'] += 2

        # 計算熵值（簡化版本）
        charset_size = 0
        if strength['has_lowercase']:
            charset_size += 26
        if strength['has_uppercase']:
            charset_size += 26
        if strength['has_digits']:
            charset_size += 10
        if strength['has_symbols']:
            charset_size += 32

        if charset_size > 0:
            import math
            strength['entropy'] = len(password) * math.log2(charset_size)

        # 評級
        if strength['score'] >= 8:
            strength['rating'] = '非常強'
        elif strength['score'] >= 6:
            strength['rating'] = '強'
        elif strength['score'] >= 4:
            strength['rating'] = '中等'
        elif strength['score'] >= 2:
            strength['rating'] = '弱'
        else:
            strength['rating'] = '非常弱'

        return strength

    @staticmethod
    def format_strength_report(password: str, strength: Dict) -> str:
        """格式化強度報告"""
        lines = [
            f"\n密碼: {password}",
            f"長度: {strength['length']} 字元",
            f"評級: {strength['rating']} (分數: {strength['score']}/10)",
            f"熵值: {strength['entropy']:.1f} bits",
            "\n特徵:",
            f"  ✓ 小寫字母" if strength['has_lowercase'] else "  ✗ 小寫字母",
            f"  ✓ 大寫字母" if strength['has_uppercase'] else "  ✗ 大寫字母",
            f"  ✓ 數字" if strength['has_digits'] else "  ✗ 數字",
            f"  ✓ 特殊符號" if strength['has_symbols'] else "  ✗ 特殊符號",
        ]

        return "\n".join(lines)


def main():
    """主函數"""
    parser = argparse.ArgumentParser(
        description="安全密碼生成器 - AI 輔助開發",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
範例:
  %(prog)s                              # 生成預設密碼（16字元）
  %(prog)s --length 32                  # 生成 32 字元密碼
  %(prog)s --type passphrase            # 生成記憶短語
  %(prog)s --type pin --length 8        # 生成 8 位數 PIN
  %(prog)s --count 10                   # 生成 10 個密碼
  %(prog)s --alphanumeric               # 只使用字母數字
  %(prog)s --no-symbols                 # 不使用特殊符號
  %(prog)s --check "MyPassword123"      # 檢查密碼強度
        """
    )

    parser.add_argument('-l', '--length', type=int, default=16,
                       help='密碼長度（預設：16）')
    parser.add_argument('-t', '--type',
                       choices=['random', 'pin', 'passphrase', 'alphanumeric'],
                       default='random',
                       help='密碼類型（預設：random）')
    parser.add_argument('-c', '--count', type=int, default=1,
                       help='生成數量（預設：1）')
    parser.add_argument('--no-uppercase', action='store_true',
                       help='不使用大寫字母')
    parser.add_argument('--no-digits', action='store_true',
                       help='不使用數字')
    parser.add_argument('--no-symbols', action='store_true',
                       help='不使用特殊符號')
    parser.add_argument('--exclude-ambiguous', action='store_true',
                       help='排除容易混淆的字元 (il1Lo0O)')
    parser.add_argument('--alphanumeric', action='store_true',
                       help='只使用字母和數字')
    parser.add_argument('-s', '--show-strength', action='store_true',
                       help='顯示密碼強度')
    parser.add_argument('--check', metavar='PASSWORD',
                       help='檢查指定密碼的強度')

    # Passphrase 特定選項
    parser.add_argument('--words', type=int, default=4,
                       help='記憶短語的單字數量（預設：4）')
    parser.add_argument('--separator', default='-',
                       help='記憶短語分隔符（預設：-）')

    args = parser.parse_args()

    gen = PasswordGenerator()

    # 檢查密碼強度模式
    if args.check:
        strength = gen.calculate_strength(args.check)
        print(gen.format_strength_report(args.check, strength))
        sys.exit(0)

    # 生成密碼
    passwords = []

    for _ in range(args.count):
        if args.type == 'pin':
            password = gen.generate_pin(args.length)
        elif args.type == 'passphrase':
            password = gen.generate_passphrase(
                word_count=args.words,
                separator=args.separator
            )
        elif args.type == 'alphanumeric' or args.alphanumeric:
            password = gen.generate_alphanumeric(args.length)
        else:  # random
            password = gen.generate_random(
                length=args.length,
                use_uppercase=not args.no_uppercase,
                use_digits=not args.no_digits,
                use_symbols=not args.no_symbols and not args.alphanumeric,
                exclude_ambiguous=args.exclude_ambiguous
            )

        passwords.append(password)

    # 輸出結果
    if args.show_strength:
        for password in passwords:
            strength = gen.calculate_strength(password)
            print(gen.format_strength_report(password, strength))
            print()
    else:
        for password in passwords:
            print(password)


if __name__ == '__main__':
    main()
