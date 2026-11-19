import { Request, Response } from 'express';

declare module 'express' {
  export interface Response {
    locals: {
      nonce?: string;
      [key: string]: any;
    };
  }
}

export {};