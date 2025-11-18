const hre = require("hardhat");

async function main() {
  console.log("Deploying MultiSig Wallet...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Configuration - UPDATE THESE!
  const OWNERS = [
    deployer.address,
    // Add more owner addresses
  ];
  const REQUIRED_APPROVALS = 2;
  const DAILY_LIMIT = ethers.utils.parseEther("1"); // 1 ETH

  console.log("Configuration:");
  console.log("Owners:", OWNERS);
  console.log("Required Approvals:", REQUIRED_APPROVALS);
  console.log("Daily Limit:", ethers.utils.formatEther(DAILY_LIMIT), "ETH\n");

  const MultiSig = await hre.ethers.getContractFactory("MultiSigWallet");
  const wallet = await MultiSig.deploy(OWNERS, REQUIRED_APPROVALS, DAILY_LIMIT);

  await wallet.deployed();

  console.log("✅ MultiSigWallet deployed to:", wallet.address);

  if (network.name !== "hardhat") {
    console.log("\nWaiting for confirmations...");
    await wallet.deployTransaction.wait(6);

    console.log("Verifying contract...");
    await hre.run("verify:verify", {
      address: wallet.address,
      constructorArguments: [OWNERS, REQUIRED_APPROVALS, DAILY_LIMIT],
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
