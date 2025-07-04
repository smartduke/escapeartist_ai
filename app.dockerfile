FROM node:20.18.0-slim AS builder

WORKDIR /home/EA-Agent

# Install Python and build dependencies for native packages
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    make \
    g++ \
    libc6-dev \
    libvips-dev \
    && rm -rf /var/lib/apt/lists/*

# Accept build arguments for Supabase and Stripe
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

# Make them available as environment variables during build
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --network-timeout 600000

COPY tsconfig.json next.config.mjs next-env.d.ts postcss.config.js drizzle.config.ts tailwind.config.ts ./
COPY src ./src
COPY public ./public

RUN mkdir -p /home/EA-Agent/data
RUN yarn build:docker

FROM node:20.18.0-slim

WORKDIR /home/EA-Agent

COPY --from=builder /home/EA-Agent/public ./public
COPY --from=builder /home/EA-Agent/.next/static ./public/_next/static

COPY --from=builder /home/EA-Agent/.next/standalone ./
COPY --from=builder /home/EA-Agent/data ./data
COPY drizzle ./drizzle

RUN mkdir -p /home/EA-Agent/uploads

COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh
CMD ["./entrypoint.sh"]