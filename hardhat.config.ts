import * as dotenv from "dotenv";

import { HardhatUserConfig, task } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";

dotenv.config();

task("deploy")
  .addParam("name")
  .addParam("symbol")
  .addParam("initBaseURI")
  .addParam("initNotRevealedURI")
  .setAction(async ({ name, symbol, initBaseURI, initNotRevealedURI }, hre) => {
    const NFT = await hre.ethers.getContractFactory("NFT");
    const nft = await NFT.deploy(name, symbol, initBaseURI, initNotRevealedURI);
    await nft.deployed();

    return nft.address;
  });

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
  solidity: "0.8.4",
  // defaultNetwork: "ropsten",
  defaultNetwork: "rinkeby",
  networks: {
    ropsten: {
      url: process.env.ROPSTEN_URL || "",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    rinkeby: {
      url: process.env.RINKEBY_URL || "",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

export default config;
