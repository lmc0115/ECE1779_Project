FROM node:20-alpine

WORKDIR /usr/src/app

COPY package.json package-lock.json* ./
RUN npm install --production

COPY src ./src

ENV NODE_ENV=production
CMD ["npm", "start"]
