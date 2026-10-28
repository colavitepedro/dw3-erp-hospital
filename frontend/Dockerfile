FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY frontend ./frontend
ENV NODE_ENV=production
EXPOSE 40100
CMD ["node", "frontend/app.js"]
