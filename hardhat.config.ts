import { task } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-etherscan";
import * as dotenv from "dotenv";
dotenv.config()

task("accounts", "Prints the list of accounts", async (args, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

task("deploy", "Deploy the smart contracts", async (args, hre) => {
  const TOKEN_NAME = process.env.TOKEN_NAME ?? "Dynamic NFT";
  const TOKEN_SYMBOL = process.env.TOKEN_SYMBOL ?? "DNFT";
  const MAX_SUPPLY = process.env.MAX_SUPPLY ? Number(process.env.MAX_SUPPLY) : -1;
  const MINT_COMMISSION = process.env.MINT_COMMISSION ? Number(process.env.MINT_COMMISSION) : 1;

  console.log(`Deploying ${TOKEN_NAME} with symbol ${TOKEN_SYMBOL},`,
    `max supply ${MAX_SUPPLY}, and mint commission ${MINT_COMMISSION}`);

  const NFT = await hre.ethers.getContractFactory("NFT");
  const smartContract = await NFT.deploy(TOKEN_NAME, TOKEN_SYMBOL, MAX_SUPPLY, MINT_COMMISSION);

  await smartContract.deployed();

  await new Promise(resolve => setTimeout(resolve, 10000));

  /* verify may falsely fail if the contract has already been verified
  /* failure should be ignored */
  await hre.run("verify:verify", {
    address: smartContract.address,
    constructorArguments: [TOKEN_NAME, TOKEN_SYMBOL, MAX_SUPPLY, MINT_COMMISSION],
  }).catch(e => console.log(e.message))
});

export default {
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    mumbai_dev: {
      url: "https://rpc-mumbai.maticvigil.com",
      accounts: [process.env.PRIVATE_KEY_DEV],
      gasPrice: 8000000000
    },
    matic_prod: {
      url: process.env.ALCHEMY_URL,
      accounts: [process.env.PRIVATE_KEY_PROD],
    },
    eth_prod: {
      url: process.env.ALCHEMY_URL,
      accounts: [process.env.PRIVATE_KEY_PROD],
    }
  },
  etherscan: {
    apiKey: process.env.POLYGONSCAN_KEY,
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 20000
  }
};