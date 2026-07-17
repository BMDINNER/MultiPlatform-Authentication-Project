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

const forgotPasswordHTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Forgot Password</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
      background: #f0f2f5;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 16px;
      padding: 48px 40px;
      max-width: 420px;
      width: 100%;
      box-shadow: 0 8px 32px rgba(0,0,0,0.08);
    }
    .logo {
      text-align: center;
      margin-bottom: 32px;
    }
    .logo h1 {
      font-size: 24px;
      font-weight: 700;
      color: #1a1a2e;
    }
    .logo p {
      color: #6b7280;
      font-size: 14px;
      margin-top: 4px;
    }
    .logo .icon {
      font-size: 36px;
      display: block;
      margin-bottom: 8px;
    }
    .form-group {
      margin-bottom: 16px;
    }
    label {
      display: block;
      font-size: 13px;
      font-weight: 500;
      color: #374151;
      margin-bottom: 6px;
    }
    input {
      width: 100%;
      padding: 12px 16px;
      border: 1.5px solid #e5e7eb;
      border-radius: 10px;
      font-size: 14px;
      transition: border-color 0.2s;
      background: white;
    }
    input:focus {
      outline: none;
      border-color: #4f46e5;
      box-shadow: 0 0 0 3px rgba(79,70,229,0.1);
    }
    button {
      width: 100%;
      padding: 14px;
      background: #4f46e5;
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    button:hover {
      background: #4338ca;
    }
    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .alert {
      padding: 12px 16px;
      border-radius: 10px;
      font-size: 14px;
      margin-bottom: 16px;
    }
    .alert-success {
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
    }
    .alert-error {
      background: #fef2f2;
      color: #991b1b;
      border: 1px solid #fca5a5;
    }
    .footer {
      text-align: center;
      margin-top: 24px;
      font-size: 13px;
      color: #9ca3af;
    }
    .footer a {
      color: #4f46e5;
      text-decoration: none;
    }
    .footer a:hover {
      text-decoration: underline;
    }
    .hidden {
      display: none !important;
    }
    .spinner {
      display: inline-block;
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
      margin-right: 8px;
      vertical-align: middle;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    @media (max-width: 480px) {
      .container {
        padding: 32px 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container" id="app">
    <div class="logo">
      <span class="icon">&#128273;</span>
      <h1>Forgot Password</h1>
      <p>Enter your email to reset your password</p>
    </div>

    <div id="successMessage" class="hidden alert alert-success">
      <strong>Check Your Email</strong>
      <p id="successEmail">We've sent a password reset link to your email.</p>
    </div>

    <div id="errorMessage" class="hidden alert alert-error"></div>

    <form id="forgotForm">
      <div class="form-group">
        <label for="email">Email address</label>
        <input type="email" id="email" placeholder="you@example.com" required>
      </div>
      <button type="submit" id="submitBtn">Send Reset Link</button>
    </form>
  </div>

  <script>
    document.getElementById('forgotForm').addEventListener('submit', function(e) {
      e.preventDefault();
      
      var email = document.getElementById('email').value;
      var submitBtn = document.getElementById('submitBtn');
      var formError = document.getElementById('errorMessage');
      var successMessage = document.getElementById('successMessage');
      var forgotForm = document.getElementById('forgotForm');

      formError.classList.add('hidden');
      successMessage.classList.add('hidden');

      if (!email) {
        formError.textContent = 'Email is required';
        formError.classList.remove('hidden');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner"></span> Sending...';

      fetch('/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email })
      })
      .then(function(response) {
        return response.json();
      })
      .then(function(data) {
        if (data.success) {
          forgotForm.style.display = 'none';
          successMessage.classList.remove('hidden');
          document.getElementById('successEmail').textContent = 'We\'ve sent a password reset link to ' + email + '.';
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'Send Reset Link';
        } else {
          formError.textContent = data.message || 'Failed to send reset email';
          formError.classList.remove('hidden');
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'Send Reset Link';
        }
      })
      .catch(function(error) {
        formError.textContent = 'Something went wrong. Please try again.';
        formError.classList.remove('hidden');
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Send Reset Link';
      });
    });
  </script>
</body>
</html>`;

const resetPasswordHTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Password</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
      background: #f0f2f5;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 16px;
      padding: 48px 40px;
      max-width: 420px;
      width: 100%;
      box-shadow: 0 8px 32px rgba(0,0,0,0.08);
    }
    .logo {
      text-align: center;
      margin-bottom: 32px;
    }
    .logo h1 {
      font-size: 24px;
      font-weight: 700;
      color: #1a1a2e;
    }
    .logo p {
      color: #6b7280;
      font-size: 14px;
      margin-top: 4px;
    }
    .logo .icon {
      font-size: 36px;
      display: block;
      margin-bottom: 8px;
    }
    .form-group {
      margin-bottom: 16px;
    }
    label {
      display: block;
      font-size: 13px;
      font-weight: 500;
      color: #374151;
      margin-bottom: 6px;
    }
    input {
      width: 100%;
      padding: 12px 16px;
      border: 1.5px solid #e5e7eb;
      border-radius: 10px;
      font-size: 14px;
      transition: border-color 0.2s;
      background: white;
    }
    input:focus {
      outline: none;
      border-color: #4f46e5;
      box-shadow: 0 0 0 3px rgba(79,70,229,0.1);
    }
    button {
      width: 100%;
      padding: 14px;
      background: #4f46e5;
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    button:hover {
      background: #4338ca;
    }
    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .alert {
      padding: 12px 16px;
      border-radius: 10px;
      font-size: 14px;
      margin-bottom: 16px;
    }
    .alert-success {
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
    }
    .alert-error {
      background: #fef2f2;
      color: #991b1b;
      border: 1px solid #fca5a5;
    }
    .footer {
      text-align: center;
      margin-top: 24px;
      font-size: 13px;
      color: #9ca3af;
    }
    .footer a {
      color: #4f46e5;
      text-decoration: none;
    }
    .footer a:hover {
      text-decoration: underline;
    }
    .hidden {
      display: none !important;
    }
    .spinner {
      display: inline-block;
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
      margin-right: 8px;
      vertical-align: middle;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .check-icon {
      font-size: 48px;
      text-align: center;
      display: block;
      margin-bottom: 16px;
    }
    @media (max-width: 480px) {
      .container {
        padding: 32px 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container" id="app">
    <div class="logo">
      <span class="icon">&#128273;</span>
      <h1>Reset Password</h1>
      <p>Enter your new password below</p>
    </div>

    <div id="successMessage" class="hidden">
      <span class="check-icon">&#10004;</span>
      <h2>Password Reset Successful</h2>
      <p class="subtitle" style="color:#6b7280;font-size:14px;margin-bottom:24px;">Your password has been reset. You can now log in with your new password.</p>
    </div>

    <div id="errorMessage" class="hidden alert alert-error"></div>

    <form id="resetForm">
      <input type="hidden" id="token" value="">
      <div class="form-group">
        <label for="newPassword">New Password</label>
        <input type="password" id="newPassword" placeholder="Enter new password" required minlength="6">
      </div>
      <div class="form-group">
        <label for="confirmPassword">Confirm Password</label>
        <input type="password" id="confirmPassword" placeholder="Confirm new password" required minlength="6">
      </div>
      <button type="submit" id="submitBtn">Reset Password</button>
    </form>
  </div>

  <script>
    var urlParams = new URLSearchParams(window.location.search);
    var token = urlParams.get('token') || '';
    document.getElementById('token').value = token;

    document.getElementById('resetForm').addEventListener('submit', function(e) {
      e.preventDefault();
      
      var newPassword = document.getElementById('newPassword').value;
      var confirmPassword = document.getElementById('confirmPassword').value;
      var submitBtn = document.getElementById('submitBtn');
      var formError = document.getElementById('errorMessage');
      var successMessage = document.getElementById('successMessage');
      var resetForm = document.getElementById('resetForm');

      formError.classList.add('hidden');
      successMessage.classList.add('hidden');

      if (newPassword.length < 6) {
        formError.textContent = 'Password must be at least 6 characters';
        formError.classList.remove('hidden');
        return;
      }

      if (newPassword !== confirmPassword) {
        formError.textContent = 'Passwords do not match';
        formError.classList.remove('hidden');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner"></span> Resetting...';

      fetch('/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token, newPassword: newPassword })
      })
      .then(function(response) {
        return response.json();
      })
      .then(function(data) {
        if (data.success) {
          resetForm.style.display = 'none';
          successMessage.classList.remove('hidden');
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'Reset Password';
        } else {
          formError.textContent = data.message || 'Failed to reset password';
          formError.classList.remove('hidden');
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'Reset Password';
        }
      })
      .catch(function(error) {
        formError.textContent = 'Something went wrong. Please try again.';
        formError.classList.remove('hidden');
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Reset Password';
      });
    });

    if (!token) {
      document.getElementById('resetForm').innerHTML = 
        '<div class="alert alert-error">Invalid or missing reset token. Please request a new password reset link.</div>';
    }
  </script>
</body>
</html>`;

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      styleSrcElem: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'"],
      imgSrc: ["'self'", "data:"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'"],
      frameSrc: ["'self'"],
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
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

app.get('/forgot-password', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Content-Type', 'text/html');
  res.send(forgotPasswordHTML);
});

app.get('/reset-password', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Content-Type', 'text/html');
  res.send(resetPasswordHTML);
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