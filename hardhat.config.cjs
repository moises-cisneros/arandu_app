require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    hardhat: {
      chainId: 31337,
    },
    "lisk-sepolia": {
      url: "https://rpc.sepolia-api.lisk.com",
      chainId: 4202,
      accounts: [],
    },
  },
};
