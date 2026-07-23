# Build stage
FROM node:20-alpine AS build

WORKDIR /match-making

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build


# Production stage
FROM nginx:alpine

COPY --from=build /match-making/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"] 