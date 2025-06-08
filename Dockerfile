FROM node:22.15.0 as builder

RUN corepack enable

WORKDIR /usr/src/app

COPY package.json yarn.lock ./

RUN yarn install

COPY . .

RUN yarn prisma generate
RUN yarn build

FROM node:22.15.0 as runner

RUN corepack enable

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/yarn.lock ./yarn.lock
COPY --from=builder /usr/src/app/package.json ./package.json
COPY --from=builder /usr/src/app/prisma ./prisma
COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 3000