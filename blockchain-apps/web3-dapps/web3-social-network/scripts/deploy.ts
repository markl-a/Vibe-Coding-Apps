/**
 * 部署腳本
 * 部署所有智能合約到指定網絡
 */

import { ethers } from 'hardhat';

async function main() {
  console.log('🚀 開始部署 Web3 Social Network 合約...\n');

  const [deployer] = await ethers.getSigners();
  console.log('部署地址:', deployer.address);
  console.log('賬戶餘額:', ethers.formatEther(await ethers.provider.getBalance(deployer.address)), 'ETH\n');

  // 1. 部署 UserProfile 合約
  console.log('📝 部署 UserProfile 合約...');
  const UserProfile = await ethers.getContractFactory('UserProfile');
  const userProfile = await UserProfile.deploy();
  await userProfile.waitForDeployment();
  const userProfileAddress = await userProfile.getAddress();
  console.log('✅ UserProfile 已部署:', userProfileAddress, '\n');

  // 2. 部署 SocialPost 合約
  console.log('📝 部署 SocialPost 合約...');
  const SocialPost = await ethers.getContractFactory('SocialPost');
  const socialPost = await SocialPost.deploy();
  await socialPost.waitForDeployment();
  const socialPostAddress = await socialPost.getAddress();
  console.log('✅ SocialPost 已部署:', socialPostAddress, '\n');

  // 3. 部署 SocialToken 合約
  console.log('📝 部署 SocialToken 合約...');
  const SocialToken = await ethers.getContractFactory('SocialToken');
  const socialToken = await SocialToken.deploy();
  await socialToken.waitForDeployment();
  const socialTokenAddress = await socialToken.getAddress();
  console.log('✅ SocialToken 已部署:', socialTokenAddress, '\n');

  // 4. 部署 TipJar 合約
  console.log('📝 部署 TipJar 合約...');
  const TipJar = await ethers.getContractFactory('TipJar');
  const tipJar = await TipJar.deploy(socialPostAddress);
  await tipJar.waitForDeployment();
  const tipJarAddress = await tipJar.getAddress();
  console.log('✅ TipJar 已部署:', tipJarAddress, '\n');

  // 5. 配置合約（添加支持的代幣等）
  console.log('⚙️  配置合約...');
  await tipJar.addSupportedToken(socialTokenAddress);
  console.log('✅ 已添加 SocialToken 到 TipJar 支持的代幣列表\n');

  // 打印部署摘要
  console.log('=' .repeat(60));
  console.log('🎉 部署完成！\n');
  console.log('📋 合約地址摘要:');
  console.log('=' .repeat(60));
  console.log('UserProfile:  ', userProfileAddress);
  console.log('SocialPost:   ', socialPostAddress);
  console.log('SocialToken:  ', socialTokenAddress);
  console.log('TipJar:       ', tipJarAddress);
  console.log('=' .repeat(60));
  console.log('\n📝 請將以上地址更新到 .env 文件中:');
  console.log(`VITE_USER_PROFILE_CONTRACT=${userProfileAddress}`);
  console.log(`VITE_SOCIAL_POST_CONTRACT=${socialPostAddress}`);
  console.log(`VITE_SOCIAL_TOKEN_CONTRACT=${socialTokenAddress}`);
  console.log(`VITE_TIP_JAR_CONTRACT=${tipJarAddress}`);
  console.log('\n✨ 部署腳本執行完成！');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ 部署失敗:', error);
    process.exit(1);
  });
