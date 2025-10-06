# FANZ AI Ecosystem Development Container
# Supports adult content platform development with compliance tools
FROM ubuntu:22.04

# Avoid prompts from apt
ENV DEBIAN_FRONTEND=noninteractive

# Set up environment
ENV ADULT_CONTENT_PLATFORM=true
ENV PAYMENT_PROCESSOR=ccbill
ENV COMPLIANCE_MODE=strict
ENV TLS_VERSION=1.3
ENV ENCRYPTION_STANDARD=aes-256
ENV NODE_ENV=development

# Install system dependencies
RUN apt-get update && apt-get install -y \
    # Essential tools
    curl \
    wget \
    git \
    vim \
    nano \
    unzip \
    zip \
    build-essential \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    # Development tools
    python3 \
    python3-pip \
    python3-venv \
    golang-go \
    # Database clients
    postgresql-client \
    redis-tools \
    # Network tools
    net-tools \
    netcat \
    telnet \
    # Security tools for adult content platform compliance
    openssl \
    gpg \
    # Process management
    htop \
    tree \
    jq \
    && rm -rf /var/lib/apt/lists/*

# Install Docker
RUN curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg \
    && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null \
    && apt-get update \
    && apt-get install -y docker-ce-cli \
    && rm -rf /var/lib/apt/lists/*

# Install mise for runtime management
RUN curl https://mise.run | sh
ENV PATH="/root/.local/bin:$PATH"

# Install Node.js 20 LTS
RUN curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - \
    && apt-get install -y nodejs

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install Go 1.21
RUN wget -O go.tar.gz https://go.dev/dl/go1.21.5.linux-amd64.tar.gz \
    && tar -C /usr/local -xzf go.tar.gz \
    && rm go.tar.gz
ENV PATH="/usr/local/go/bin:$PATH"

# Install Rust
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:$PATH"

# Install kubectl
RUN curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" \
    && install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Install Helm
RUN curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Install terraform (for infrastructure as code)
RUN wget -O- https://apt.releases.hashicorp.com/gpg | gpg --dearmor | tee /usr/share/keyrings/hashicorp-archive-keyring.gpg \
    && echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | tee /etc/apt/sources.list.d/hashicorp.list \
    && apt-get update && apt-get install terraform

# Install security and compliance tools
RUN pip3 install \
    # Python security tools
    bandit \
    safety \
    # Adult content platform specific tools
    cryptography \
    pycryptodome \
    # Development tools
    black \
    ruff \
    mypy \
    pytest \
    requests

# Set up Python virtual environment
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Create non-root user for development
RUN groupadd --gid 1000 vscode \
    && useradd --uid 1000 --gid 1000 -m vscode \
    && apt-get update \
    && apt-get install -y sudo \
    && echo vscode ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/vscode \
    && chmod 0440 /etc/sudoers.d/vscode

# Install zsh and oh-my-zsh for better terminal experience
RUN apt-get update && apt-get install -y zsh \
    && rm -rf /var/lib/apt/lists/*

USER vscode
RUN sh -c "$(curl -fsSL https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended

# Configure zsh with FANZ-specific settings
RUN echo 'export ADULT_CONTENT_PLATFORM=true' >> ~/.zshrc \
    && echo 'export PAYMENT_PROCESSOR=ccbill' >> ~/.zshrc \
    && echo 'export COMPLIANCE_MODE=strict' >> ~/.zshrc \
    && echo 'export TLS_VERSION=1.3' >> ~/.zshrc \
    && echo 'export ENCRYPTION_STANDARD=aes-256' >> ~/.zshrc \
    && echo 'export NODE_ENV=development' >> ~/.zshrc \
    && echo 'export PATH="/opt/venv/bin:$PATH"' >> ~/.zshrc \
    && echo 'export PATH="/usr/local/go/bin:$PATH"' >> ~/.zshrc \
    && echo 'export PATH="/root/.cargo/bin:$PATH"' >> ~/.zshrc \
    && echo 'eval "$(mise activate zsh)"' >> ~/.zshrc

# Set default shell to zsh
USER root
RUN chsh -s /bin/zsh vscode

# Create workspace directory
RUN mkdir -p /workspace && chown -R vscode:vscode /workspace

# Switch back to vscode user
USER vscode

# Set working directory
WORKDIR /workspace

# Install global npm packages for FANZ development
RUN npm install -g \
    @types/node \
    typescript \
    ts-node \
    nodemon \
    prettier \
    eslint \
    @nestjs/cli \
    @angular/cli \
    create-react-app \
    vite \
    turbo \
    nx

# Set up Git configuration for FANZ development
RUN git config --global init.defaultBranch main \
    && git config --global pull.rebase true \
    && git config --global fetch.prune true \
    && git config --global core.autocrlf input

# Final environment setup
ENV SHELL /bin/zsh

# Health check to ensure development environment is ready
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Default command
CMD ["/bin/zsh", "-c", "while true; do sleep 30; done"]

# Labels for FANZ ecosystem
LABEL maintainer="FANZ AI Ecosystem Team"
LABEL description="Development container for FANZ adult content platform with AI capabilities"
LABEL platform="adult-content-compliant"
LABEL compliance="2257,ccpa,gdpr"
LABEL security="tls-1.3,aes-256,zero-trust"