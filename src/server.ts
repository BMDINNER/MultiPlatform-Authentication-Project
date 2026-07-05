import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/index.js';
import authRoutes from './routes/auth-routes.js';
import oauthRoutes from './routes/oauth-routes.js';
import tokenRoutes from './routes/token-routes.js';
import passport from './config/passport.js';

const app = express();

app.use(helmet());

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3005',
  'http://localhost:3001',
  process.env.CLIENT_URL
].filter(Boolean);

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

app.listen(config.port, () => {
  console.log(`Auth service running on port ${config.port}`);
});

export default app;