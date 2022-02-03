#!/usr/bin/env bash

if [[ "${DEPLOY_ENVIRONMENT}" == "DEV" ]]
then
  echo "Starting nodemon"
  [[ -d node_modules ]] || npm install
  exec nodemon \
    --watch "${MODULE}"/src \
    --watch "${SHARED}" \
    --inspect=0.0.0.0:9236 \
    src/main.js \
    --amqp-uri amqp://${RABBITMQ_HOST}:${RABBITMQ_PORT} \
    --redis-uri redis://user-storage-redis \
    --home-dir /sepalUsers \
    --min-delay-seconds ${MIN_DELAY_SECONDS} \
    --max-delay-seconds ${MAX_DELAY_SECONDS} \
    --delay-increase-factor ${DELAY_INCREASE_FACTOR} \
    --concurrency ${CONCURRENCY} \
    --max-retries ${MAX_RETRIES} \
    --initial-retry-delay-seconds ${INITIAL_RETRY_DELAY_SECONDS}
else
  echo "Starting node"
  exec node \
    src/main.js \
    --amqp-uri amqp://${RABBITMQ_HOST}:${RABBITMQ_PORT} \
    --redis-uri redis://user-storage-redis \
    --home-dir /sepalUsers \
    --min-delay-seconds ${MIN_DELAY_SECONDS} \
    --max-delay-seconds ${MAX_DELAY_SECONDS} \
    --delay-increase-factor ${DELAY_INCREASE_FACTOR} \
    --concurrency ${CONCURRENCY} \
    --max-retries ${MAX_RETRIES} \
    --initial-retry-delay-seconds ${INITIAL_RETRY_DELAY_SECONDS}
fi
