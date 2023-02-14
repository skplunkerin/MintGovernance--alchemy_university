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
  const tx = await myGovernor.castVote(process.env.PROPOSAL_ID, 1);
  const receipt = await tx.wait();
  const voteCastEvent = receipt.events.find((x) => x.event === "VoteCast");
  const { voter, weight } = voteCastEvent.args;

  console.log(`Vote (with weight ${weight}) cast by ${voter}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
