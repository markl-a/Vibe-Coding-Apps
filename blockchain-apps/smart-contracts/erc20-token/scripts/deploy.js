const hre = require("hardhat");

async function main() {
  console.log("Starting MyToken deployment...\n");

  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());
  console.log("");

  // Deploy the token
  console.log("Deploying MyToken...");
  const Token = await hre.ethers.getContractFactory("MyToken");
  const token = await Token.deploy();

  await token.deployed();

  console.log("✅ MyToken deployed to:", token.address);
  console.log("");

  // Display token information
  const name = await token.name();
  const symbol = await token.symbol();
  const decimals = await token.decimals();
  const totalSupply = await token.totalSupply();
  const maxSupply = await token.MAX_SUPPLY();

  console.log("Token Information:");
  console.log("------------------");
  console.log("Name:", name);
  console.log("Symbol:", symbol);
  console.log("Decimals:", decimals);
  console.log("Initial Supply:", ethers.utils.formatEther(totalSupply), symbol);
  console.log("Max Supply:", ethers.utils.formatEther(maxSupply), symbol);
  console.log("Owner:", await token.owner());
  console.log("");

  // Wait for block confirmations before verification
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("Waiting for block confirmations...");
    await token.deployTransaction.wait(6);
    console.log("Block confirmations completed!");
    console.log("");

    // Verify the contract
    console.log("Verifying contract on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: token.address,
        constructorArguments: [],
      });
      console.log("✅ Contract verified successfully!");
    } catch (error) {
      if (error.message.toLowerCase().includes("already verified")) {
        console.log("✅ Contract already verified!");
      } else {
        console.log("❌ Error verifying contract:", error.message);
      }
    }
  }

  console.log("\n🎉 Deployment completed successfully!");
  console.log("\nNext steps:");
  console.log("1. Save the contract address:", token.address);
  console.log("2. Update your frontend/backend with the new address");
  console.log("3. Consider transferring ownership if needed");
  console.log("4. Test the contract on block explorer");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
