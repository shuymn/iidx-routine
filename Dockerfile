FROM node:14.8.0-alpine
ARG NODE_ENV=production
WORKDIR /iidx-routine

RUN apk -U upgrade && apk add git yarn && rm -rf /var/cache/apk/*

COPY package.json yarn.lock /iidx-routine/

RUN yarn && yarn cache clean
COPY . /iidx-routine
CMD yarn start
