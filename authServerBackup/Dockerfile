FROM node:20

WORKDIR /app

COPY . .
# RUN rm .env*

RUN npm ci

CMD ["npm", "start"]