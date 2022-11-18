// pull out just the networkConfig function (in module.exports) from the helper-hardhat-config.js file
const { networkConfig, developmentChains } = require("../helper-hardhat-config");
const { network } = require("hardhat");
const {verify} = require("../utils/verify")

// hre is the hardhat runtime env. Wheever we run a deploy script, hardhat deploy automatically calls this function and passes the hardhat object into it
let DeployFundMe = async (hre) => {
    //console.log("Hello from DeployFundMe");
    const { getNamedAccounts, deployments } = hre;

    // we get two functions (deploy and log) from "deployments"
    const { deploy, log } = deployments;

    // get the deployer account from getNamedAccounts() function
    const { deployer } = await getNamedAccounts();

    const chainId = network.config.chainId;

    // if chainId is X use address Y
    // if chainId is Z use address A

    // pull out the ETH / USD price feed address from the networkConfig map
    // command line in terminal, for egs: yarn hardhat deploy --network polygon
    let ethUsdPriceFeedAddress;

    // if network name is either "hardhat" or "local"
    if (developmentChains.includes(network.name)) {
        // get the most recent deployment, which would happen before this deploy-fund-me, which essentially is deploy-mocks, using the deployments library from hre
        const ethUsdAggregator = await deployments.get("MockV3Aggregator");

        ethUsdPriceFeedAddress = ethUsdAggregator.address;
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"];
    }

    const args = [ethUsdPriceFeedAddress];

    // what happens when we want to change chains?
    // when going for localhost or hardhat network, we want to use a mock
    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: args, // price feed address
        log: true,
        waitConfirmations: network.config.blockTransactions || 1
    });

    // if the deployment is not on a local network
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        // the script for verification is in the utils folder
        await verify(fundMe.address, args)

    }

    log("-----------------------------------------------------------------");
};

module.exports = DeployFundMe;
module.exports.tags = ["all", "fundme"]