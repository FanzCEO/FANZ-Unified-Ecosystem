# syntax=docker/dockerfile:1
ARG BASE_IMAGE=node:20-slim
FROM ${BASE_IMAGE} AS base
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    git \
    python3 \
    python3-pip \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Node.js build stage
FROM base AS node-build
COPY package*.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
RUN corepack enable pnpm
RUN if [ -f pnpm-lock.yaml ]; then pnpm fetch --frozen-lockfile; fi
COPY . .
RUN if [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile && pnpm build; fi

# Python build stage
FROM python:3.12-slim AS py-build
WORKDIR /app
COPY pyproject.toml requirements*.txt ./
RUN pip install --no-cache-dir uv
RUN if [ -f pyproject.toml ]; then uv sync; elif [ -f requirements.txt ]; then pip install -r requirements.txt; fi
COPY . .

# Production runtime
FROM base AS runner
ENV NODE_ENV=production
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV FANZ_ENV=production

COPY --from=node-build /app/dist ./dist
COPY --from=py-build /usr/local /usr/local
COPY . .

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["sh", "-c", "if [ -f package.json ]; then node dist/server.js; else python -m app; fi"]
