const hre = require("hardhat");

async function main() {
  console.log("🚀 開始部署 DEX Swap 合約...\n");

  // 獲取部署者地址
  const [deployer] = await ethers.getSigners();
  console.log("📝 部署者地址:", deployer.address);
  console.log("💰 部署者餘額:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // 1. 部署 Factory
  console.log("1️⃣  部署 DEXFactory...");
  const Factory = await ethers.getContractFactory("DEXFactory");
  const factory = await Factory.deploy();
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("✅ DEXFactory 部署至:", factoryAddress, "\n");

  // 2. 部署 Router
  console.log("2️⃣  部署 DEXRouter...");
  const Router = await ethers.getContractFactory("DEXRouter");
  const router = await Router.deploy(factoryAddress);
  await router.waitForDeployment();
  const routerAddress = await router.getAddress();
  console.log("✅ DEXRouter 部署至:", routerAddress, "\n");

  // 3. 部署測試代幣（僅在本地/測試網）
  if (hre.network.name === "localhost" || hre.network.name === "sepolia") {
    console.log("3️⃣  部署測試代幣...");

    const Token = await ethers.getContractFactory("ERC20Mock");

    const tokenA = await Token.deploy("Token A", "TKA");
    await tokenA.waitForDeployment();
    const tokenAAddress = await tokenA.getAddress();
    console.log("   Token A 部署至:", tokenAAddress);

    const tokenB = await Token.deploy("Token B", "TKB");
    await tokenB.waitForDeployment();
    const tokenBAddress = await tokenB.getAddress();
    console.log("   Token B 部署至:", tokenBAddress);

    const tokenC = await Token.deploy("Token C", "TKC");
    await tokenC.waitForDeployment();
    const tokenCAddress = await tokenC.getAddress();
    console.log("   Token C 部署至:", tokenCAddress, "\n");

    // 4. 創建測試交易對
    console.log("4️⃣  創建測試交易對...");
    const tx1 = await factory.createPair(tokenAAddress, tokenBAddress);
    await tx1.wait();
    const pairAB = await factory.getPair(tokenAAddress, tokenBAddress);
    console.log("   TKA-TKB 交易對:", pairAB);

    const tx2 = await factory.createPair(tokenBAddress, tokenCAddress);
    await tx2.wait();
    const pairBC = await factory.getPair(tokenBAddress, tokenCAddress);
    console.log("   TKB-TKC 交易對:", pairBC, "\n");
  }

  // 5. 保存部署信息
  console.log("💾 保存部署信息...");
  const deployments = {
    network: hre.network.name,
    factory: factoryAddress,
    router: routerAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
  };

  const fs = require("fs");
  const path = require("path");
  const deploymentsDir = path.join(__dirname, "../deployments");

  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  fs.writeFileSync(
    path.join(deploymentsDir, `${hre.network.name}.json`),
    JSON.stringify(deployments, null, 2)
  );
  console.log("✅ 部署信息已保存\n");

  // 6. 驗證合約（如果在測試網上）
  if (hre.network.name === "sepolia" && process.env.ETHERSCAN_API_KEY) {
    console.log("🔍 等待區塊確認後驗證合約...");
    await factory.deploymentTransaction().wait(6);

    console.log("驗證 Factory...");
    try {
      await hre.run("verify:verify", {
        address: factoryAddress,
        constructorArguments: [],
      });
    } catch (error) {
      console.log("驗證失敗:", error.message);
    }

    console.log("驗證 Router...");
    try {
      await hre.run("verify:verify", {
        address: routerAddress,
        constructorArguments: [factoryAddress],
      });
    } catch (error) {
      console.log("驗證失敗:", error.message);
    }
  }

  console.log("\n✨ 部署完成！");
  console.log("=====================================");
  console.log("Factory:", factoryAddress);
  console.log("Router:", routerAddress);
  console.log("=====================================\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
