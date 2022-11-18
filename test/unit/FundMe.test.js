const { deployments, ethers, getNamedAccounts } = require("hardhat");
const { assert, expect } = require("chai");
const { developmentChains } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async () => {
          let fundMe;
          let deployer;
          let mockV3Aggregator;
          // 1 ether
          const sendValue = ethers.utils.parseEther("1");

          beforeEach(async () => {
              // deploy our fundMe contract
              // using hardhat-deploy

              // we can tell hardhat which account we want to deploy the contracts with
              deployer = (await getNamedAccounts()).deployer;

              // fixture allows us to run our entire "deploy" folder with as many tags as we want
              // Here, it means that we will run through our deploy scripts on our local network and deploy all of our contracts
              await deployments.fixture(["all"]);

              // get the most recently deployed "FundMe" contract. The deployer is the account that deploys the FundMe contract
              fundMe = await ethers.getContract("FundMe", deployer);

              mockV3Aggregator = await ethers.getContract("MockV3Aggregator", deployer);
          });

          describe("constructor", async () => {
              // testing on local network hence using mockV3Aggregator
              it("Test-0: Sets the aggregator addresses correctly", async () => {
                  const response = await fundMe.s_priceFeed();
                  assert.equal(response, mockV3Aggregator.address);
              });
          });

          describe("fund", async () => {
              it("Test-1: Fails if you don't send enough ETH", async () => {
                  await expect(fundMe.fund()).to.be.revertedWith("Didn't send enough funds. Minimum is 50 USD in ETH");
              });

              it("Test-2: Updated the amount funded data structure", async () => {
                  await fundMe.fund({ value: sendValue });
                  const response = await fundMe.s_addressToAmountFunded(deployer);
                  assert.equal(sendValue.toString(), response.toString());
              });

              it("Test-3: Adds funder to array of s_funders", async () => {
                  await fundMe.fund({ value: sendValue });
                  const funder = await fundMe.s_funders(0);
                  assert.equal(funder, deployer);
              });
          });

          describe("withdraw", async () => {
              beforeEach(async () => {
                  // supply fundMe contract 1ETH from deployer
                  await fundMe.fund({ value: sendValue });
              });

              it("Test-4: Withdraw ETH from a single founder", async () => {
                  // Arrange
                  const startingFundMeBalance = await fundMe.provider.getBalance(fundMe.address);
                  const startingDeployerBalance = await fundMe.provider.getBalance(deployer);

                  // Act
                  const transactionResponse = await fundMe.withdrawAll();
                  const transactionReceipt = await transactionResponse.wait(1);

                  // get gas cost for transaction
                  const { gasUsed, effectiveGasPrice } = transactionReceipt;
                  const gasCost = gasUsed.mul(effectiveGasPrice);

                  const endingFundMeBalance = await fundMe.provider.getBalance(fundMe.address);

                  const endingDeployerBalance = await fundMe.provider.getBalance(deployer);

                  // Assert
                  assert.equal(endingFundMeBalance, 0);
                  // use Add and not +, since we are getting values directly from the blockchain, we will get a BigNumber.
                  // When we called withdrawAll, our deployer spent a little bit of gas
                  assert.equal(startingFundMeBalance.add(startingDeployerBalance), endingDeployerBalance.add(gasCost).toString());
              });

              it("Test-5: Allows us to withdraw with multiple s_funders", async () => {
                  const accounts = await ethers.getSigners();

                  for (let i = 1; i < 6; i++) {
                      // we need to call this connect function because right now our fundMe contract is connected to the deployer account
                      // and anytime we call a transaction in fundMe, our deployer is the account that is making the transaction.
                      // Hence we need to create new objects to connect to all these accounts (signers)
                      const fundMeConnectedContract = await fundMe.connect(accounts[i]);

                      await fundMeConnectedContract.fund({ value: sendValue });

                      // Arrange
                      const startingFundMeBalance = await fundMe.provider.getBalance(fundMe.address);
                      const startingDeployerBalance = await fundMe.provider.getBalance(deployer);

                      // Act
                      const transactionResponse = await fundMe.withdrawAll();
                      const transactionReceipt = await transactionResponse.wait(1);

                      const { gasUsed, effectiveGasPrice } = transactionReceipt;
                      const gasCost = gasUsed.mul(effectiveGasPrice);

                      const endingFundMeBalance = await fundMe.provider.getBalance(fundMe.address);

                      const endingDeployerBalance = await fundMe.provider.getBalance(accounts[i].address);

                      // Assert
                      assert.equal(endingFundMeBalance, 0);
                      assert.equal(startingFundMeBalance.add(startingDeployerBalance), endingDeployerBalance.add(gasCost).toString());

                      // make sure that the s_funders array is reset properly
                      await expect(fundMe.s_funders(0)).to.be.reverted;

                      for (i = 1; i < 6; i++) {
                          assert.equal(await fundMe.s_addressToAmountFunded(accounts[i].address), 0);
                      }
                  }
              });

              it("Test-6: Only allow the owner to withdraw funds", async () => {
                  const accounts = await ethers.getSigners();
                  const attackerConnectedContract = await fundMe.connect(accounts[3]);

                  await expect(attackerConnectedContract.withdrawAll()).to.be.revertedWith("FundMe__NotOwner()");
              });

              it("Test-7: Cheaper withdraw", async () => {
                  const accounts = await ethers.getSigners();

                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(accounts[i]);

                      await fundMeConnectedContract.fund({ value: sendValue });

                      // Arrange
                      const startingFundMeBalance = await fundMe.provider.getBalance(fundMe.address);
                      const startingDeployerBalance = await fundMe.provider.getBalance(deployer);

                      // Act
                      const transactionResponse = await fundMe.cheaperWithdrawAll();
                      const transactionReceipt = await transactionResponse.wait(1);

                      const { gasUsed, effectiveGasPrice } = transactionReceipt;
                      const gasCost = gasUsed.mul(effectiveGasPrice);

                      const endingFundMeBalance = await fundMe.provider.getBalance(fundMe.address);

                      const endingDeployerBalance = await fundMe.provider.getBalance(accounts[i].address);

                      // Assert
                      assert.equal(endingFundMeBalance, 0);
                      assert.equal(startingFundMeBalance.add(startingDeployerBalance), endingDeployerBalance.add(gasCost).toString());

                      // make sure that the s_funders array is reset properly
                      await expect(fundMe.s_funders(0)).to.be.reverted;

                      for (i = 1; i < 6; i++) {
                          assert.equal(await fundMe.s_addressToAmountFunded(accounts[i].address), 0);
                      }
                  }
              });
          });
      });
