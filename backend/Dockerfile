FROM node:20

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install --ignore-scripts

COPY . .

RUN npx prisma generate

EXPOSE 5000

CMD ["yarn", "dev"]