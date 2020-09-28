#!/usr/bin/env bash
set -Ceuo pipefail

readonly CHROME_AWS_LAMBDA_REPO_URL="https://github.com/alixaxel/chrome-aws-lambda.git"

function main() {
  git clone --depth=1 "$CHROME_AWS_LAMBDA_REPO_URL" \
  && cd chrome-aws-lambda \
  && make chrome_aws_lambda.zip \
  && cd ../ \
  && mkdir -p dist/layers \
  && mv chrome-aws-lambda/chrome_aws_lambda.zip dist/layers/ \
  && rm -rf chrome-aws-lambda
}

main
