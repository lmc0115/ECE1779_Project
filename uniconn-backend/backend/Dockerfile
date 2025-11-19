FROM node:20-alpine

WORKDIR /usr/src/app

# Copy only dependency files first
COPY package.json package-lock.json* ./

# Install production dependencies
RUN npm install --production

# Copy the entire src folder
COPY src ./src

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

# Start API server
CMD ["node", "src/server.js"]
