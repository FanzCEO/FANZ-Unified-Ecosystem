declare module 'compression' {
  import { Request, Response, NextFunction } from 'express';

  interface CompressionOptions {
    chunkSize?: number;
    level?: number;
    memLevel?: number;
    strategy?: number;
    threshold?: number | string;
    windowBits?: number;
    filter?: (req: Request, res: Response) => boolean;
  }

  function compression(options?: CompressionOptions): (req: Request, res: Response, next: NextFunction) => void;

  export = compression;
}