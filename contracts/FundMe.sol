// Get funds from users
// Withdraw funds
// Set minimum funding value in USD

// SPDX-License-Identifier: MIT
// pragma
pragma solidity ^0.8.17;
// imports
import "./PriceConverter.sol";
import "hardhat/console.sol";
// error codes
error FundMe__NotOwner();

// Interfaces, Libraries, Contracts

/**
 * @title A contract for crowd funding
 * @author Maximilian
 * @notice This contract is to demo a sample funding contract
 * @dev This implements price feeds as our library
 */
contract FundMe {
    // ********* State Variables ************* //

    // set to constant to save gas
    uint256 public constant MINIMUM_USD = 50;

    // prefix with "s" to indicate a storage variable
    address[] public s_funders;
    mapping(address => uint256) public s_addressToAmountFunded;
    AggregatorV3Interface public s_priceFeed;

    // storing immutables don't take up a lot of gas
    address public immutable i_owner;

    // ********* Modifiers ************* //
    modifier onlyOwner() {
        // require(msg.sender == i_owner, "You must be the owner to execute this function!");

        // saves gas; revert error strings in require is expensive
        if (msg.sender != i_owner) {
            revert FundMe__NotOwner();
        }
        

        // the rest of the code in the function that is declared with this modifier
        _;
    }

    /**
     * Functions order
     * 1) constructor
     * 2) receive
     * 3) fallback
     * 4) external
     * 5) public
     * 6) internal
     * 7) private
     * 8) view / pure
     */

    constructor(address priceFeedAddress) {
        i_owner = msg.sender;

        // Goerli contract address for chainlink price feed of ETH/USD: 0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e
        // go to https://github.com/smartcontractkit/chainlink/blob/develop/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol to check out the methods provided in the AggregatorV3Interface.sol code
        s_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    // what happens if someone sends this contract ETH withouth calling the fund() function
    // receive 
    receive() external payable {
        fund();
    }

    // fallback
    fallback() external payable {
        fund();
    }

    /**
     * @notice This function funds this contract
     * @dev This implements price feeds as our library
     */
    // smart contracts can hold funds, just like how wallets can
    // In order to send ETH or any token with a function, we need to declare the function with a 'payable' keyword
    function fund() public payable {
        // to get the value of how much someone is sending in the call to this function. We can only call msg.value when the function declaration has the 'payable' keyword
        require(PriceConverter.getEthAmountInUsd(msg.value, s_priceFeed) >= MINIMUM_USD * 1e18, "Didn't send enough funds. Minimum is 50 USD in ETH"); // 1e18 = 1 000 000 000 000 000 000 wei = 1 ETH

        // What is reverting?
        // Undo any action before, and send the remaining gas back
        // This means that if the above "require" function fails, it will cancel the transaction, undo any state changes that happens before, and return the remaining gas that would have been needed to execute the operations
        // after the "require" statement

        // msg.sender is the address of the account that calls this function
        s_funders.push(msg.sender);

        s_addressToAmountFunded[msg.sender] += msg.value;
    }

    function withdrawAll() public payable onlyOwner {
        for (uint256 funderIndex = 0; funderIndex < s_funders.length; funderIndex++) {

            address funder = s_funders[funderIndex];

            // update to 0 first, before making any transactions (prevent re-entrancy)
            s_addressToAmountFunded[funder] = 0;
        }

        // reset the array with 0 objects in it
        s_funders = new address[](0);

        // withdraw the funds; there are 3 ways (transfer, send, call)

        // transfer the balance of "this" contract to msg.sender
        // msg.sender is of type address; payable(msg.sender) is of type payable address
        // In solidity, in order to send the native blockchain token, we need to make the receiving address payable
        // payable(msg.sender).transfer(address(this).balance);

        // // send. In transfer, the transaction automatically reverts if fails. However, in send, we need to explicitly define a require statement to revert
        // bool sendSuccess = payable(msg.sender).send(address(this).balance);
        // require(sendSuccess, "sending failed");

        // call. Returns two values, the success of the call and a byte array
        (bool callSuccess, bytes memory dataReturned) = payable(msg.sender).call{value: address(this).balance}("");

        require(callSuccess, "Call failed");
    }

    function cheaperWithdrawAll() public payable onlyOwner {
        // save the array into memory first, to prevent multiple interactions with storage which is very expensive
        // *Mappings cannot be in memory*
        address[] memory funders = s_funders;
        for (uint256 funderIndex = 0; funderIndex < funders.length; funderIndex++) {
            address funder = funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);
        (bool success, ) = i_owner.call{value: address(this).balance}("");
        require(success);

    }
}
