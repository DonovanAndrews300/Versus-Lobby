FROM node:20-alpine

# Create app directory
WORKDIR /app

# Copy package files first (for Docker cache efficiency)
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev --legacy-peer-deps
# Copy rest of app source
COPY . .

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose app port
EXPOSE 3000

# Start command
CMD ["npm", "run", "start"]