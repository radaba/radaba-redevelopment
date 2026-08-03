# syntax=docker/dockerfile:1.7
FROM node:22.14.0-alpine AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22.14.0-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ARG RADABA_ENV=development
ARG APP_URL=https://development.example.invalid
ARG APP_VERSION=0.0.0-ci
ARG BUILD_ID=container-build
ARG NEXT_PUBLIC_FIREBASE_API_KEY=ci-placeholder
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=development.example.invalid
ARG NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://development.example.invalid
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID=radaba-development
ARG NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=radaba-development.appspot.com
ARG NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=000000000000
ARG NEXT_PUBLIC_FIREBASE_APP_ID=ci-placeholder
ARG FIREBASE_ADMIN_PROJECT_ID=radaba-development
ENV RADABA_ENV=$RADABA_ENV APP_URL=$APP_URL APP_VERSION=$APP_VERSION BUILD_ID=$BUILD_ID
ENV NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ENV NEXT_PUBLIC_FIREBASE_DATABASE_URL=$NEXT_PUBLIC_FIREBASE_DATABASE_URL
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ENV NEXT_PUBLIC_FIREBASE_APP_ID=$NEXT_PUBLIC_FIREBASE_APP_ID
ENV FIREBASE_ADMIN_PROJECT_ID=$FIREBASE_ADMIN_PROJECT_ID
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22.14.0-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
