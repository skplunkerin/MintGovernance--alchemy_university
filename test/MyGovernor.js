const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { assert } = require("chai");
const { ethers } = require("hardhat");
const { toUtf8Bytes, keccak256, parseEther } = ethers.utils;
// const { time } = require("@nomicfoundation/hardhat-network-helpers");
const helpers = require("@nomicfoundation/hardhat-network-helpers");

describe("MyGovernor", function () {
  async function deployFixture() {
    const [owner, otherAccount] = await ethers.getSigners();

    const transactionCount = await owner.getTransactionCount();

    // gets the address of the token before it is deployed
    const futureAddress = ethers.utils.getContractAddress({
      from: owner.address,
      nonce: transactionCount + 1,
    });

    const MyGovernor = await ethers.getContractFactory("MyGovernor");
    const governor = await MyGovernor.deploy(futureAddress);

    const MyToken = await ethers.getContractFactory("MyToken");
    const token = await MyToken.deploy(governor.address);

    await token.delegate(owner.address);

    return { governor, token, owner, otherAccount };
  }

  it("should provide the owner with a starting balance", async () => {
    const { token, owner } = await loadFixture(deployFixture);

    const balance = await token.balanceOf(owner.address);
    assert.equal(balance.toString(), parseEther("10000"));
  });

  describe("after proposing", () => {
    async function afterProposingFixture() {
      const deployValues = await deployFixture();
      const { governor, token, owner } = deployValues;

      // NOTE: the 1st signer is connected to all `ContractFactory` and
      //       `Contract` instances by default; using `connect()` is only
      //       required when a different signer is needed:
      //
      //   > "By default, `ContractFactory` and `Contract` instances are
      //   > connected to the first signer.
      //   > [...]
      //   > If you need to test your code by sending a transaction from an
      //   > account (or `Signer` in `ethers.js` terminology) other than the
      //   > default one, you can use the `connect()` method."
      //   >
      //   > Source: https://hardhat.org/tutorial/testing-contracts
      const tx = await governor.propose(
        [token.address],
        [0],
        // NOTE: parseEther() can be used because this erc20 token uses 18
        //       decimals just like ether.
        [
          token.interface.encodeFunctionData("mint", [
            owner.address,
            parseEther("25000"),
          ]),
        ],
        "Give the owner more tokens!"
      );
      const receipt = await tx.wait();
      const event = receipt.events.find((x) => x.event === "ProposalCreated");
      const { proposalId } = event.args;

      // // wait for the 1 block voting delay
      // // await hre.network.provider.send("evm_mine");
      //
      // TODO: advance time by 1 day to allow `castVote()`s. [topher]
      //
      // Advance time by one day and mine a new block
      // await helpers.time.increase(86400);
      // 2 days
      await helpers.time.increase(172800);
      // 1 hour
      // await time.increase(3600);
      //
      // nothing is working...
      // await time.increase(172800);
      // await helpers.time.increase(172800);
      // await hre.helpers.time.increase(172800);

      return { ...deployValues, proposalId };
    }

    it("should set the initial state of the proposal", async () => {
      const { governor, proposalId } = await loadFixture(afterProposingFixture);

      const state = await governor.state(proposalId);
      assert.equal(state, 0);
    });

    describe("after voting", () => {
      async function afterVotingFixture() {
        const proposingValues = await afterProposingFixture();
        const { governor, proposalId } = proposingValues;

        // NOTES:
        // 1. the owner (the 1st signer) is connected to this instance by
        //    default.
        //
        // 2. The owner has a weight of 10000 tokens which will be enough for
        //    the vote to be successful.
        //
        // 3. Normally the next step would be to queue the proposal in the
        //    `Timelock` to wait for some period before execution, but that has
        //    been excluded from the project to simplify things (go ahead and
        //    execute this after the voting period has ended).
        const tx = await governor.castVote(proposalId, 1);
        const receipt = await tx.wait();
        const voteCastEvent = receipt.events.find(
          (x) => x.event === "VoteCast"
        );

        // wait for the 1 block voting period
        await hre.network.provider.send("evm_mine");

        return { ...proposingValues, voteCastEvent };
      }

      it("should have set the vote", async () => {
        const { voteCastEvent, owner } = await loadFixture(afterVotingFixture);

        assert.equal(voteCastEvent.args.voter, owner.address);
        assert.equal(
          voteCastEvent.args.weight.toString(),
          parseEther("10000").toString()
        );
      });

      it("should allow executing the proposal", async () => {
        const { governor, token, owner } = await loadFixture(
          afterVotingFixture
        );

        await governor.execute(
          [token.address],
          [0],
          [
            token.interface.encodeFunctionData("mint", [
              owner.address,
              parseEther("25000"),
            ]),
          ],
          keccak256(toUtf8Bytes("Give the owner more tokens!"))
        );

        const balance = await token.balanceOf(owner.address);
        assert.equal(balance.toString(), parseEther("35000").toString());
      });
    });
  });
});
