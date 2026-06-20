import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/index.js';
import authRoutes from './routes/auth-routes.js';
import oauthRoutes from './routes/oauth-routes.js';
import passport from './config/passport.js';

const app = express();

app.use(helmet());
app.use(cors({
  origin: config.clientUrl,
  credentials: true
}));
app.use(express.json());
app.use(passport.initialize());

app.use('/auth', authRoutes);
app.use('/auth/oauth', oauthRoutes);

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