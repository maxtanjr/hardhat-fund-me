require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("solidity-coverage");
require("hardhat-gas-reporter");
require("dotenv").config();
require("hardhat-deploy");

const GOERLI_RPC_URL = process.env.GOERLI_RPC_URL;
const GOERLI_PRIVATE_KEY = process.env.GOERLI_PRIVATE_KEY;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const CMC_API_KEY = process.env.CMC_API_KEY;

module.exports = {
    networks: {
        // https://hardhat.org/tutorial/deploying-to-a-live-network
        goerli: {
            url: GOERLI_RPC_URL,
            accounts: [GOERLI_PRIVATE_KEY],
            chainId: 5,
            blockConfirmations: 6,
        },
        localhost: {
            url: "http://127.0.0.1:8545/",
            chainId: 31337,
        },
    },

    solidity: {
        compilers: [{ version: "0.8.17" }, { version: "0.6.6" }],
    },

    etherscan: {
        apiKey: ETHERSCAN_API_KEY,
    },
    gasReporter: {
        enabled: true,
        outputFile: "gas-report.txt",
        noColors: true,
        currency: "USD",
        // create an account in CMC and get the API key from https://pro.coinmarketcap.com/account
        coinmarketcap: CMC_API_KEY,
        token: "ETH",
    },

    namedAccounts: {
        deployer: {
            default: 0,
            // for local hardhat chain, get deployer of index 1
            31337: 1,
        },
        user: {
            default: 1,
        },
    },
};
