# syntax=docker/dockerfile:1.7-labs

FROM node:22-alpine AS deps

# Use Corepack to manage pnpm and pin an explicit version
# (pinning avoids Corepack signature hiccups in containers)
RUN corepack enable && corepack prepare pnpm@10.12.1 --activate

WORKDIR /app

# Copy only manifests for better layer caching
COPY package.json pnpm-lock.yaml ./

# Pre-fetch deps into the store (no node_modules yet)
RUN pnpm fetch

########################
FROM node:22-alpine AS build

RUN corepack enable && corepack prepare pnpm@10.12.1 --activate
WORKDIR /app

# Bring over lockfile & pre-fetched store
COPY --from=deps /app/pnpm-lock.yaml ./pnpm-lock.yaml

# Copy the rest of the source
COPY . .

ARG VITE_CONTRACT_ADDRESS
ARG VITE_RPC_URL
ARG VITE_CHAIN_ID
ARG VITE_ALCHEMY_API_KEY
ARG VITE_BLOCK_EXPLORER_URL
ARG VITE_MINTING_PAGE_URL
ARG VITE_SUBGRAPH_ENDPOINT
ARG WALLETCONNECT_PROJECT_ID

ENV VITE_CONTRACT_ADDRESS=${VITE_CONTRACT_ADDRESS}
ENV VITE_RPC_URL=${VITE_RPC_URL}
ENV VITE_CHAIN_ID=${VITE_CHAIN_ID}
ENV VITE_ALCHEMY_API_KEY=${VITE_ALCHEMY_API_KEY}
ENV VITE_BLOCK_EXPLORER_URL=${VITE_BLOCK_EXPLORER_URL}
ENV VITE_MINTING_PAGE_URL=${VITE_MINTING_PAGE_URL}
ENV VITE_SUBGRAPH_ENDPOINT=${VITE_SUBGRAPH_ENDPOINT}
ENV WALLETCONNECT_PROJECT_ID=${WALLETCONNECT_PROJECT_ID}

# Install deps from the previously fetched store and build
RUN pnpm install --frozen-lockfile && pnpm build

########################
FROM nginx:stable-alpine AS production

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html

RUN echo "healthy" > /usr/share/nginx/html/health

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]

