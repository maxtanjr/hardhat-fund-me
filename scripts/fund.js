const { getNamedAccounts, ethers } = require("hardhat");

let main = async () => {
    const { deployer } = await getNamedAccounts();
    const fundMe = await ethers.getContract("FundMe", deployer);
    console.log("Funding contract...");
    const transactionRespone = await fundMe.fund({
        value: ethers.utils.parseEther("0.1"),
    });

    await transactionRespone.wait(1);
    console.log("Funded!");
};

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
