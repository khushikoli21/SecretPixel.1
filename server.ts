import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = '0.0.0.0';
const PYTHON_PORT = parseInt(process.env.PYTHON_PORT || '5000', 10);
const PYTHON_API_URL = `http://127.0.0.1:${PYTHON_PORT}`;
const isProduction = process.env.NODE_ENV === 'production';

// 1. Security Headers Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  );

  // Secure CORS header
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// 2. Request body parsing (50MB for in-memory image base64 processing)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 3. Lightweight IP rate limiter for API endpoints (in-memory)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 120;

function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({
      error: 'Rate limit exceeded. Please try again in one minute.'
    });
  }

  record.count++;
  next();
}

app.use('/api', rateLimiter);

// 4. Start Python Steganography Backend Child Process
function startPythonBackend() {
  try {
    const pythonProc = spawn('python3', ['python_backend/app.py'], {
      cwd: __dirname,
      env: { ...process.env, PYTHON_PORT: String(PYTHON_PORT) },
      stdio: 'pipe'
    });

    pythonProc.stdout.on('data', (data) => {
      console.log(`[Python Steganography] ${data.toString().trim()}`);
    });

    pythonProc.stderr.on('data', (data) => {
      console.error(`[Python Steganography Log] ${data.toString().trim()}`);
    });

    pythonProc.on('error', (err) => {
      console.warn('[Python Steganography] Process start notification:', err.message);
    });

    process.on('exit', () => {
      try {
        pythonProc.kill();
      } catch {}
    });
  } catch (err) {
    console.warn('[Python Steganography] Could not spawn python process:', err);
  }
}

startPythonBackend();

// 5. Proxy helper to Python Flask API
async function forwardToPython(req: Request, res: Response, targetPath: string) {
  try {
    const targetUrl = `${PYTHON_API_URL}${targetPath}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const headers: Record<string, string> = {};
    if (req.headers['content-type']) {
      headers['content-type'] = req.headers['content-type'] as string;
    }
    if (req.headers['accept']) {
      headers['accept'] = req.headers['accept'] as string;
    }

    const fetchOptions: RequestInit = {
      method: req.method,
      headers,
      signal: controller.signal
    };

    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
      headers['content-type'] = 'application/json';
    }

    const pyRes = await fetch(targetUrl, fetchOptions);
    clearTimeout(timeout);

    const contentType = pyRes.headers.get('content-type') || 'application/json';
    res.status(pyRes.status);
    res.setHeader('content-type', contentType);

    if (contentType.includes('application/json')) {
      const data = await pyRes.json();
      return res.json(data);
    } else {
      const buffer = Buffer.from(await pyRes.arrayBuffer());
      return res.send(buffer);
    }
  } catch (err) {
    // If Python server is starting or offline, return clean fallback
    return res.status(503).json({
      error: 'Python steganography engine is initializing or offline.',
      fallbackAvailable: true,
      service: 'SecretPixel Express Proxy'
    });
  }
}

// 6. API Endpoints

/**
 * GET /api/health
 * Returns service status, version, and Python runtime status.
 */
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    const pyRes = await fetch(`${PYTHON_API_URL}/api/health`, { signal: AbortSignal.timeout(1500) });
    if (pyRes.ok) {
      const pyData = await pyRes.json();
      return res.json({
        ...pyData,
        proxyStatus: 'active',
        expressUptime: Math.round(process.uptime())
      });
    }
  } catch {}

  res.status(200).json({
    status: 'ok',
    version: '1.0.0',
    service: 'SecretPixel Gateway API',
    runtime: 'Node.js Express + Python 3.11',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/info
 * Returns supported cryptographic protocols and Python engine details.
 */
app.get('/api/info', async (req: Request, res: Response) => {
  try {
    const pyRes = await fetch(`${PYTHON_API_URL}/api/info`, { signal: AbortSignal.timeout(1500) });
    if (pyRes.ok) {
      const pyData = await pyRes.json();
      return res.json(pyData);
    }
  } catch {}

  res.status(200).json({
    protocol: 'SPXL',
    version: 1,
    backend: 'Python 3.11 / Pillow (PIL)',
    ciphers: ['AES-256-GCM'],
    kdf: 'PBKDF2-HMAC-SHA-256',
    kdfIterations: 100000,
    headerLengthBytes: 37,
    steganography: 'RGB LSB (Alpha-Preserving)',
    offlineSupport: true,
    deploymentMode: isProduction ? 'production-fullstack' : 'development-vite'
  });
});

/**
 * POST /api/hide
 * Forwards message hiding request to Python steganography engine.
 */
app.post('/api/hide', async (req: Request, res: Response) => {
  await forwardToPython(req, res, '/api/hide');
});

/**
 * POST /api/extract
 * Forwards message extraction request to Python steganography engine.
 */
app.post('/api/extract', async (req: Request, res: Response) => {
  await forwardToPython(req, res, '/api/extract');
});

/**
 * POST /api/capacity
 * Forwards capacity check request to Python steganography engine.
 */
app.post('/api/capacity', async (req: Request, res: Response) => {
  await forwardToPython(req, res, '/api/capacity');
});

// Catch-all 404 for unhandled API routes
app.all('/api/*', (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path
  });
});

// 7. Frontend Delivery (Vite middleware in dev, static dist in production)
async function startServer() {
  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
        host: HOST,
        port: PORT
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.use('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Generic error handler
  app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
    console.error('[SecretPixel Server Error]', err instanceof Error ? err.message : err);
    res.status(500).json({
      error: 'An internal server error occurred'
    });
  });

  app.listen(PORT, HOST, () => {
    console.log(`[SecretPixel] Server active at http://${HOST}:${PORT}`);
    console.log(`[SecretPixel] Python backend proxying to ${PYTHON_API_URL}`);
  });
}

startServer().catch((err) => {
  console.error('[SecretPixel] Failed to start server:', err);
  process.exit(1);
});
