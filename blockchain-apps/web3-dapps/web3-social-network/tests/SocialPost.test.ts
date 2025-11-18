/**
 * SocialPost 合約測試
 */

import { expect } from 'chai';
import { ethers } from 'hardhat';
import { SocialPost } from '../typechain-types';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';

describe('SocialPost', function () {
  let socialPost: SocialPost;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const SocialPost = await ethers.getContractFactory('SocialPost');
    socialPost = await SocialPost.deploy();
    await socialPost.waitForDeployment();
  });

  describe('創建貼文', function () {
    it('應該成功創建貼文', async function () {
      const ipfsHash = 'QmTest123';
      const tags = ['區塊鏈', 'Web3'];

      const tx = await socialPost.connect(user1).createPost(ipfsHash, tags);
      await tx.wait();

      const post = await socialPost.getPost(1);

      expect(post.id).to.equal(1);
      expect(post.author).to.equal(user1.address);
      expect(post.ipfsHash).to.equal(ipfsHash);
      expect(post.tags).to.deep.equal(tags);
      expect(post.likes).to.equal(0);
      expect(post.isDeleted).to.equal(false);
    });

    it('應該拒絕空 IPFS hash', async function () {
      await expect(
        socialPost.connect(user1).createPost('', ['tag1'])
      ).to.be.revertedWith('IPFS hash cannot be empty');
    });

    it('應該發出 PostCreated 事件', async function () {
      const ipfsHash = 'QmTest123';
      const tags = ['test'];

      await expect(socialPost.connect(user1).createPost(ipfsHash, tags))
        .to.emit(socialPost, 'PostCreated')
        .withArgs(1, user1.address, ipfsHash, tags, await ethers.provider.getBlock('latest').then(b => b!.timestamp + 1));
    });
  });

  describe('點讚功能', function () {
    beforeEach(async function () {
      await socialPost.connect(user1).createPost('QmTest123', ['tag1']);
    });

    it('應該成功點讚貼文', async function () {
      await socialPost.connect(user2).likePost(1);

      const post = await socialPost.getPost(1);
      expect(post.likes).to.equal(1);

      const hasLiked = await socialPost.hasLiked(1, user2.address);
      expect(hasLiked).to.equal(true);
    });

    it('應該拒絕重複點讚', async function () {
      await socialPost.connect(user2).likePost(1);

      await expect(
        socialPost.connect(user2).likePost(1)
      ).to.be.revertedWith('Already liked');
    });

    it('應該成功取消點讚', async function () {
      await socialPost.connect(user2).likePost(1);
      await socialPost.connect(user2).unlikePost(1);

      const post = await socialPost.getPost(1);
      expect(post.likes).to.equal(0);

      const hasLiked = await socialPost.hasLiked(1, user2.address);
      expect(hasLiked).to.equal(false);
    });
  });

  describe('評論功能', function () {
    beforeEach(async function () {
      await socialPost.connect(user1).createPost('QmTest123', ['tag1']);
    });

    it('應該成功添加評論', async function () {
      const commentContent = '這是一條評論';

      await socialPost.connect(user2).addComment(1, commentContent);

      const comments = await socialPost.getComments(1);
      expect(comments.length).to.equal(1);
      expect(comments[0].author).to.equal(user2.address);
      expect(comments[0].content).to.equal(commentContent);
    });

    it('應該拒絕空評論', async function () {
      await expect(
        socialPost.connect(user2).addComment(1, '')
      ).to.be.revertedWith('Comment cannot be empty');
    });
  });

  describe('關注功能', function () {
    it('應該成功關注用戶', async function () {
      await socialPost.connect(user1).followUser(user2.address);

      const isFollowing = await socialPost.isFollowing(user1.address, user2.address);
      expect(isFollowing).to.equal(true);

      const followers = await socialPost.getFollowers(user2.address);
      expect(followers).to.include(user1.address);
    });

    it('應該拒絕關注自己', async function () {
      await expect(
        socialPost.connect(user1).followUser(user1.address)
      ).to.be.revertedWith('Cannot follow yourself');
    });

    it('應該成功取消關注', async function () {
      await socialPost.connect(user1).followUser(user2.address);
      await socialPost.connect(user1).unfollowUser(user2.address);

      const isFollowing = await socialPost.isFollowing(user1.address, user2.address);
      expect(isFollowing).to.equal(false);
    });
  });

  describe('刪除貼文', function () {
    beforeEach(async function () {
      await socialPost.connect(user1).createPost('QmTest123', ['tag1']);
    });

    it('應該允許作者刪除貼文', async function () {
      await socialPost.connect(user1).deletePost(1);

      const post = await socialPost.getPost(1);
      expect(post.isDeleted).to.equal(true);
    });

    it('應該拒絕非作者刪除貼文', async function () {
      await expect(
        socialPost.connect(user2).deletePost(1)
      ).to.be.revertedWith('Not the author');
    });

    it('刪除後應該無法點讚', async function () {
      await socialPost.connect(user1).deletePost(1);

      await expect(
        socialPost.connect(user2).likePost(1)
      ).to.be.revertedWith('Post has been deleted');
    });
  });

  describe('獲取用戶貼文', function () {
    it('應該正確返回用戶的所有貼文', async function () {
      await socialPost.connect(user1).createPost('QmTest1', ['tag1']);
      await socialPost.connect(user1).createPost('QmTest2', ['tag2']);
      await socialPost.connect(user2).createPost('QmTest3', ['tag3']);

      const user1Posts = await socialPost.getUserPosts(user1.address);
      expect(user1Posts.length).to.equal(2);
      expect(user1Posts[0]).to.equal(1);
      expect(user1Posts[1]).to.equal(2);

      const user2Posts = await socialPost.getUserPosts(user2.address);
      expect(user2Posts.length).to.equal(1);
      expect(user2Posts[0]).to.equal(3);
    });
  });
});
