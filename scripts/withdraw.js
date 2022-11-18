const { getNamedAccounts, ethers } = require("hardhat");

let main = async () => {
    const { deployer } = await getNamedAccounts();
    const fundMe = await ethers.getContract("FundMe", deployer);
    console.log("Withdrawing...");
    const transactionResponse = await fundMe.withdrawAll();

    await transactionResponse.wait(1);

    console.log("Withdrawn!");
};

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
