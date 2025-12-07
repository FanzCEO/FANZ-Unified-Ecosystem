#!/bin/bash
export JWT_SECRET="${JWT_SECRET:-dev-secret-$(openssl rand -hex 16)}"
export SESSION_SECRET="${SESSION_SECRET:-session-secret-$(openssl rand -hex 16)}"
export PORT=5000
export NODE_ENV=development
tsx server/index.ts
