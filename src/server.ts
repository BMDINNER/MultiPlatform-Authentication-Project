import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/index.js';
import authRoutes from './routes/auth-routes.js';
import oauthRoutes from './routes/oauth-routes.js';
import tokenRoutes from './routes/token-routes.js';
import passport from './config/passport.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', 1);

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3005',
  'http://localhost:3001',
  'https://snippet-frontend.onrender.com',
  'https://hospital-frontend.onrender.com',
  'https://snippet-frontend-ujc2.onrender.com',
  'https://auth-service.onrender.com',
  'https://snippet-backend.onrender.com',
  'https://snippet-backend-9lt3.onrender.com',
  'https://hospital-backend.onrender.com',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  strictTransportSecurity: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  xFrameOptions: { action: "deny" },
  xssFilter: true,
  noSniff: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
}));

app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    `default-src 'self'; ` +
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; ` +
    `style-src-elem 'self' https://fonts.googleapis.com; ` +
    `font-src 'self' https://fonts.gstatic.com; ` +
    `img-src 'self' data: https:; ` +
    `script-src 'self' 'unsafe-inline'; ` +
    `connect-src 'self'; ` +
    `frame-src 'self'; ` +
    `frame-ancestors 'none'; ` +
    `object-src 'none'; ` +
    `base-uri 'self'; ` +
    `form-action 'self'; ` +
    `upgrade-insecure-requests`
  );
  next();
});

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('Blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'x-api-key', 'x-project-id']
}));

app.use(express.json());
app.use(passport.initialize());

app.use((req, res, next) => {
  if (req.path === '/forgot-password' || req.path === '/reset-password') {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});

app.use(express.static(path.join(__dirname, '../public')));

app.get('/forgot-password', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'forgot-password.html'));
});

app.get('/reset-password', (req, res) => {
  const token = req.query.token || '';
  res.sendFile(path.join(__dirname, '../public', 'reset-password.html'));
});

app.use('/auth', authRoutes);
app.use('/auth/oauth', oauthRoutes);
app.use('/auth/token', tokenRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Auth service running on port ${PORT}`);
});

export default app;