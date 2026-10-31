FROM node:22-alpine

WORKDIR /app
COPY package.json ./
RUN npm install --no-package-lock

COPY . .
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "start"]
