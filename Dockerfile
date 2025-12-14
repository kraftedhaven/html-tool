FROM node:18-alpine AS frontend-build
WORKDIR /app
COPY frontend/package*.json ./frontend/
RUN --mount=type=cache,target=/root/.npm \
    cd frontend && npm ci
COPY frontend ./frontend
RUN cd frontend && npm run build

FROM node:18-alpine AS api
WORKDIR /app
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev
COPY . .
COPY --from=frontend-build /app/frontend/dist ./frontend/dist
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "server.js"]

