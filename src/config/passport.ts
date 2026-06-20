import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy, Profile as GitHubProfile } from 'passport-github2';
import { Strategy as MicrosoftStrategy } from 'passport-microsoft';
import { config } from './index.js';
import { VerifyCallback } from 'passport-oauth2';

interface OAuthProfile {
  id: string;
  emails?: Array<{ value: string }>;
  displayName?: string;
  username?: string;
}

// Only initialize Google if credentials exist
if (config.google.clientId && config.google.clientSecret) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.google.clientId,
        clientSecret: config.google.clientSecret,
        callbackURL: config.google.callbackUrl
      },
      (_accessToken: string, _refreshToken: string, profile: OAuthProfile, done: VerifyCallback) => {
        const user = {
          id: profile.id,
          email: profile.emails?.[0]?.value || '',
          username: profile.displayName
        };
        done(null, user);
      }
    )
  );
}

// Only initialize GitHub if credentials exist
if (config.github.clientId && config.github.clientSecret) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: config.github.clientId,
        clientSecret: config.github.clientSecret,
        callbackURL: config.github.callbackUrl
      },
      (_accessToken: string, _refreshToken: string, profile: GitHubProfile, done: VerifyCallback) => {
        const user = {
          id: profile.id,
          email: profile.emails?.[0]?.value || '',
          username: profile.username || profile.displayName || ''
        };
        done(null, user);
      }
    )
  );
}

// Only initialize Microsoft if credentials exist

// Azure causes problems, maybe only use google and github for OAuth
if (config.microsoft.clientId && config.microsoft.clientSecret) {
  passport.use(
    new MicrosoftStrategy(
      {
        clientID: config.microsoft.clientId,
        clientSecret: config.microsoft.clientSecret,
        callbackURL: config.microsoft.callbackUrl,
        scope: ['user.read']
      },
      (_accessToken: string, _refreshToken: string, profile: OAuthProfile, done: VerifyCallback) => {
        const user = {
          id: profile.id,
          email: profile.emails?.[0]?.value || '',
          username: profile.displayName
        };
        done(null, user);
      }
    )
  );
}

passport.serializeUser((user: any, done) => {
  done(null, user);
});

passport.deserializeUser((user: any, done) => {
  done(null, user);
});

export default passport;