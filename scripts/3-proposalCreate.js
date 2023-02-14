require("dotenv").config();
const { ethers } = require("hardhat");

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
  const tx = await myGovernor.propose(
    [myToken.address],
    [0],
    // NOTE: parseEther() can be used because this erc20 token uses 18
    //       decimals just like ether.
    [
      myToken.interface.encodeFunctionData("mint", [
        owner.address,
        ethers.utils.parseEther("25000"),
      ]),
    ],
    "Give the owner more tokens!"
  );
  const receipt = await tx.wait();
  const event = receipt.events.find((x) => x.event === "ProposalCreated");
  const { proposalId } = event.args;

  console.log(`Proposal ID "${proposalId} created`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
