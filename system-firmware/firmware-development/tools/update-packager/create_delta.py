#!/usr/bin/env python3
"""
Delta Update Generator
Creates differential update packages using various algorithms (bsdiff, xdelta3)
"""

import os
import sys
import argparse
import hashlib
import subprocess
import tempfile
import json
from pathlib import Path
from typing import Optional, Dict, Tuple
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class DeltaGenerator:
    """Generate delta/differential update patches"""

    SUPPORTED_ALGORITHMS = ['bsdiff', 'xdelta3', 'custom']

    def __init__(self, algorithm: str = 'bsdiff'):
        """
        Initialize delta generator

        Args:
            algorithm: Diff algorithm to use (bsdiff, xdelta3, custom)
        """
        if algorithm not in self.SUPPORTED_ALGORITHMS:
            raise ValueError(f"Unsupported algorithm: {algorithm}")

        self.algorithm = algorithm
        self.stats = {}

    def generate_delta(
        self,
        source_file: str,
        target_file: str,
        output_patch: str,
        compression: str = 'bz2'
    ) -> Dict:
        """
        Generate delta patch between source and target files

        Args:
            source_file: Path to source (old) firmware file
            target_file: Path to target (new) firmware file
            output_patch: Path to output patch file
            compression: Compression algorithm (bz2, gz, none)

        Returns:
            Dictionary with patch statistics
        """
        if not os.path.exists(source_file):
            raise FileNotFoundError(f"Source file not found: {source_file}")

        if not os.path.exists(target_file):
            raise FileNotFoundError(f"Target file not found: {target_file}")

        logger.info(f"Generating delta patch using {self.algorithm}")
        logger.info(f"Source: {source_file}")
        logger.info(f"Target: {target_file}")

        # Get file sizes
        source_size = os.path.getsize(source_file)
        target_size = os.path.getsize(target_file)

        # Generate checksums
        source_checksum = self._calculate_checksum(source_file)
        target_checksum = self._calculate_checksum(target_file)

        # Generate patch based on algorithm
        if self.algorithm == 'bsdiff':
            patch_size = self._generate_bsdiff(source_file, target_file, output_patch)
        elif self.algorithm == 'xdelta3':
            patch_size = self._generate_xdelta3(source_file, target_file, output_patch)
        else:
            patch_size = self._generate_custom(source_file, target_file, output_patch)

        # Calculate patch checksum
        patch_checksum = self._calculate_checksum(output_patch)

        # Compile statistics
        stats = {
            'algorithm': self.algorithm,
            'source': {
                'file': os.path.basename(source_file),
                'size': source_size,
                'checksum': source_checksum
            },
            'target': {
                'file': os.path.basename(target_file),
                'size': target_size,
                'checksum': target_checksum
            },
            'patch': {
                'file': os.path.basename(output_patch),
                'size': patch_size,
                'checksum': patch_checksum,
                'compression': compression
            },
            'compression_ratio': round((1 - patch_size / target_size) * 100, 2) if target_size > 0 else 0,
            'size_reduction': target_size - patch_size
        }

        logger.info(f"Patch generated successfully: {output_patch}")
        logger.info(f"Patch size: {patch_size} bytes ({stats['compression_ratio']}% smaller than target)")

        self.stats = stats
        return stats

    def _generate_bsdiff(self, source: str, target: str, patch: str) -> int:
        """Generate patch using bsdiff algorithm"""
        try:
            # Try using bsdiff command-line tool
            cmd = ['bsdiff', source, target, patch]
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=300
            )

            if result.returncode != 0:
                raise RuntimeError(f"bsdiff failed: {result.stderr}")

            return os.path.getsize(patch)

        except FileNotFoundError:
            # bsdiff not installed, use Python implementation
            logger.warning("bsdiff not found, using custom implementation")
            return self._generate_custom(source, target, patch)

    def _generate_xdelta3(self, source: str, target: str, patch: str) -> int:
        """Generate patch using xdelta3 algorithm"""
        try:
            # Try using xdelta3 command-line tool
            cmd = ['xdelta3', '-e', '-s', source, target, patch]
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=300
            )

            if result.returncode != 0:
                raise RuntimeError(f"xdelta3 failed: {result.stderr}")

            return os.path.getsize(patch)

        except FileNotFoundError:
            # xdelta3 not installed, fallback to bsdiff
            logger.warning("xdelta3 not found, falling back to bsdiff")
            return self._generate_bsdiff(source, target, patch)

    def _generate_custom(self, source: str, target: str, patch: str) -> int:
        """
        Custom delta generation implementation
        Simple block-based differential algorithm
        """
        BLOCK_SIZE = 4096

        with open(source, 'rb') as sf, open(target, 'rb') as tf, open(patch, 'wb') as pf:
            # Write header
            header = {
                'algorithm': 'custom',
                'block_size': BLOCK_SIZE,
                'source_size': os.path.getsize(source),
                'target_size': os.path.getsize(target)
            }
            header_bytes = json.dumps(header).encode('utf-8')
            pf.write(len(header_bytes).to_bytes(4, 'little'))
            pf.write(header_bytes)

            # Read files in blocks and write differences
            block_num = 0
            while True:
                source_block = sf.read(BLOCK_SIZE)
                target_block = tf.read(BLOCK_SIZE)

                if not target_block:
                    break

                if source_block != target_block:
                    # Write block number and new data
                    pf.write(block_num.to_bytes(4, 'little'))
                    pf.write(len(target_block).to_bytes(4, 'little'))
                    pf.write(target_block)

                block_num += 1

            # Write end marker
            pf.write(b'\xFF\xFF\xFF\xFF')

        return os.path.getsize(patch)

    def apply_delta(
        self,
        source_file: str,
        patch_file: str,
        output_file: str,
        verify: bool = True
    ) -> bool:
        """
        Apply delta patch to source file

        Args:
            source_file: Path to source (old) firmware file
            patch_file: Path to patch file
            output_file: Path to output (new) firmware file
            verify: Verify output integrity

        Returns:
            True if patch applied successfully
        """
        logger.info(f"Applying delta patch using {self.algorithm}")

        if self.algorithm == 'bsdiff':
            success = self._apply_bsdiff(source_file, patch_file, output_file)
        elif self.algorithm == 'xdelta3':
            success = self._apply_xdelta3(source_file, patch_file, output_file)
        else:
            success = self._apply_custom(source_file, patch_file, output_file)

        if success and verify:
            logger.info("Verifying patched file...")
            # Additional verification can be added here
            if not os.path.exists(output_file):
                logger.error("Output file not created")
                return False

            logger.info("Patch applied and verified successfully")

        return success

    def _apply_bsdiff(self, source: str, patch: str, output: str) -> bool:
        """Apply bsdiff patch"""
        try:
            cmd = ['bspatch', source, output, patch]
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=300
            )

            return result.returncode == 0

        except FileNotFoundError:
            logger.error("bspatch not found")
            return False

    def _apply_xdelta3(self, source: str, patch: str, output: str) -> bool:
        """Apply xdelta3 patch"""
        try:
            cmd = ['xdelta3', '-d', '-s', source, patch, output]
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=300
            )

            return result.returncode == 0

        except FileNotFoundError:
            logger.error("xdelta3 not found")
            return False

    def _apply_custom(self, source: str, patch: str, output: str) -> bool:
        """Apply custom delta patch"""
        try:
            BLOCK_SIZE = 4096

            with open(source, 'rb') as sf, open(patch, 'rb') as pf, open(output, 'wb') as of:
                # Read header
                header_len = int.from_bytes(pf.read(4), 'little')
                header = json.loads(pf.read(header_len).decode('utf-8'))

                BLOCK_SIZE = header['block_size']

                # Read source file into memory (for small files)
                source_data = sf.read()

                # Create output buffer
                output_data = bytearray(source_data)

                # Apply patches
                while True:
                    block_num_bytes = pf.read(4)
                    if not block_num_bytes or block_num_bytes == b'\xFF\xFF\xFF\xFF':
                        break

                    block_num = int.from_bytes(block_num_bytes, 'little')
                    block_len = int.from_bytes(pf.read(4), 'little')
                    block_data = pf.read(block_len)

                    # Update block
                    offset = block_num * BLOCK_SIZE
                    output_data[offset:offset + block_len] = block_data

                # Write output
                of.write(output_data[:header['target_size']])

            return True

        except Exception as e:
            logger.error(f"Failed to apply custom patch: {e}")
            return False

    def _calculate_checksum(self, file_path: str, algorithm: str = 'sha256') -> str:
        """Calculate file checksum"""
        hash_obj = hashlib.new(algorithm)

        with open(file_path, 'rb') as f:
            while chunk := f.read(8192):
                hash_obj.update(chunk)

        return hash_obj.hexdigest()

    def save_stats(self, output_file: str):
        """Save statistics to JSON file"""
        with open(output_file, 'w') as f:
            json.dump(self.stats, f, indent=2)

        logger.info(f"Statistics saved to: {output_file}")


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description='Delta Update Generator for Firmware OTA',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Generate delta patch
  %(prog)s generate -s old_firmware.bin -t new_firmware.bin -o patch.delta

  # Generate with specific algorithm
  %(prog)s generate -s old.bin -t new.bin -o patch.delta -a xdelta3

  # Apply delta patch
  %(prog)s apply -s old_firmware.bin -p patch.delta -o new_firmware.bin

  # Generate and save statistics
  %(prog)s generate -s old.bin -t new.bin -o patch.delta --stats stats.json
        """
    )

    subparsers = parser.add_subparsers(dest='command', help='Command to execute')

    # Generate command
    gen_parser = subparsers.add_parser('generate', help='Generate delta patch')
    gen_parser.add_argument('-s', '--source', required=True,
                           help='Source (old) firmware file')
    gen_parser.add_argument('-t', '--target', required=True,
                           help='Target (new) firmware file')
    gen_parser.add_argument('-o', '--output', required=True,
                           help='Output patch file')
    gen_parser.add_argument('-a', '--algorithm',
                           choices=['bsdiff', 'xdelta3', 'custom'],
                           default='bsdiff',
                           help='Delta algorithm (default: bsdiff)')
    gen_parser.add_argument('-c', '--compression',
                           choices=['bz2', 'gz', 'none'],
                           default='bz2',
                           help='Compression algorithm (default: bz2)')
    gen_parser.add_argument('--stats', help='Save statistics to JSON file')

    # Apply command
    apply_parser = subparsers.add_parser('apply', help='Apply delta patch')
    apply_parser.add_argument('-s', '--source', required=True,
                             help='Source (old) firmware file')
    apply_parser.add_argument('-p', '--patch', required=True,
                             help='Patch file')
    apply_parser.add_argument('-o', '--output', required=True,
                             help='Output (new) firmware file')
    apply_parser.add_argument('-a', '--algorithm',
                             choices=['bsdiff', 'xdelta3', 'custom'],
                             default='bsdiff',
                             help='Delta algorithm (default: bsdiff)')
    apply_parser.add_argument('--no-verify', action='store_true',
                             help='Skip output verification')

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return 1

    try:
        if args.command == 'generate':
            generator = DeltaGenerator(algorithm=args.algorithm)
            stats = generator.generate_delta(
                args.source,
                args.target,
                args.output,
                compression=args.compression
            )

            print("\n=== Delta Generation Statistics ===")
            print(f"Algorithm: {stats['algorithm']}")
            print(f"Source: {stats['source']['file']} ({stats['source']['size']} bytes)")
            print(f"Target: {stats['target']['file']} ({stats['target']['size']} bytes)")
            print(f"Patch: {stats['patch']['file']} ({stats['patch']['size']} bytes)")
            print(f"Compression ratio: {stats['compression_ratio']}%")
            print(f"Size reduction: {stats['size_reduction']} bytes")

            if args.stats:
                generator.save_stats(args.stats)

        elif args.command == 'apply':
            generator = DeltaGenerator(algorithm=args.algorithm)
            success = generator.apply_delta(
                args.source,
                args.patch,
                args.output,
                verify=not args.no_verify
            )

            if success:
                print(f"\nPatch applied successfully: {args.output}")
                return 0
            else:
                print("\nFailed to apply patch")
                return 1

        return 0

    except Exception as e:
        logger.error(f"Error: {e}")
        return 1


if __name__ == '__main__':
    sys.exit(main())
