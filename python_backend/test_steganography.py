"""
Unit and integration tests for SecretPixel Python Steganography engine.
"""

import unittest
import io
from PIL import Image
from python_backend.steganography import (
    encrypt_message,
    decrypt_message,
    serialize_payload,
    parse_payload,
    calculate_capacity,
    embed_payload_into_image,
    extract_payload_from_image,
    hide_message_in_image,
    extract_message_from_image,
    HEADER_LENGTH,
)


class TestSecretPixelSteganography(unittest.TestCase):

    def setUp(self):
        # Create a sample test image (100x100 RGB)
        self.test_img = Image.new("RGB", (100, 100), color=(120, 130, 140))
        img_byte_arr = io.BytesIO()
        self.test_img.save(img_byte_arr, format="PNG")
        self.image_bytes = img_byte_arr.getvalue()
        self.secret_message = "TOP SECRET: Classified operation payload for CNS microproject 2026."
        self.passphrase = "CorrectHorseBatteryStaple!2026"

    def test_crypto_roundtrip(self):
        """Test AES-256-GCM encryption and authenticated decryption."""
        ciphertext, salt, iv = encrypt_message(self.secret_message, self.passphrase)
        self.assertGreater(len(ciphertext), len(self.secret_message))
        self.assertEqual(len(salt), 16)
        self.assertEqual(len(iv), 12)

        recovered = decrypt_message(ciphertext, self.passphrase, salt, iv)
        self.assertEqual(recovered, self.secret_message)

    def test_crypto_wrong_password_fails(self):
        """Test that wrong passphrase raises ValueError due to AES-GCM tag mismatch."""
        ciphertext, salt, iv = encrypt_message(self.secret_message, self.passphrase)
        with self.assertRaises(ValueError) as ctx:
            decrypt_message(ciphertext, "WrongPassword123!", salt, iv)
        self.assertIn("Incorrect password", str(ctx.exception))

    def test_crypto_tampered_ciphertext_fails(self):
        """Test that tampered ciphertext triggers authentication failure."""
        ciphertext, salt, iv = encrypt_message(self.secret_message, self.passphrase)
        # Flip a bit in the ciphertext
        tampered = bytearray(ciphertext)
        tampered[0] ^= 0x01
        with self.assertRaises(ValueError):
            decrypt_message(bytes(tampered), self.passphrase, salt, iv)

    def test_capacity_calculation(self):
        """Test capacity boundaries."""
        cap = calculate_capacity(100, 100)
        self.assertEqual(cap["totalPixels"], 10000)
        self.assertEqual(cap["rawBytesCapacity"], (10000 * 3) // 8)  # 3750 bytes
        self.assertGreater(cap["usablePayloadBytes"], 3600)

    def test_full_hide_and_extract_roundtrip(self):
        """Test full pipeline: cover image + message + password -> stego PNG -> extract plaintext."""
        stego_png_bytes, metrics = hide_message_in_image(
            self.image_bytes,
            self.secret_message,
            self.passphrase
        )

        self.assertIsNotNone(stego_png_bytes)
        self.assertGreater(metrics["psnr"], 60.0)  # Stego imperceptibility PSNR > 60 dB
        self.assertGreater(metrics["modifiedPixels"], 0)

        # Extract
        recovered, details = extract_message_from_image(stego_png_bytes, self.passphrase)
        self.assertEqual(recovered, self.secret_message)
        self.assertEqual(details["version"], 1)

    def test_extract_with_wrong_password(self):
        """Test that extraction with incorrect passphrase fails securely."""
        stego_png_bytes, _ = hide_message_in_image(
            self.image_bytes,
            self.secret_message,
            self.passphrase
        )
        with self.assertRaises(ValueError) as ctx:
            extract_message_from_image(stego_png_bytes, "IncorrectPassword!!")
        self.assertIn("Incorrect password", str(ctx.exception))

    def test_extract_from_clean_image_fails(self):
        """Test that attempting to extract from an unencoded image fails with signature error."""
        with self.assertRaises(ValueError) as ctx:
            extract_message_from_image(self.image_bytes, self.passphrase)
        self.assertIn("No SecretPixel signature found", str(ctx.exception))

    def test_rgba_alpha_preservation(self):
        """Test that transparent RGBA images preserve alpha perfectly."""
        rgba_img = Image.new("RGBA", (50, 50), color=(100, 150, 200, 128))
        buf = io.BytesIO()
        rgba_img.save(buf, format="PNG")
        rgba_bytes = buf.getvalue()

        stego_bytes, _ = hide_message_in_image(rgba_bytes, "Alpha test", self.passphrase)
        out_img = Image.open(io.BytesIO(stego_bytes))
        self.assertEqual(out_img.mode, "RGBA")
        # Check that alpha values are untouched
        orig_alpha = [rgba_img.getpixel((x, y))[3] for x in range(50) for y in range(50)]
        stego_alpha = [out_img.getpixel((x, y))[3] for x in range(50) for y in range(50)]
        self.assertEqual(orig_alpha, stego_alpha)

        # And message should still extract
        recovered, _ = extract_message_from_image(stego_bytes, self.passphrase)
        self.assertEqual(recovered, "Alpha test")


if __name__ == "__main__":
    unittest.main()
