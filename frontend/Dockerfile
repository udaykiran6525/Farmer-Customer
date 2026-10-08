# Stage 1: Build the Vite frontend application
FROM node:18-alpine AS build
WORKDIR /app

# Copy package manifests and install dependencies
COPY package*.json ./
RUN npm ci || npm install

# Copy source code and build production bundle
COPY . ./
RUN npm run build

# Stage 2: Serve static files using Nginx
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Clean default nginx static assets
RUN rm -rf ./*

# Copy built frontend assets
COPY --from=build /app/dist .

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
