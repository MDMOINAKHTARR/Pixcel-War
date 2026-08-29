const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RaceWager Dynamic Open Matchmaking Tests", function () {
  let wager;
  let admin, reporter, racer1, racer2, racer3, racer4, lateRacer;
  let trackCity;
  const wagerAmount = ethers.parseEther("1.0"); // 1 MON

  beforeEach(async function () {
    [admin, reporter, racer1, racer2, racer3, racer4, lateRacer] = await ethers.getSigners();
    trackCity = ethers.keccak256(ethers.toUtf8Bytes("neon_city"));

    const RaceWager = await ethers.getContractFactory("RaceWager");
    wager = await RaceWager.deploy(admin.address, reporter.address);
    await wager.waitForDeployment();
  });

  it("should create an open match for up to 4 players without pre-known addresses", async function () {
    const tx = await wager.createMatch(trackCity, wagerAmount, 4);
    await tx.wait();

    const m = await wager.matches(1);
    expect(m.matchId).to.equal(1);
    expect(m.trackId).to.equal(trackCity);
    expect(m.wagerAmount).to.equal(wagerAmount);
    expect(m.maxPlayers).to.equal(4);
    expect(m.state).to.equal(0); // Open
  });

  it("should allow racers to joinMatch dynamically by escrowing MON", async function () {
    await wager.createMatch(trackCity, wagerAmount, 3);

    // Racer 1 joins
    await expect(wager.connect(racer1).joinMatch(1, { value: wagerAmount }))
      .to.emit(wager, "PlayerJoined")
      .withArgs(1, racer1.address, wagerAmount, 1);

    // Racer 2 joins
    await wager.connect(racer2).joinMatch(1, { value: wagerAmount });

    const m = await wager.matches(1);
    expect(m.totalPool).to.equal(ethers.parseEther("2.0"));
    expect(await wager.hasDeposited(1, racer1.address)).to.be.true;
    expect(await wager.hasDeposited(1, racer2.address)).to.be.true;
  });

  it("should reject double-joining or wrong deposit value", async function () {
    await wager.createMatch(trackCity, wagerAmount, 4);

    await wager.connect(racer1).joinMatch(1, { value: wagerAmount });

    // Double join
    await expect(
      wager.connect(racer1).joinMatch(1, { value: wagerAmount })
    ).to.be.revertedWith("Already joined match");

    // Underpayment
    await expect(
      wager.connect(racer2).joinMatch(1, { value: ethers.parseEther("0.5") })
    ).to.be.revertedWith("Incorrect wager amount sent");
  });

  it("should enforce maxPlayers capacity on joinMatch", async function () {
    await wager.createMatch(trackCity, wagerAmount, 2);

    await wager.connect(racer1).joinMatch(1, { value: wagerAmount });
    await wager.connect(racer2).joinMatch(1, { value: wagerAmount });

    // 3rd racer exceeds capacity
    await expect(
      wager.connect(lateRacer).joinMatch(1, { value: wagerAmount })
    ).to.be.revertedWith("Match is full");
  });

  it("should complete full server-driven flow: join -> lock -> report -> payout", async function () {
    await wager.createMatch(trackCity, wagerAmount, 3);
    await wager.connect(racer1).joinMatch(1, { value: wagerAmount });
    await wager.connect(racer2).joinMatch(1, { value: wagerAmount });

    // Server locks match
    await wager.connect(reporter).lockMatch(1);
    const lockedMatch = await wager.matches(1);
    expect(lockedMatch.state).to.equal(1); // Locked

    // Server reports final finishing order with racer1 as winner
    const balanceBefore = await ethers.provider.getBalance(racer1.address);
    const rankedFinishers = [racer1.address, racer2.address];

    await wager.connect(reporter).reportResult(1, rankedFinishers);

    const balanceAfter = await ethers.provider.getBalance(racer1.address);
    expect(balanceAfter - balanceBefore).to.equal(ethers.parseEther("2.0"));

    const settledMatch = await wager.matches(1);
    expect(settledMatch.state).to.equal(2); // Settled
    expect(settledMatch.winner).to.equal(racer1.address);
    expect(settledMatch.totalPool).to.equal(0);
  });

  it("should allow timeout refund if server stalls during a locked match", async function () {
    await wager.createMatch(trackCity, wagerAmount, 2);
    await wager.connect(racer1).joinMatch(1, { value: wagerAmount });
    await wager.connect(racer2).joinMatch(1, { value: wagerAmount });
    await wager.connect(reporter).lockMatch(1);

    // Warp time past 15 min lock timeout
    await ethers.provider.send("evm_increaseTime", [960]);
    await ethers.provider.send("evm_mine");

    const balBefore = await ethers.provider.getBalance(racer1.address);
    const tx = await wager.connect(racer1).claimRefund(1);
    const receipt = await tx.wait();
    const gasSpent = receipt.gasUsed * receipt.gasPrice;

    const balAfter = await ethers.provider.getBalance(racer1.address);
    expect(balAfter + gasSpent - balBefore).to.equal(wagerAmount);
  });
});
