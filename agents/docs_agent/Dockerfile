# Lightweight Node image — PDFs are rendered in the browser (pdf.js); no GM/GS.
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", "server.mjs"]
