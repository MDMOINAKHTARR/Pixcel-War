const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RaceLeaderboard Contract", function () {
  let leaderboard;
  let admin, reporter, racer1, racer2, racer3, nonReporter;
  let trackCity, trackDesert;

  beforeEach(async function () {
    [admin, reporter, racer1, racer2, racer3, nonReporter] = await ethers.getSigners();

    trackCity = ethers.keccak256(ethers.toUtf8Bytes("neon_city"));
    trackDesert = ethers.keccak256(ethers.toUtf8Bytes("desert_dunes"));

    const RaceLeaderboard = await ethers.getContractFactory("RaceLeaderboard");
    leaderboard = await RaceLeaderboard.deploy(admin.address, reporter.address);
    await leaderboard.waitForDeployment();
  });

  it("should initialize roles correctly", async function () {
    const DEFAULT_ADMIN_ROLE = await leaderboard.DEFAULT_ADMIN_ROLE();
    const REPORTER_ROLE = await leaderboard.REPORTER_ROLE();

    expect(await leaderboard.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.be.true;
    expect(await leaderboard.hasRole(REPORTER_ROLE, reporter.address)).to.be.true;
    expect(await leaderboard.hasRole(REPORTER_ROLE, nonReporter.address)).to.be.false;
  });

  it("should reject submissions from non-reporters", async function () {
    await expect(
      leaderboard.connect(nonReporter).submitResult(trackCity, racer1.address, 45200)
    ).to.be.revertedWithCustomError(leaderboard, "AccessControlUnauthorizedAccount");
  });

  it("should record initial result as personal best", async function () {
    await leaderboard.connect(reporter).submitResult(trackCity, racer1.address, 45200);

    const best = await leaderboard.getPlayerBest(trackCity, racer1.address);
    expect(best).to.equal(45200);

    const topTimes = await leaderboard.getTopTimes(trackCity, 10);
    expect(topTimes.length).to.equal(1);
    expect(topTimes[0].player).to.equal(racer1.address);
    expect(topTimes[0].timeMs).to.equal(45200);
  });

  it("should update personal best when a faster time is submitted", async function () {
    await leaderboard.connect(reporter).submitResult(trackCity, racer1.address, 50000);
    expect(await leaderboard.getPlayerBest(trackCity, racer1.address)).to.equal(50000);

    // Faster time (42000 < 50000)
    await leaderboard.connect(reporter).submitResult(trackCity, racer1.address, 42000);
    expect(await leaderboard.getPlayerBest(trackCity, racer1.address)).to.equal(42000);

    const topTimes = await leaderboard.getTopTimes(trackCity, 10);
    expect(topTimes.length).to.equal(1);
    expect(topTimes[0].timeMs).to.equal(42000);
  });

  it("should ignore slower times and retain personal best", async function () {
    await leaderboard.connect(reporter).submitResult(trackCity, racer1.address, 42000);

    // Slower time (48000 > 42000)
    await leaderboard.connect(reporter).submitResult(trackCity, racer1.address, 48000);
    expect(await leaderboard.getPlayerBest(trackCity, racer1.address)).to.equal(42000);

    const topTimes = await leaderboard.getTopTimes(trackCity, 10);
    expect(topTimes[0].timeMs).to.equal(42000);
  });

  it("should sort leaderboard entries fastest to slowest", async function () {
    await leaderboard.connect(reporter).submitResult(trackCity, racer1.address, 45000);
    await leaderboard.connect(reporter).submitResult(trackCity, racer2.address, 41000); // 1st
    await leaderboard.connect(reporter).submitResult(trackCity, racer3.address, 43500); // 2nd

    const topTimes = await leaderboard.getTopTimes(trackCity, 10);
    expect(topTimes.length).to.equal(3);
    expect(topTimes[0].player).to.equal(racer2.address);
    expect(topTimes[0].timeMs).to.equal(41000);

    expect(topTimes[1].player).to.equal(racer3.address);
    expect(topTimes[1].timeMs).to.equal(43500);

    expect(topTimes[2].player).to.equal(racer1.address);
    expect(topTimes[2].timeMs).to.equal(45000);
  });

  it("should support separate leaderboards across multiple trackIds", async function () {
    await leaderboard.connect(reporter).submitResult(trackCity, racer1.address, 40000);
    await leaderboard.connect(reporter).submitResult(trackDesert, racer1.address, 55000);

    expect(await leaderboard.getPlayerBest(trackCity, racer1.address)).to.equal(40000);
    expect(await leaderboard.getPlayerBest(trackDesert, racer1.address)).to.equal(55000);
  });
});
