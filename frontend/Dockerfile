FROM node:lts-slim AS builder

WORKDIR /app

COPY package.json .

RUN npm i

COPY . .

RUN npm run build

# Production stage: nginx
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 4173

CMD ["nginx", "-g", "daemon off;"]