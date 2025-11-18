const hre = require("hardhat");

async function main() {
  console.log("🚀 部署 Lending Protocol...\n");

  const [deployer] = await ethers.getSigners();
  console.log("部署者:", deployer.address);

  // 部署 LendingPool
  const LendingPool = await ethers.getContractFactory("LendingPool");
  const pool = await LendingPool.deploy();
  await pool.waitForDeployment();

  const poolAddress = await pool.getAddress();
  console.log("✅ LendingPool 部署至:", poolAddress);

  // 部署測試代幣 (僅測試網)
  if (hre.network.name === "localhost") {
    const Token = await ethers.getContractFactory("ERC20Mock");

    const dai = await Token.deploy("DAI", "DAI");
    await dai.waitForDeployment();
    console.log("   DAI 部署至:", await dai.getAddress());

    const usdc = await Token.deploy("USDC", "USDC");
    await usdc.waitForDeployment();
    console.log("   USDC 部署至:", await usdc.getAddress());

    // 初始化資產
    await pool.initReserve(
      await dai.getAddress(),
      7500, 8000, 500,
      "Aave DAI", "aDAI"
    );
    console.log("   DAI 資產池已初始化");

    await pool.initReserve(
      await usdc.getAddress(),
      8000, 8500, 500,
      "Aave USDC", "aUSDC"
    );
    console.log("   USDC 資產池已初始化");
  }

  console.log("\n✨ 部署完成!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
