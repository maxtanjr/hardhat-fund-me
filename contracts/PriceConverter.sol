// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

// yarn add --dev @chainlink/contracts
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

library PriceConverter {
    function getEthPriceInUsd(AggregatorV3Interface priceFeed) internal view returns (uint256) {
        // ABI (contract)

        (, int256 price, , , ) = priceFeed.latestRoundData();

        // ETH price in USD (8 decimals for Chainlink price feeds). Multiply by 10 to make it consistent with the wei value in fund().
        // msg.value above is also in uint256, so we typecast it accordingly
        return uint256(price * 1e10);
    }

    function getVersion(AggregatorV3Interface priceFeed) internal view returns (uint256) {
        return priceFeed.version();
    }

    function getEthAmountInUsd(uint256 _ethAmount, AggregatorV3Interface priceFeed) internal view returns (uint256) {
        uint256 ethPrice = getEthPriceInUsd(priceFeed);

        uint256 ethAmountInUsd = (ethPrice * _ethAmount) / 1e18;

        return ethAmountInUsd;
    }
}
