# SecretPixel: AES-Based Image Steganography Operations Console

> **Field:** Cryptography & Network Security, Information Hiding, Steganalysis Resistance  
> **Cipher Suite:** AES-256-GCM (Authenticated Encryption with Galois/Counter Mode)  
> **Key Derivation:** PBKDF2 with HMAC-SHA-256 (100,000 iterations, 128-bit hardware salt)  
> **Carrier Protocol:** Spatial 24-bit RGB Least Significant Bit (LSB) Substitution (SPXL v1)  
> **Execution Model:** 100% In-Browser Local Enclave (Web Crypto API + Canvas 2D) & Optional Node.js Express API  

---

## 1. Project Overview

**SecretPixel** is an academic-grade cybersecurity operations console demonstrating dual-layer defense-in-depth for confidential text communication.

1. **Layer 1 — Mathematical Confidentiality & Integrity (AES-256-GCM):**  
   Plaintext messages are encrypted using 256-bit AES keys derived via 100,000 PBKDF2 iterations. An integrated 128-bit authentication tag guarantees that any modification in transit immediately triggers an authentication failure before any plaintext can be revealed.

2. **Layer 2 — Spatial Steganographic Concealment (LSB Substitution):**  
   The resulting binary payload is embedded into the Least Significant Bit (Bit 0) of the Red, Green, and Blue color channels of a raster image. The Alpha channel is strictly preserved to prevent visual transparency artifacts. The resulting stego-image achieves a Peak Signal-to-Noise Ratio (PSNR) greater than 65 dB and Mean Squared Error (MSE) below 0.05, rendering the presence of the payload imperceptible to human observers.

3. **Zero-Trust Privacy & Local In-Memory Processing:**  
   All cryptographic operations execute locally in the client browser using the native `window.crypto.subtle` API. Passwords, derived keys, and secret messages are never transmitted over network sockets or written to persistent local storage.

---

## 2. Architecture & Data Flow

### Sender Pipeline (Hide Message)

```
[Plaintext Secret Message] (UTF-8)
          │
          ▼
[PBKDF2 Key Derivation] ──> (Passphrase + 16-Byte CSPRNG Salt, 100,000 SHA-256 rounds) ──> 256-Bit AES Key
          │
          ▼
[AES-256-GCM Encryption] ──> (Plaintext + 12-Byte CSPRNG IV + 128-Bit Auth Tag) ──> Ciphertext + Tag
          │
          ▼
[SPXL v1 Binary Assembly] ──> Framing: [Magic "SPXL" (4B) | Version (1B) | CipherLen (4B) | Salt (16B) | IV (12B) | Ciphertext (NB)]
          │
          ▼
[Capacity Check] ───────────> Verify: Total Payload Bytes <= floor(Width * Height * 3 / 8)
          │
          ▼
[LSB Modulation] ───────────> Embed into Bit 0 of R, G, B channels (Alpha channel untouched)
          │
          ▼
[Lossless PNG Generation] ──> Export authentic PNG via HTML5 Canvas (Preserves LSBs bit-for-bit)
```

### Receiver Pipeline (Extract Message)

```
[Uploaded Stego-Image (PNG)]
          │
          ▼
[Canvas Pixel Buffer Access] ──> Extract RGBA pixel data array via getImageData()
          │
          ▼
[SPXL Header Validation] ──────> Read first 37 bytes from Bit 0 bitstream:
                                  1. Verify Magic Signature == "SPXL" (0x5350584C)
                                  2. Verify Protocol Version == 0x01
                                  3. Read Big-Endian Ciphertext Length N
                                  4. Extract 16-Byte Salt & 12-Byte IV
          │
          ▼
[Payload Extraction] ──────────> Extract exactly N bytes of Ciphertext + 128-bit Tag
          │
          ▼
[PBKDF2 Key Re-derivation] ────> Recompute 256-Bit Key from User Passphrase + Extracted Salt
          │
          ▼
[AES-256-GCM Decryption] ──────> Verify 128-Bit Authentication Tag:
                                  - Tag Match: Output decoded UTF-8 Plaintext
                                  - Tag Mismatch: Abort cleanly, throw authentication error (no plaintext leak)
```

---

## 3. SPXL Binary Payload Specification (v1)

The steganographic carrier stores a versioned, self-contained binary payload without requiring an external database:

| Offset (Bytes) | Field Name | Length | Type | Description |
|---|---|---|---|---|
| `0..3` | Magic Signature | 4 bytes | Byte Array | ASCII `"SPXL"` (`0x53, 0x50, 0x58, 0x4C`) |
| `4` | Protocol Version | 1 byte | uint8 | Version identifier (`0x01` = SPXL v1) |
| `5..8` | Ciphertext Length | 4 bytes | uint32 (BE) | Big-Endian byte length $N$ of ciphertext + tag |
| `9..24` | PBKDF2 Salt | 16 bytes | Byte Array | 128-bit cryptographically secure random salt |
| `25..36` | Initialization Vector | 12 bytes | Byte Array | 96-bit AES-GCM random nonce |
| `37..(37 + N - 1)` | Ciphertext + Tag | $N$ bytes | Byte Array | AES-256-GCM ciphertext ending with 16-byte authentication tag |

- **Fixed Header Length:** 37 bytes  
- **Byte Order:** Network Byte Order (Big-Endian)  
- **Integrity Guarantee:** Tag covers ciphertext and is cryptographically tied to the unique IV and Salt.

---

## 4. Capacity Calculation Engine

The theoretical and usable capacity formulas are:

$$\text{Raw Bit Capacity} = \text{Width} \times \text{Height} \times 3 \text{ bits}$$

$$\text{Raw Byte Capacity} = \left\lfloor \frac{\text{Width} \times \text{Height} \times 3}{8} \right\rfloor \text{ bytes}$$

$$\text{Usable Payload Capacity} = \max(0, \text{Raw Byte Capacity} - 37) \text{ bytes}$$

$$\text{Maximum Plaintext Capacity} = \max(0, \text{Usable Payload Capacity} - 16) \text{ bytes}$$

### Sample Capacity Matrix

| Resolution | Total Pixels | Raw Capacity | Usable Payload | Max Plaintext |
|---|---|---|---|---|
| 320 × 240 | 76,800 | 28,800 B (~28.1 KB) | 28,763 B | 28,747 B |
| 640 × 480 | 307,200 | 115,200 B (~112.5 KB) | 115,163 B | 115,147 B |
| 800 × 600 | 480,000 | 180,000 B (~175.7 KB) | 179,963 B | 179,947 B |
| 1920 × 1080 | 2,073,600 | 777,600 B (~759.3 KB) | 777,563 B | 777,547 B |

*Note: Text size is calculated in UTF-8 bytes (`TextEncoder`), ensuring multi-byte Unicode characters and emojis are measured accurately.*

---

## 5. Project Structure & Modular Services

```
├── server.ts                       # Node.js Express API & dev server mounting Vite
├── src/
│   ├── services/
│   │   ├── cryptoService.ts        # PBKDF2 derivation, AES-GCM encryption/decryption
│   │   ├── payloadService.ts       # SPXL binary framing serialization & bounds checking
│   │   ├── capacityService.ts      # Capacity math, UTF-8 sizing, overflow evaluation
│   │   ├── steganographyService.ts # LSB embedding, extraction, MSE & PSNR calculations
│   │   ├── imageService.ts         # Canvas loading, PNG generation, bit-plane decomposition
│   │   ├── verificationService.ts  # In-browser deterministic test suite (SEC-01 to SEC-10)
│   │   ├── activityService.ts      # Privacy-preserving in-memory session logging
│   │   └── apiService.ts           # Optional backend communication with offline fallback
│   ├── components/
│   │   ├── HideWorkspace.tsx       # Sender Studio: live capacity, encryption, image download
│   │   ├── ExtractWorkspace.tsx    # Receiver Console: extraction, tag verification, decryption
│   │   ├── SecurityTestingTable.tsx# Verification Matrix: live test suite runner
│   │   ├── ImageUploader.tsx       # Image drag-and-drop & file validation
│   │   ├── ImageComparisonViewer.tsx# Slider comparison between cover and stego images
│   │   ├── MediaSection.tsx        # Video walkthrough & Web Audio synthesizer
│   │   ├── AboutSection.tsx        # System specifications
│   │   ├── RegistrationForm.tsx    # Operator clearance registration form
│   │   └── views/
│   │       ├── OverviewView.tsx    # Operations dashboard with live metrics
│   │       ├── BitInspectorView.tsx# Spatial bit plane & RGB channel visualizer
│   │       └── SettingsView.tsx    # Cryptographic params & backend API health ping
│   ├── context/
│   │   └── SecurityContext.tsx     # In-memory reactive state management
│   └── tests/
│       └── suite.ts                # Standalone Node.js automated test runner (37 tests)
```

---

## 6. How to Install and Run Locally

### Prerequisites
- Node.js 20+ (Node.js 22 recommended)
- npm 10+

### Installation
```bash
# Clone the repository
git clone https://github.com/khushikoli21/SecretPixel.git
cd SecretPixel

# Install dependencies
npm install
```

### Running Locally (Development Mode)
```bash
# Starts Express backend and mounts Vite on http://0.0.0.0:3000
npm run dev
```

Visit `http://localhost:3000` in your browser.

### Running the Automated Test Suite
```bash
# Executes all 37 automated tests across Cryptography, Steganography, Framing & Capacity
npm test
```

### Type Checking & Linting
```bash
npm run lint
```

### Building for Production
```bash
npm run build
```

---

## 7. Deployment Instructions

### A. Static Deployment (GitHub Pages)

The SecretPixel frontend is fully compatible with GitHub Pages and static web hosting:
1. All encryption, key derivation, and image manipulation execute client-side.
2. Build the static assets:
   ```bash
   npm run build
   ```
3. Deploy the resulting `dist/` directory to GitHub Pages.
4. The application detects the absence of the backend API and automatically operates in **Client-Only Mode (Offline Enclave)** without errors.

### B. Full-Stack Node.js Deployment (Docker / Cloud Run / VPS)

To deploy with the Express API:
```bash
# Set environment variables (optional)
export PORT=3000
export NODE_ENV=production

# Build frontend bundle
npm run build

# Start production Express server
npm run start
```

Available API Endpoints:
- `GET /api/health` — Returns JSON health status, version, and server uptime.
- `GET /api/info` — Returns cryptographic protocols, parameters, and capabilities.

---

## 8. Database Architecture & Supabase PostgreSQL Integration

SecretPixel includes an optional, production-conscious **PostgreSQL database layer** via **Supabase**.

### A. Strict Data Privacy Directives
The database strictly serves application-level preferences and operational summaries.
- **NEVER Stored:** Secret plaintext messages, passwords, encryption keys, complete ciphertext payloads, or raw images.
- **Permitted Stored Metadata:** User profiles, interface preferences (theme, format), and non-sensitive operation summaries (timestamp, width, height, format, duration, payload byte size).

### B. PostgreSQL Schema & Relationships

1. **`profiles` Table:**
   - `id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE`
   - `display_name TEXT`
   - `clearance_level TEXT CHECK (clearance_level IN ('Confidential', 'Secret', 'Top Secret'))`
   - `created_at TIMESTAMPTZ`, `updated_at TIMESTAMPTZ`

2. **`user_preferences` Table:**
   - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
   - `user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE`
   - `theme TEXT CHECK (theme IN ('light', 'dark', 'system'))`
   - `default_output_format TEXT CHECK (default_output_format = 'PNG')`
   - `save_operation_history BOOLEAN DEFAULT false`
   - `created_at TIMESTAMPTZ`, `updated_at TIMESTAMPTZ`

3. **`operation_history` Table:**
   - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
   - `user_id UUID REFERENCES profiles(id) ON DELETE CASCADE`
   - `operation_type TEXT CHECK (operation_type IN ('encode', 'extract', 'decrypt', 'verify'))`
   - `status TEXT CHECK (status IN ('success', 'failed', 'cancelled'))`
   - `image_width INTEGER`, `image_height INTEGER`, `image_format TEXT`
   - `payload_size_bytes INTEGER`, `processing_duration_ms INTEGER`
   - `created_at TIMESTAMPTZ`

4. **`app_settings` Table:**
   - `key TEXT PRIMARY KEY`
   - `value JSONB NOT NULL`
   - `updated_at TIMESTAMPTZ`

### C. Row Level Security (RLS) Policies
Every user-specific table has RLS strictly enabled:
- **`profiles`:** Users can read and update only their own profile (`auth.uid() = id`).
- **`user_preferences`:** Users can read, create, update, and delete only their own preferences (`auth.uid() = user_id`).
- **`operation_history`:** Users can read, insert, and delete only their own records (`auth.uid() = user_id`). Users cannot access or view another operator's history.
- **`app_settings`:** Public read access (`SELECT`) enabled for anon/authenticated roles; writes restricted exclusively to `service_role`.

### D. Applying Database Migrations

SQL migration files are located under `supabase/migrations/`:
- `001_create_secretpixel_schema.sql` — Tables, foreign keys, check constraints, and triggers.
- `002_enable_row_level_security.sql` — RLS activation and user isolation policies.
- `003_seed_development_data.sql` — Development seeds containing non-sensitive protocol metadata.

To apply migrations to your Supabase project:
```bash
# Using Supabase CLI
supabase db push

# Or execute the SQL migrations directly in the Supabase Dashboard SQL Editor
```

### E. Environment Configuration
Add your Supabase project credentials to `.env`:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-publishable-key
```
*Note: If unconfigured, the application automatically runs in **Local Offline Enclave Mode** with local in-memory/browser-storage fallback without errors.*

---

## 9. Privacy, Threat Model & Known Limitations

### Privacy Guarantees
- **No Remote Storage:** Cover images, stego-images, plaintexts, and passwords never leave the user's browser.
- **Zero Telemetry:** No external analytics, logging trackers, or third-party tracking scripts.
- **Ephemeral Session Memory:** Clearing the workspace flushes all transient image buffers and secret strings.

### Known Limitations of LSB Steganography
- **Lossy Compression Vulnerability:** JPEG compression, social media image recompression (WhatsApp, Twitter/X, Discord), or screenshot tools discard LSBs. **Stego-images must always be transmitted as lossless PNG files.**
- **Geometric Transformations:** Cropping, resizing, rotating, or filtering the stego-image modifies pixel coordinates and destroys the embedded bitstream.
- **Statistical Steganalysis:** High payloads (embedding across >30% of pixels) can alter chi-square color histograms. Keep payload sizes modest relative to the image resolution.
- **Password Dependence:** AES-GCM guarantees confidentiality, but data cannot be recovered if the user forgets their passphrase. SecretPixel has no backdoors or key escrow.
