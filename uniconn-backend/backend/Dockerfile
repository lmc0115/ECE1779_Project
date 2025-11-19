FROM node:20-alpine

WORKDIR /usr/src/app

# Copy dependency files from backend folder
COPY backend/package.json backend/package-lock.json* ./backend/

# Install dependencies
RUN cd backend && npm install --production

# Copy the entire backend folder (including src)
COPY backend ./backend

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

# Start the server
CMD ["node", "backend/src/server.js"]