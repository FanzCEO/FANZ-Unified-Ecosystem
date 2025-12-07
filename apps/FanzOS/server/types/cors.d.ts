declare module 'cors' {
  import { Request, Response, NextFunction } from 'express';

  interface CorsOptions {
    origin?: boolean | string | RegExp | (string | RegExp)[] | ((origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => void);
    methods?: string | string[];
    allowedHeaders?: string | string[];
    exposedHeaders?: string | string[];
    credentials?: boolean;
    maxAge?: number;
    preflightContinue?: boolean;
    optionsSuccessStatus?: number;
  }

  interface CorsRequest extends Request {
    method?: string;
  }

  interface CorsResponse extends Response {}

  function cors(options?: CorsOptions): (req: CorsRequest, res: CorsResponse, next: NextFunction) => void;

  export = cors;
}