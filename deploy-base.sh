#!/bin/zsh

export $(grep -v '^#' .env | xargs)
forge script script/DeployFoodMemeFactory.s.sol --rpc-url https://mainnet.base.org \
  --legacy \
  --broadcast \
  --private-key ${DEPLOYER_PRIVATE_KEY} \
  -vv

