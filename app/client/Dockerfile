FROM node:20-alpine AS build
WORKDIR /match-making
COPY client/package*.json ./
RUN npm ci
COPY client/. .
RUN npm run build

FROM nginx:alpine
COPY --from=build /match-making/dist /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]