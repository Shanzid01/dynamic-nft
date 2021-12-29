
# Smart contracts for NFTs 🦍
A low/no-code solution to create smart contracts for NFTs which can:
* be listed and sold on [OpenSea](https://opensea.io/), [Rarible](https://rarible.com/)
* pay artists royalty from NFT sales ([ERC-2981](https://eips.ethereum.org/EIPS/eip-2981) & [Rarible](https://rarible.com/) compatible)
* accept fixed commissions when new NFTs are minted

Bootstrapped with [Hardhat](https://hardhat.org/) and Solidity 0.8.4.

<a href="https://trackgit.com">
<img src="https://us-central1-trackgit-analytics.cloudfunctions.net/token/ping/kxr0kperjuos7rrzujkx" alt="trackgit-views" />
</a>

## Demo 🥽
Polygon smart contract: [0x5df8762bB426C2B72018BA6488717075362a1E30](https://polygonscan.com/address/0x5df8762bb426c2b72018ba6488717075362a1e30)

Important terminology:
* *smart contract*: a program existing on the blockchain which can create new NFTs
* *NFT*: a non-fungible token minted/created by users through the smart contract
* *commission*: a fixed amount of currency received by the smart contract owner whenever a new NFT is minted
* *royalties*: a percentage of the resale value the original NFT artist (minter) receives


### Smart contact functions ⚙️
#### ``mint(tokenURI, royaltyPercent)`` payable
Create a new NFT.
* tokenURI: Link to the NFT metadata ([see example](https://opensea-creatures-api.herokuapp.com/api/creature/1))
* royaltyPercent: 0-100 value of the percentage royalty the artist should receive on every sale of the NFT
The value of this transaction must be the minimum commission required to mint NFTs on the smart contract. This value is set by the smart contract owner.

#### ``setRoyalties(tokenId, royaltiesReceipientAddress, percentage)``
Update royalty percentage for an NFT. Only the original artist (minter) can call this function.
* tokenID: ID of the NFT
* royaltiesReceipientAddress: Wallet address of the account which should receive the royalties
* percentage: 0-100 value of the percentage royalty the artist should receive on every sale of the NFT

#### ``transferCommission(to)``
Transfer the commission received from NFT mints to a given address. Only the smart contract owner can call this function.

## Create a new smart contract 📝
#### Local development
```
npm i                   # install
npx hardhat compile     # compile
npx hardhat test        # unit test
```
#### Deploy on-chain
Create a ``.env`` file at the root directory with the following variables:
* **POLYGONSCAN_KEY**: Polygonscan API key [[video tutorial](https://youtu.be/51IC0dZGTbg)]
* **ALCHEMY_URL**: Alchemy project key [[video tutorial](https://youtu.be/tfggWxfG9o0)]
* **PRIVATE_KEY_DEV**: Crypto wallet account private key. You can request some ``MATIC`` tokens from the [polygon faucet](https://faucet.polygon.technology/).
* **PRIVATE_KEY_PROD**: Crypto wallet account private key. Can be the same as PRIVATE_KEY_DEV but I like to use two separate accounts for dev and prod.
* **TOKEN_NAME**: New name of the NFT smart contract
* **TOKEN_SYMBOL**: New symbol of the smart contract
* **MINT_COMMISSION**: The commission given to the contract owner when the ``mint()`` function is executed
* **MAX_SUPPLY**: The maximum number of NFTs that can be minted using the contact. Use -1 for unlimited supply.

Deploy to [Polygon mumbai testnet](https://mumbai.polygonscan.com/)
```
npx hardhat deploy --network mumbai_dev
```
Deploy to [Polygon mainnet](https://polygonscan.com/)
```
npx hardhat deploy --network matic_prod
```
**Note:** Please ensure you have the minimum number of ``MATIC`` tokens in your wallet (roughly 0.008 `MATIC`, or $0.20 USD - [see latest MATIC-USD rate](https://coinmarketcap.com/currencies/polygon/))

Deploy to [Ethereum mainnet](https://etherscan.io/) (untested)
```
npx hardhat deploy --network eth_prod
```

### Contributing 👋
Contributions are always welcome! Feel free to open any issue or send a pull request.
For questions, please contact [shanzid.com](shanzid.com).