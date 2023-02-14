require("dotenv").config();
const { ethers } = require("hardhat");
const { toUtf8Bytes, keccak256, parseEther } = ethers.utils;

async function main() {
  const [owner] = await ethers.getSigners();
  const myGovernor = await ethers.getContractAt(
    "MyGovernor",
    process.env.GOVERNOR_ADDRESS
  );
  const myToken = await ethers.getContractAt(
    "MyToken",
    process.env.TOKEN_ADDRESS
  );

  let balance = await myToken.balanceOf(owner.address);
  console.log(
    `${owner.address} balance BEFORE proposal execution: ${balance.toString()}`
  );

  const tx = await myGovernor.execute(
    [myToken.address],
    [0],
    [
      myToken.interface.encodeFunctionData("mint", [
        owner.address,
        parseEther("25000"),
      ]),
    ],
    keccak256(toUtf8Bytes("Give the owner more tokens!"))
  );
  const receipt = await tx.wait();
  console.log("proposal executed...");

  balance = await myToken.balanceOf(owner.address);
  console.log(
    `${owner.address} balance AFTER proposal execution: ${balance.toString()}`
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
