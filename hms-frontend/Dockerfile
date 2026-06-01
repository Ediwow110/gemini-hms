# Use Node 20 (matching CI environment)
FROM node:20-slim AS build

WORKDIR /app

# Install dependencies deterministically
COPY package*.json ./
RUN npm ci

# Build the project
COPY . .
RUN npm run build

# Use Nginx to serve the build
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
