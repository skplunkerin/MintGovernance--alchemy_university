require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  const [owner] = await ethers.getSigners();
  const myToken = await ethers.getContractAt(
    "MyToken",
    process.env.TOKEN_ADDRESS
  );
  await myToken.delegate(owner.address);

  console.log("Tokens delegated to:\t", owner.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
