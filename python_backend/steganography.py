"""
SecretPixel Python Steganography Module
========================================
Implements Least Significant Bit (LSB) image steganography with AES-256-GCM
authenticated encryption, conforming to the SPXL v1 binary protocol.

Key Technical Specifications:
- Cipher: AES-256-GCM (Galois/Counter Mode with 128-bit authentication tag)
- Key Derivation: PBKDF2-HMAC-SHA-256 (100,000 rounds)
- Random Salt: 16 bytes (128 bits) cryptographically secure (os.urandom)
- Initialization Vector: 12 bytes (96 bits) cryptographically secure (os.urandom)
- Framing: SPXL v1 header (37 bytes fixed length)
    - 0..3: ASCII "SPXL" (0x53 0x50 0x58 0x4C)
    - 4: Protocol Version (0x01)
    - 5..8: Big-Endian uint32 Ciphertext Length (N)
    - 9..24: PBKDF2 Salt (16 bytes)
    - 25..36: AES-GCM Nonce / IV (12 bytes)
    - 37..(37+N-1): AES-256-GCM Ciphertext + 16-byte Auth Tag
- LSB Modulation: Red, Green, and Blue channels modified at bit 0.
- Alpha Preservation: Transparency / Alpha channels are never altered.
"""

import os
import struct
import math
import io
from typing import Tuple, Dict, Any, Optional
from PIL import Image
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.exceptions import InvalidTag

# Protocol Constants
MAGIC_SIGNATURE = b"SPXL"
PROTOCOL_VERSION = 1
HEADER_LENGTH = 37  # 4 (magic) + 1 (ver) + 4 (len) + 16 (salt) + 12 (iv)
SALT_LENGTH = 16
IV_LENGTH = 12
PBKDF2_ITERATIONS = 100_000
KEY_LENGTH = 32  # 256 bits for AES-256


def derive_key(password: str, salt: bytes) -> bytes:
    """Derives a 256-bit AES key from a passphrase and salt using PBKDF2-HMAC-SHA256."""
    if not password:
        raise ValueError("Passphrase cannot be empty.")
    if len(salt) != SALT_LENGTH:
        raise ValueError(f"Salt must be exactly {SALT_LENGTH} bytes.")

    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=KEY_LENGTH,
        salt=salt,
        iterations=PBKDF2_ITERATIONS,
    )
    return kdf.derive(password.encode("utf-8"))


def encrypt_message(message: str, password: str) -> Tuple[bytes, bytes, bytes]:
    """
    Encrypts a plaintext message using AES-256-GCM.
    Returns (ciphertext_with_tag, salt, iv).
    """
    if not message:
        raise ValueError("Secret message cannot be empty.")
    if not password:
        raise ValueError("Encryption passphrase is required.")

    salt = os.urandom(SALT_LENGTH)
    iv = os.urandom(IV_LENGTH)
    key = derive_key(password, salt)

    aesgcm = AESGCM(key)
    # encrypt returns ciphertext + 16-byte auth tag appended
    ciphertext_with_tag = aesgcm.encrypt(iv, message.encode("utf-8"), None)

    return ciphertext_with_tag, salt, iv


def decrypt_message(ciphertext_with_tag: bytes, password: str, salt: bytes, iv: bytes) -> str:
    """
    Decrypts an AES-256-GCM ciphertext payload and verifies the 16-byte authentication tag.
    Raises ValueError on incorrect passphrase or tampered payload.
    """
    if not password:
        raise ValueError("Decryption passphrase is required.")
    if len(salt) != SALT_LENGTH:
        raise ValueError(f"Invalid salt length: expected {SALT_LENGTH} bytes.")
    if len(iv) != IV_LENGTH:
        raise ValueError(f"Invalid IV length: expected {IV_LENGTH} bytes.")

    key = derive_key(password, salt)
    aesgcm = AESGCM(key)

    try:
        decrypted_bytes = aesgcm.decrypt(iv, ciphertext_with_tag, None)
        return decrypted_bytes.decode("utf-8")
    except InvalidTag:
        raise ValueError("Decryption failed: Incorrect password or modified/corrupted payload.")
    except UnicodeDecodeError:
        raise ValueError("Decryption failed: Decrypted payload is not valid UTF-8 text.")


def serialize_payload(ciphertext_with_tag: bytes, salt: bytes, iv: bytes) -> bytes:
    """Serializes cryptographic artifacts into SPXL v1 deterministic binary framing."""
    cipher_len = len(ciphertext_with_tag)
    if cipher_len == 0:
        raise ValueError("Ciphertext cannot be empty.")

    # 4B magic + 1B ver + 4B cipher_len (big-endian uint32) + 16B salt + 12B iv + N bytes
    header = MAGIC_SIGNATURE + bytes([PROTOCOL_VERSION]) + struct.pack(">I", cipher_len) + salt + iv
    return header + ciphertext_with_tag


def parse_payload(payload_bytes: bytes) -> Dict[str, Any]:
    """Parses and validates an SPXL v1 binary payload."""
    if len(payload_bytes) < HEADER_LENGTH:
        raise ValueError(f"Payload too short for SPXL header (expected >= {HEADER_LENGTH} bytes).")

    magic = payload_bytes[:4]
    if magic != MAGIC_SIGNATURE:
        raise ValueError("No SecretPixel signature found in image. Image is not encoded or was altered.")

    version = payload_bytes[4]
    if version != PROTOCOL_VERSION:
        raise ValueError(f"Unsupported SPXL version: {version}. Expected version {PROTOCOL_VERSION}.")

    cipher_len = struct.unpack(">I", payload_bytes[5:9])[0]
    expected_total = HEADER_LENGTH + cipher_len
    if len(payload_bytes) < expected_total:
        raise ValueError(f"Truncated payload: expected {expected_total} bytes, got {len(payload_bytes)} bytes.")

    salt = payload_bytes[9:25]
    iv = payload_bytes[25:37]
    ciphertext_with_tag = payload_bytes[37:37 + cipher_len]

    return {
        "version": version,
        "cipher_length": cipher_len,
        "salt": salt,
        "iv": iv,
        "ciphertext_with_tag": ciphertext_with_tag,
    }


def calculate_capacity(width: int, height: int) -> Dict[str, int]:
    """Calculates image byte capacity for 1 bit/RGB channel LSB steganography."""
    total_pixels = width * height
    total_bits = total_pixels * 3  # R, G, B
    raw_bytes = total_bits // 8
    # Usable payload bytes after header (37B) and auth tag (16B)
    usable_bytes = max(0, raw_bytes - HEADER_LENGTH - 16)

    return {
        "width": width,
        "height": height,
        "totalPixels": total_pixels,
        "rawBytesCapacity": raw_bytes,
        "usablePayloadBytes": usable_bytes,
        "headerBytes": HEADER_LENGTH,
    }


def embed_payload_into_image(img: Image.Image, payload: bytes) -> Tuple[Image.Image, Dict[str, Any]]:
    """
    Embeds binary payload into image pixels using RGB LSB substitution.
    Alpha channel is strictly preserved.
    Returns (stego_image, metrics_dict).
    """
    has_alpha = img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info)
    target_mode = "RGBA" if has_alpha else "RGB"
    work_img = img.convert(target_mode)

    width, height = work_img.size
    total_pixels = width * height
    raw_capacity_bytes = (total_pixels * 3) // 8

    if len(payload) > raw_capacity_bytes:
        raise ValueError(
            f"Payload size ({len(payload)} bytes) exceeds available image capacity ({raw_capacity_bytes} bytes). "
            "Please select a larger image or reduce the message length."
        )

    # Convert image to bytearray for in-place modulation
    channels = 4 if target_mode == "RGBA" else 3
    pixel_bytes = bytearray(work_img.tobytes())
    orig_bytes = bytes(pixel_bytes)  # Keep copy for MSE/PSNR

    total_bits = len(payload) * 8
    bit_index = 0
    modified_pixels = 0
    sum_squared_error = 0

    for p in range(total_pixels):
        if bit_index >= total_bits:
            break

        offset = p * channels
        pixel_modified = False

        # Channels: 0=R, 1=G, 2=B. Channel 3 (Alpha) is never touched.
        for c in range(3):
            if bit_index >= total_bits:
                break

            byte_idx = bit_index // 8
            bit_offset = 7 - (bit_index % 8)  # MSB first
            bit = (payload[byte_idx] >> bit_offset) & 1

            current_val = pixel_bytes[offset + c]
            new_val = (current_val & 0xFE) | bit

            if new_val != current_val:
                pixel_bytes[offset + c] = new_val
                pixel_modified = True
                diff = current_val - new_val
                sum_squared_error += diff * diff

            bit_index += 1

        if pixel_modified:
            modified_pixels += 1

    # Create stego image from modified bytes
    stego_img = Image.frombytes(target_mode, (width, height), bytes(pixel_bytes))

    # Calculate metrics
    total_color_samples = total_pixels * 3
    mse = (sum_squared_error / total_color_samples) if total_color_samples > 0 else 0.0
    if mse > 0:
        psnr = 10.0 * math.log10((255.0 * 255.0) / mse)
    else:
        psnr = 99.9

    capacity_used_pct = (len(payload) / raw_capacity_bytes * 100.0) if raw_capacity_bytes > 0 else 0.0

    metrics = {
        "mse": round(mse, 4),
        "psnr": round(psnr, 2),
        "modifiedPixels": modified_pixels,
        "capacityUsedPercent": round(capacity_used_pct, 2),
        "totalBitsEmbedded": bit_index,
        "payloadSizeBytes": len(payload),
    }

    return stego_img, metrics


def extract_payload_from_image(img: Image.Image) -> bytes:
    """
    Extracts SecretPixel binary payload from image pixels.
    Validates magic signature and declared length bounds.
    """
    has_alpha = img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info)
    target_mode = "RGBA" if has_alpha else "RGB"
    work_img = img.convert(target_mode)

    width, height = work_img.size
    total_pixels = width * height
    raw_capacity_bytes = (total_pixels * 3) // 8

    if raw_capacity_bytes < HEADER_LENGTH:
        raise ValueError("Image is too small to contain a valid SecretPixel header.")

    channels = 4 if target_mode == "RGBA" else 3
    pixel_bytes = work_img.tobytes()

    # Generator for reading bits sequentially across RGB channels
    def bit_generator():
        for p in range(total_pixels):
            offset = p * channels
            for c in range(3):
                yield pixel_bytes[offset + c] & 1

    gen = bit_generator()

    def read_byte():
        val = 0
        for _ in range(8):
            val = (val << 1) | next(gen)
        return val

    # 1. Read first 4 bytes (Magic signature)
    magic = bytes(read_byte() for _ in range(4))
    if magic != MAGIC_SIGNATURE:
        raise ValueError(
            "No SecretPixel signature found in this image. Either this is not a stego-image, "
            "or the hidden bits were altered (e.g. by lossy compression)."
        )

    # 2. Read protocol version (1 byte)
    version = read_byte()
    if version != PROTOCOL_VERSION:
        raise ValueError(f"Unsupported SecretPixel payload version: {version}. Expected version {PROTOCOL_VERSION}.")

    # 3. Read ciphertext length (4 bytes uint32 big-endian)
    len_bytes = bytes(read_byte() for _ in range(4))
    cipher_len = struct.unpack(">I", len_bytes)[0]

    if cipher_len <= 0 or HEADER_LENGTH + cipher_len > raw_capacity_bytes:
        raise ValueError(
            f"Invalid or corrupted payload length declared ({cipher_len} bytes). "
            f"Image maximum capacity is {raw_capacity_bytes} bytes."
        )

    # 4. Read salt (16 bytes)
    salt = bytes(read_byte() for _ in range(16))

    # 5. Read IV (12 bytes)
    iv = bytes(read_byte() for _ in range(12))

    # 6. Read ciphertext + tag
    ciphertext_with_tag = bytes(read_byte() for _ in range(cipher_len))

    # Reconstruct full payload
    return MAGIC_SIGNATURE + bytes([version]) + len_bytes + salt + iv + ciphertext_with_tag


def hide_message_in_image(
    image_bytes: bytes,
    message: str,
    password: str
) -> Tuple[bytes, Dict[str, Any]]:
    """
    High-level API: Encrypts message with AES-256-GCM and embeds into image via LSB.
    Returns (png_bytes, metrics_dict).
    """
    # 1. Load cover image
    try:
        cover_img = Image.open(io.BytesIO(image_bytes))
    except Exception as e:
        raise ValueError(f"Failed to decode cover image: {str(e)}")

    # 2. Encrypt message with AES-256-GCM
    ciphertext_with_tag, salt, iv = encrypt_message(message, password)

    # 3. Serialize into SPXL binary framing
    payload = serialize_payload(ciphertext_with_tag, salt, iv)

    # 4. Embed into image pixels
    stego_img, metrics = embed_payload_into_image(cover_img, payload)

    # 5. Export to PNG bytes (lossless)
    output_io = io.BytesIO()
    stego_img.save(output_io, format="PNG", optimize=False)
    png_bytes = output_io.getvalue()

    metrics["outputSizeBytes"] = len(png_bytes)
    metrics["width"] = cover_img.width
    metrics["height"] = cover_img.height

    return png_bytes, metrics


def extract_message_from_image(image_bytes: bytes, password: str) -> Tuple[str, Dict[str, Any]]:
    """
    High-level API: Extracts LSB payload from image, validates SPXL header,
    and decrypts with AES-256-GCM.
    Returns (decrypted_message, details_dict).
    """
    # 1. Load stego image
    try:
        stego_img = Image.open(io.BytesIO(image_bytes))
    except Exception as e:
        raise ValueError(f"Failed to decode stego image: {str(e)}")

    # 2. Extract binary payload
    raw_payload = extract_payload_from_image(stego_img)

    # 3. Parse header and artifacts
    parsed = parse_payload(raw_payload)

    # 4. Decrypt and authenticate
    plaintext = decrypt_message(
        parsed["ciphertext_with_tag"],
        password,
        parsed["salt"],
        parsed["iv"]
    )

    details = {
        "version": parsed["version"],
        "cipherLength": parsed["cipher_length"],
        "saltHex": parsed["salt"].hex(),
        "ivHex": parsed["iv"].hex(),
        "tagHex": parsed["ciphertext_with_tag"][-16:].hex(),
        "width": stego_img.width,
        "height": stego_img.height,
    }

    return plaintext, details
