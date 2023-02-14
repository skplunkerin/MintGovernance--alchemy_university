const { ethers } = require("hardhat");

async function main() {
  const [owner] = await ethers.getSigners();
  const transactionCount = await owner.getTransactionCount();

  // gets the address of the token before it is deployed
  // NOTE: this is possible because contract addresses are deterministic; they
  //       are the keccak hash of the address deploying the contract and the
  //       nonce for that particular address.
  const futureAddress = ethers.utils.getContractAddress({
    from: owner.address,
    nonce: transactionCount + 1,
  });

  const MyGovernor = await ethers.getContractFactory("MyGovernor");
  const governor = await MyGovernor.deploy(futureAddress);

  const MyToken = await ethers.getContractFactory("MyToken");
  const token = await MyToken.deploy(governor.address);

  console.log(`Governor deployed to:\t ${governor.address}`);
  console.log(`Token deployed to:\t ${token.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
