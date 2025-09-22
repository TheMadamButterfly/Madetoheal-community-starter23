FROM node:20-slim
WORKDIR /app
COPY package*.json ./
# Prefer clean, but fall back to install for first-time lockfiles
RUN npm ci --only=production || npm install --production
COPY . .
EXPOSE 4000
CMD ["node", "index.js"]
