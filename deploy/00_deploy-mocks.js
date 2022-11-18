const { developmentChains, DECIMALS, INITIAL_ANSWER } = require("../helper-hardhat-config");
const { network } = require("hardhat");


let DeployMocks = async (hre) => {
    //console.log("Hello from DeployFundMe");
    const { getNamedAccounts, deployments } = hre;

    // we get two functions (deploy and log) from "deployments"
    const { deploy, log } = deployments;

    // get the deployer account from getNamedAccounts() function
    const { deployer } = await getNamedAccounts();

    if (developmentChains.includes(network.name)) {
        log("Local network detected! Deploying mocks...");
        await deploy("MockV3Aggregator", {
            contract: "MockV3Aggregator",
            from: deployer,
            log: true,
            args: [DECIMALS, INITIAL_ANSWER],
        });
        log("Mocks deployed!");
        log("-----------------------------------------------------------------");
    }
};

module.exports = DeployMocks;
module.exports.tags = ["all", "mocks"];
