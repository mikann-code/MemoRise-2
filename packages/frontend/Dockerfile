# 開発用 Dockerfile（Next.js dev サーバー）
FROM node:22-bookworm

WORKDIR /app

# 依存だけ先にコピーしてキャッシュを効かせる
COPY package.json ./
RUN npm install

COPY . .

EXPOSE 3200

CMD ["npm", "run", "dev"]
