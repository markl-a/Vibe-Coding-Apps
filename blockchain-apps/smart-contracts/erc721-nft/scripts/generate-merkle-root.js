/**
 * Generate Merkle Root for Whitelist
 *
 * This script generates a Merkle root from a list of whitelisted addresses.
 * The Merkle root can then be set in the smart contract for whitelist verification.
 */

const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🌳 Generating Merkle Root for Whitelist\n");
  console.log("=".repeat(80));

  // Load whitelist addresses
  const whitelistPath = path.join(__dirname, "../whitelist.json");

  let whitelist;
  if (fs.existsSync(whitelistPath)) {
    whitelist = JSON.parse(fs.readFileSync(whitelistPath, "utf8"));
    console.log(`\n✅ Loaded ${whitelist.addresses.length} addresses from whitelist.json`);
  } else {
    // Create sample whitelist
    console.log("\n⚠️  whitelist.json not found. Creating sample file...");

    whitelist = {
      addresses: [
        "0x1234567890123456789012345678901234567890",
        "0x2345678901234567890123456789012345678901",
        "0x3456789012345678901234567890123456789012",
      ],
    };

    fs.writeFileSync(whitelistPath, JSON.stringify(whitelist, null, 2));
    console.log("✅ Sample whitelist.json created");
    console.log("⚠️  Please update whitelist.json with real addresses!");
  }

  console.log("\n📋 Whitelist Addresses:");
  console.log("-".repeat(80));
  whitelist.addresses.forEach((addr, index) => {
    console.log(`${index + 1}. ${addr}`);
  });

  // Generate Merkle tree
  console.log("\n🔨 Building Merkle Tree...");

  const leaves = whitelist.addresses.map((addr) => keccak256(addr));
  const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
  const root = tree.getHexRoot();

  console.log("✅ Merkle Tree built successfully!");

  console.log("\n📊 Merkle Tree Information:");
  console.log("-".repeat(80));
  console.log("Total Addresses:", whitelist.addresses.length);
  console.log("Tree Depth:", tree.getDepth());
  console.log("Leaf Count:", tree.getLeafCount());
  console.log("\n🔑 Merkle Root:");
  console.log(root);

  // Save Merkle tree data
  const merkleData = {
    root: root,
    totalAddresses: whitelist.addresses.length,
    generatedAt: new Date().toISOString(),
    tree: {
      depth: tree.getDepth(),
      leafCount: tree.getLeafCount(),
    },
  };

  fs.writeFileSync(
    path.join(__dirname, "../merkle-data.json"),
    JSON.stringify(merkleData, null, 2)
  );

  console.log("\n📝 Merkle data saved to merkle-data.json");

  // Generate sample proofs
  console.log("\n🔍 Sample Proofs:");
  console.log("-".repeat(80));

  const sampleAddresses = whitelist.addresses.slice(0, 3);
  const proofs = {};

  sampleAddresses.forEach((addr) => {
    const leaf = keccak256(addr);
    const proof = tree.getHexProof(leaf);
    proofs[addr] = proof;

    console.log(`\nAddress: ${addr}`);
    console.log(`Proof: [${proof.map(p => `"${p}"`).join(", ")}]`);
  });

  // Save proofs
  fs.writeFileSync(
    path.join(__dirname, "../sample-proofs.json"),
    JSON.stringify(proofs, null, 2)
  );

  console.log("\n📝 Sample proofs saved to sample-proofs.json");

  console.log("\n" + "=".repeat(80));
  console.log("\n✨ Merkle Root Generation Complete!\n");

  console.log("📝 Next Steps:");
  console.log("1. Update whitelist.json with your actual whitelist addresses");
  console.log("2. Run this script again to generate the final Merkle root");
  console.log("3. Set the Merkle root in your contract:");
  console.log(`   await nft.setMerkleRoot("${root}")`);
  console.log("4. Users can get their proof from sample-proofs.json");
  console.log("5. Or generate proofs on-demand using the Merkle tree\n");

  // Verification example
  console.log("🧪 Verification Example:");
  console.log("-".repeat(80));
  console.log("// JavaScript/TypeScript");
  console.log(`const leaf = keccak256("YOUR_ADDRESS");`);
  console.log(`const proof = tree.getHexProof(leaf);`);
  console.log(`await nft.whitelistMint(quantity, proof, { value: price });`);
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
