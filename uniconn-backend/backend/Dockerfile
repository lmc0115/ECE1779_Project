FROM node:20-alpine

WORKDIR /usr/src/app

# Copy package files FIRST
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install --production

# Copy the entire backend source code
COPY . .

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "src/server.js"]
