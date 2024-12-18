![omni-image-aa-cropped](https://github.com/user-attachments/assets/136ab09d-d936-4c2b-886b-076405d3a769)

## Omni Meme Food Factory

Launch your own AI-powered food meme coin as Omni Fungible Token (OFT) on 70+ chains in ONE click(*), made possible by LayerZero V2

(* Theoretically. In practice you might need to confirm transactions for a couple of times on your wallet. This will be improved in the future.)

4-minute demo: https://youtu.be/_uRSktRBb3Y

- `src` folder contains client-side code for 
  - Launch Interface: imagine new meme with AI, preview the food images and recipes, specify launch parameters (mint price curve, price parameters, max supply, lock period, chains ...), connect wallet and pay (a very small) launch fee to deploy to multiple chains simultaneously
  - Meme Interface: Pay to mint the meme, transfer minted tokens to any deployed chain, view balance, read verified reviews, add a new review (as a holder) 
- `server` folder contains a Python server exposing various APIs for generating food images and recipes with AI, and retrieving / verifying reviews. The AI is powered by OpenAI image and natural language models.
- `contracts` folder contains an implementation of FoodMeme token, based on LayerZero's OFT standard (ERC20 compatible). FoodMeme contracts can be launched using `FoodMemeFactory` contracts, which are already deployed on multiple LayerZero-integrated chains below.
  - Anyone can launch a new `FoodMeme` token using `launch` method. The parameters can be found in `Utils` contract.
  - If you want to launch using command lines or your own UI / contracts, don't forget to call `setupLz` to configure peers (i.e. where the contracts are deployed in other chains, and which chains). See `test/FoodMemeFactory.t.sol` for example of the parameters and how to set it up.
  - After launching, `FoodMeme` token can be minted by anyone, by paying the mint price you specified (constant, linear to % minted, quadratic to % minted)
  - You can pause/unpause minting
  - If you set a lock up period in launch parameters, you can also unlock the tokens early. Tokens cannot be transferred during lock up period.
  - Any token holder can add a review / delete their own review. Anyone can also check current average review rating on chain.
  - Review texts (stored on server or by third party) can be verified using hash stored on chain
  - At the moment, tokens can only be minted on the configured "mintChains", which should be a single chain for now. This will be improved later, see TODO 
  - At the moment, reviews and supply can only be tracked on the configured "masterChain". This will be improved later, see TODO

## Test Locally

Start a local node using `anvil`. Deploy using `./deploy-local.sh`

Run test examples using `forge test --match-test test_constructor -vv`, which simulate two chains locally and uses LayerZero test tools to setup endpoints and communications

## Production Deployments

Setup environment variables in `.env`

You need 

```
DEPLOYER_PRIVATE_KEY=...
BASE_URL=...
```

See forge deployment scripts in `deploy.sh`, `deploy-base.sh`, `deploy-polygon.sh`.

### FoodMemeFactory

- Harmony: 0x210f49e4de7e0f41b5a64f8fb4597b822fd733eb
- Polygon: 0xa590e50486b68043e658ba4263c1bd84172c6150
- Base: 0xa590e50486B68043e658bA4263C1BD84172c6150

### FoodMemeFactoryHelper

- Harmony: 0xB3D8d33D6414a4c996C7ADaf9b14414F7c229fD1
- Polygon: 0x821ad3a00e6ebe7873c40a0b30d24331ac1f8e0f
- Base: 0x821ad3a00e6ebe7873c40a0b30d24331ac1f8e0f

## Screenshots


<img width="100%" alt="Screenshot 2024-10-20 at 8 23 06 AM" src="https://github.com/user-attachments/assets/c469f8ab-c988-460f-b3b3-2a68054be272">

--------------

<img width="100%" alt="Screenshot 2024-10-20 at 8 44 24 AM" src="https://github.com/user-attachments/assets/74068772-8c64-49e3-8a86-820fed97d629">

--------------

<img width="100%" alt="Screenshot 2024-10-20 at 8 44 34 AM" src="https://github.com/user-attachments/assets/6aafbc44-5624-4b5a-be35-02657a261a6c">

--------------

<img width="100%" alt="Screenshot 2024-10-20 at 8 24 38 AM" src="https://github.com/user-attachments/assets/692dad49-9aba-44a2-8d07-dbfed4519d2c">

--------------

<img width="100%" alt="Screenshot 2024-10-20 at 8 24 46 AM" src="https://github.com/user-attachments/assets/dcab55a5-51de-42ae-8f93-28030ff3676e">

