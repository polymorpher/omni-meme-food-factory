#!/bin/zsh

export $(grep -v '^#' .env | xargs)
forge script script/DeployFoodMemeFactory.s.sol --rpc-url http://127.0.0.1:8545 \
  --legacy \
  --broadcast \
  --private-key ${DEPLOYER_PRIVATE_KEY} \
  -vv \

