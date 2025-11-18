#!/usr/bin/env python3
"""
firmware-signer.py - Firmware Signing Tool

Copyright (C) 2025 AI-Assisted Development Team
SPDX-License-Identifier: MIT

This tool signs firmware images with RSA or ECDSA digital signatures
for secure boot implementations.
"""

import argparse
import hashlib
import struct
import sys
import os
from pathlib import Path
from datetime import datetime

try:
    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.primitives.asymmetric import rsa, ec, padding
    from cryptography.hazmat.backends import default_backend
    from cryptography.exceptions import InvalidSignature
except ImportError:
    print("Error: cryptography library not installed")
    print("Install with: pip install cryptography")
    sys.exit(1)


class FirmwareSigner:
    """Firmware signing and verification tool"""

    MAGIC = 0x46574152  # "FWAR"
    HEADER_VERSION = 0x00010000

    def __init__(self):
        self.backend = default_backend()

    def load_private_key(self, key_path, password=None):
        """Load RSA or ECDSA private key from file"""
        with open(key_path, 'rb') as f:
            key_data = f.read()

        try:
            if password:
                password = password.encode()

            # Try RSA first
            try:
                key = serialization.load_pem_private_key(
                    key_data,
                    password=password,
                    backend=self.backend
                )
                return key
            except ValueError:
                # Try ECDSA
                key = serialization.load_pem_private_key(
                    key_data,
                    password=password,
                    backend=self.backend
                )
                return key

        except Exception as e:
            print(f"Error loading private key: {e}")
            sys.exit(1)

    def load_public_key(self, key_path):
        """Load RSA or ECDSA public key from file"""
        with open(key_path, 'rb') as f:
            key_data = f.read()

        try:
            key = serialization.load_pem_public_key(
                key_data,
                backend=self.backend
            )
            return key
        except Exception as e:
            print(f"Error loading public key: {e}")
            sys.exit(1)

    def calculate_hash(self, data):
        """Calculate SHA-256 hash of data"""
        return hashlib.sha256(data).digest()

    def calculate_crc32(self, data):
        """Calculate CRC32 checksum"""
        import zlib
        return zlib.crc32(data) & 0xFFFFFFFF

    def sign_data(self, data, private_key):
        """Sign data with private key"""
        if isinstance(private_key, rsa.RSAPrivateKey):
            signature = private_key.sign(
                data,
                padding.PSS(
                    mgf=padding.MGF1(hashes.SHA256()),
                    salt_length=padding.PSS.MAX_LENGTH
                ),
                hashes.SHA256()
            )
            return signature

        elif isinstance(private_key, ec.EllipticCurvePrivateKey):
            signature = private_key.sign(
                data,
                ec.ECDSA(hashes.SHA256())
            )
            return signature

        else:
            raise ValueError("Unsupported key type")

    def verify_signature(self, data, signature, public_key):
        """Verify signature with public key"""
        try:
            if isinstance(public_key, rsa.RSAPublicKey):
                public_key.verify(
                    signature,
                    data,
                    padding.PSS(
                        mgf=padding.MGF1(hashes.SHA256()),
                        salt_length=padding.PSS.MAX_LENGTH
                    ),
                    hashes.SHA256()
                )
                return True

            elif isinstance(public_key, ec.EllipticCurvePublicKey):
                public_key.verify(
                    signature,
                    data,
                    ec.ECDSA(hashes.SHA256())
                )
                return True

            else:
                return False

        except InvalidSignature:
            return False

    def create_firmware_header(self, firmware_data, version, signature):
        """Create firmware header with metadata"""
        crc32 = self.calculate_crc32(firmware_data)
        sha256 = self.calculate_hash(firmware_data)
        timestamp = int(datetime.now().timestamp())

        # Pad signature to 256 bytes (for RSA-2048)
        if len(signature) < 256:
            signature = signature + b'\x00' * (256 - len(signature))
        elif len(signature) > 256:
            signature = signature[:256]

        # Header structure:
        # - magic (4 bytes)
        # - version (4 bytes)
        # - timestamp (4 bytes)
        # - size (4 bytes)
        # - crc32 (4 bytes)
        # - sha256 (32 bytes)
        # - signature (256 bytes)
        # - reserved (64 bytes)

        header = struct.pack('<IIIII',
                           self.MAGIC,
                           version,
                           timestamp,
                           len(firmware_data),
                           crc32)

        header += sha256
        header += signature
        header += b'\x00' * 64  # Reserved

        return header

    def sign_firmware(self, firmware_path, output_path, private_key_path,
                     version=1, password=None):
        """Sign firmware and create signed package"""
        print(f"📝 Signing firmware: {firmware_path}")

        # Read firmware
        with open(firmware_path, 'rb') as f:
            firmware_data = f.read()

        print(f"   Firmware size: {len(firmware_data)} bytes")

        # Load private key
        print(f"🔐 Loading private key: {private_key_path}")
        private_key = self.load_private_key(private_key_path, password)

        # Calculate hash
        firmware_hash = self.calculate_hash(firmware_data)
        print(f"   SHA-256: {firmware_hash.hex()}")

        # Sign firmware
        print("✍️  Signing firmware...")
        signature = self.sign_data(firmware_hash, private_key)
        print(f"   Signature size: {len(signature)} bytes")

        # Create header
        header = self.create_firmware_header(firmware_data, version, signature)

        # Write signed firmware
        with open(output_path, 'wb') as f:
            f.write(header)
            f.write(firmware_data)

        print(f"✅ Signed firmware saved to: {output_path}")
        print(f"   Total size: {len(header) + len(firmware_data)} bytes")

        return True

    def verify_firmware(self, signed_firmware_path, public_key_path):
        """Verify signed firmware"""
        print(f"🔍 Verifying firmware: {signed_firmware_path}")

        # Read signed firmware
        with open(signed_firmware_path, 'rb') as f:
            signed_data = f.read()

        # Parse header (368 bytes total)
        header_size = 368
        if len(signed_data) < header_size:
            print("❌ Invalid firmware: file too small")
            return False

        header = signed_data[:header_size]
        firmware_data = signed_data[header_size:]

        # Unpack header
        magic, version, timestamp, size, crc32 = struct.unpack('<IIIII', header[:20])

        if magic != self.MAGIC:
            print(f"❌ Invalid magic: 0x{magic:08X}")
            return False

        print(f"   Version: {version}")
        print(f"   Timestamp: {datetime.fromtimestamp(timestamp)}")
        print(f"   Size: {size} bytes")

        # Extract SHA-256 and signature
        sha256_stored = header[20:52]
        signature = header[52:308]

        # Verify size
        if len(firmware_data) != size:
            print(f"❌ Size mismatch: expected {size}, got {len(firmware_data)}")
            return False

        # Verify CRC32
        calculated_crc32 = self.calculate_crc32(firmware_data)
        if calculated_crc32 != crc32:
            print(f"❌ CRC32 mismatch: 0x{crc32:08X} != 0x{calculated_crc32:08X}")
            return False

        print(f"   ✅ CRC32 verified: 0x{crc32:08X}")

        # Verify SHA-256
        calculated_sha256 = self.calculate_hash(firmware_data)
        if calculated_sha256 != sha256_stored:
            print("❌ SHA-256 mismatch")
            return False

        print(f"   ✅ SHA-256 verified: {calculated_sha256.hex()}")

        # Load public key
        print(f"🔐 Loading public key: {public_key_path}")
        public_key = self.load_public_key(public_key_path)

        # Verify signature
        print("🔐 Verifying signature...")
        # Remove padding from signature
        signature = signature.rstrip(b'\x00')

        if self.verify_signature(calculated_sha256, signature, public_key):
            print("✅ Signature verified successfully!")
            return True
        else:
            print("❌ Signature verification failed!")
            return False


def main():
    parser = argparse.ArgumentParser(
        description='Firmware Signing Tool',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Sign firmware
  %(prog)s sign -i firmware.bin -o firmware_signed.bin -k private_key.pem -v 1

  # Verify firmware
  %(prog)s verify -i firmware_signed.bin -k public_key.pem

  # Sign with password-protected key
  %(prog)s sign -i firmware.bin -o firmware_signed.bin -k private_key.pem -p password
        """
    )

    subparsers = parser.add_subparsers(dest='command', help='Command to execute')

    # Sign command
    sign_parser = subparsers.add_parser('sign', help='Sign firmware')
    sign_parser.add_argument('-i', '--input', required=True, help='Input firmware file')
    sign_parser.add_argument('-o', '--output', required=True, help='Output signed firmware file')
    sign_parser.add_argument('-k', '--key', required=True, help='Private key file')
    sign_parser.add_argument('-v', '--version', type=int, default=1, help='Firmware version')
    sign_parser.add_argument('-p', '--password', help='Private key password')

    # Verify command
    verify_parser = subparsers.add_parser('verify', help='Verify signed firmware')
    verify_parser.add_argument('-i', '--input', required=True, help='Signed firmware file')
    verify_parser.add_argument('-k', '--key', required=True, help='Public key file')

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

    signer = FirmwareSigner()

    if args.command == 'sign':
        success = signer.sign_firmware(
            args.input,
            args.output,
            args.key,
            args.version,
            args.password
        )
        sys.exit(0 if success else 1)

    elif args.command == 'verify':
        success = signer.verify_firmware(args.input, args.key)
        sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
