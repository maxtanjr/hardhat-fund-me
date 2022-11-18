const { assert } = require("chai");
const { getNamedAccounts, ethers, network } = require("hardhat");
const {developmentChains} = require("../../helper-hardhat-config");

// if the network is a local or hardhat node
developmentChains.includes(network.name) 
    ? describe.skip 
    : describe("FundMe", async() => {
        let fundMe;
        let fundDeployer;
        const sendValue = ethers.utils.parseEther("1");
        beforeEach(async () => {
            fundDeployer = (await getNamedAccounts()).deployer;
            // we assume that on staging, there already is a contract called FundMe.
            // we also don't need a mock because we are testing on the testnet
            fundMe = await ethers.getContract("FundMe", fundDeployer);
        })

        it("Test-1: Allow people to fund and withdraw", async () => {
            await fundMe.fund({value: sendValue});
            await fundMe.withdrawAll();

            const endingBalance = await fundMe.provider.getBalance(fundMe.address);
            assert.equal(endingBalance.toString(), "0");
        })
    })