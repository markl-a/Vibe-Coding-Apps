const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting MyNFT deployment...\n");

  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());
  console.log("");

  // NFT Configuration
  const NAME = "MyNFT Collection";
  const SYMBOL = "MNFT";
  const BASE_URI = "ipfs://QmYourBaseURI/"; // Update this
  const NOT_REVEALED_URI = "ipfs://QmYourNotRevealedURI"; // Update this

  console.log("NFT Configuration:");
  console.log("------------------");
  console.log("Name:", NAME);
  console.log("Symbol:", SYMBOL);
  console.log("Base URI:", BASE_URI);
  console.log("Not Revealed URI:", NOT_REVEALED_URI);
  console.log("");

  // Deploy the NFT contract
  console.log("Deploying MyNFT...");
  const NFT = await hre.ethers.getContractFactory("MyNFT");
  const nft = await NFT.deploy(NAME, SYMBOL, BASE_URI, NOT_REVEALED_URI);

  await nft.deployed();

  console.log("✅ MyNFT deployed to:", nft.address);
  console.log("");

  // Display contract information
  const maxSupply = await nft.MAX_SUPPLY();
  const maxPerWallet = await nft.MAX_PER_WALLET();
  const whitelistPrice = await nft.WHITELIST_PRICE();
  const publicPrice = await nft.PUBLIC_PRICE();

  console.log("Contract Information:");
  console.log("--------------------");
  console.log("Max Supply:", maxSupply.toString());
  console.log("Max Per Wallet:", maxPerWallet.toString());
  console.log("Whitelist Price:", ethers.utils.formatEther(whitelistPrice), "ETH");
  console.log("Public Price:", ethers.utils.formatEther(publicPrice), "ETH");
  console.log("Owner:", await nft.owner());
  console.log("");

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    contract: nft.address,
    deployer: deployer.address,
    name: NAME,
    symbol: SYMBOL,
    maxSupply: maxSupply.toString(),
    whitelistPrice: ethers.utils.formatEther(whitelistPrice),
    publicPrice: ethers.utils.formatEther(publicPrice),
    timestamp: new Date().toISOString(),
  };

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  fs.writeFileSync(
    path.join(deploymentsDir, `${network.name}.json`),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("📝 Deployment info saved to deployments/" + network.name + ".json");
  console.log("");

  // Wait for block confirmations before verification
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("Waiting for block confirmations...");
    await nft.deployTransaction.wait(6);
    console.log("Block confirmations completed!");
    console.log("");

    // Verify the contract
    console.log("Verifying contract on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: nft.address,
        constructorArguments: [NAME, SYMBOL, BASE_URI, NOT_REVEALED_URI],
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
  console.log("1. Update BASE_URI with your IPFS metadata");
  console.log("2. Set Merkle root for whitelist: nft.setMerkleRoot(root)");
  console.log("3. Enable whitelist mint: nft.toggleWhitelistMint()");
  console.log("4. Enable public mint when ready: nft.togglePublicMint()");
  console.log("5. Reveal NFTs: nft.reveal()");
  console.log("\nContract address:", nft.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
