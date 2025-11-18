const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying NFT Marketplace contracts...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log(
    "Account balance:",
    hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)),
    "ETH\n"
  );

  // Deploy VibeNFT
  console.log("📝 Deploying VibeNFT...");
  const VibeNFT = await hre.ethers.getContractFactory("VibeNFT");
  const vibeNFT = await VibeNFT.deploy(
    "Vibe NFT Collection", // name
    "VIBE", // symbol
    10000, // maxSupply
    hre.ethers.parseEther("0.01"), // mintPrice (0.01 ETH)
    500, // royaltyBasisPoints (5%)
    5 // maxMintPerAddress
  );
  await vibeNFT.waitForDeployment();
  const nftAddress = await vibeNFT.getAddress();
  console.log("✅ VibeNFT deployed to:", nftAddress);

  // Deploy VibeMarketplace
  console.log("\n📝 Deploying VibeMarketplace...");
  const VibeMarketplace = await hre.ethers.getContractFactory("VibeMarketplace");
  const vibeMarketplace = await VibeMarketplace.deploy(deployer.address);
  await vibeMarketplace.waitForDeployment();
  const marketplaceAddress = await vibeMarketplace.getAddress();
  console.log("✅ VibeMarketplace deployed to:", marketplaceAddress);

  // Display deployment summary
  console.log("\n" + "=".repeat(60));
  console.log("📋 DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log("Network:", hre.network.name);
  console.log("Deployer:", deployer.address);
  console.log("\n🎨 NFT Contract:");
  console.log("  Address:", nftAddress);
  console.log("  Name: Vibe NFT Collection");
  console.log("  Symbol: VIBE");
  console.log("  Max Supply: 10,000");
  console.log("  Mint Price: 0.01 ETH");
  console.log("  Royalty: 5%");
  console.log("  Max Mint Per Address: 5");
  console.log("\n🛍️ Marketplace Contract:");
  console.log("  Address:", marketplaceAddress);
  console.log("  Platform Fee: 2.5%");
  console.log("  Fee Recipient:", deployer.address);
  console.log("=".repeat(60));

  // Save deployment addresses
  const fs = require("fs");
  const deploymentInfo = {
    network: hre.network.name,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      VibeNFT: {
        address: nftAddress,
        args: [
          "Vibe NFT Collection",
          "VIBE",
          10000,
          hre.ethers.parseEther("0.01").toString(),
          500,
          5,
        ],
      },
      VibeMarketplace: {
        address: marketplaceAddress,
        args: [deployer.address],
      },
    },
  };

  const deploymentPath = `./deployments-${hre.network.name}.json`;
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n💾 Deployment info saved to ${deploymentPath}`);

  // Verification instructions
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\n📝 To verify contracts on Etherscan, run:");
    console.log(
      `npx hardhat verify --network ${hre.network.name} ${nftAddress} "Vibe NFT Collection" "VIBE" 10000 ${hre.ethers.parseEther("0.01")} 500 5`
    );
    console.log(
      `npx hardhat verify --network ${hre.network.name} ${marketplaceAddress} ${deployer.address}`
    );
  }

  console.log("\n✨ Deployment complete!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
