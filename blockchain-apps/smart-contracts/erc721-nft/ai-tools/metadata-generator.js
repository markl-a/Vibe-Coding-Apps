/**
 * AI-Powered NFT Metadata Generator
 *
 * Generates ERC721 metadata following the standard format.
 * Includes tools for:
 * - Batch metadata generation
 * - Attribute/trait management
 * - Rarity calculation
 * - IPFS preparation
 */

const fs = require('fs');
const path = require('path');

class MetadataGenerator {
  constructor(config = {}) {
    this.config = {
      name: config.name || 'My NFT',
      description: config.description || 'An awesome NFT collection',
      externalUrl: config.externalUrl || 'https://example.com',
      collectionSize: config.collectionSize || 10000,
      imageBaseUri: config.imageBaseUri || 'ipfs://QmYourImageCID/',
      animationBaseUri: config.animationBaseUri || null,
      ...config,
    };

    this.metadata = [];
    this.traits = {};
  }

  /**
   * Define trait categories and their possible values with rarity
   */
  defineTraits(traitDefinitions) {
    this.traits = traitDefinitions;
    console.log('📝 Trait Definitions Loaded');
    console.log('─'.repeat(80));

    Object.entries(traitDefinitions).forEach(([category, values]) => {
      console.log(`\n${category}:`);
      values.forEach(({ value, weight }) => {
        const percentage = ((weight / this.getTotalWeight(values)) * 100).toFixed(2);
        console.log(`  • ${value}: ${weight} (${percentage}%)`);
      });
    });
    console.log('\n' + '─'.repeat(80));
  }

  getTotalWeight(values) {
    return values.reduce((sum, item) => sum + item.weight, 0);
  }

  /**
   * Generate random trait based on weighted probabilities
   */
  selectWeightedRandom(values) {
    const totalWeight = this.getTotalWeight(values);
    let random = Math.random() * totalWeight;

    for (const item of values) {
      random -= item.weight;
      if (random <= 0) {
        return item.value;
      }
    }

    return values[0].value; // Fallback
  }

  /**
   * Generate metadata for a single token
   */
  generateToken(tokenId) {
    const attributes = [];

    // Generate random attributes based on trait definitions
    Object.entries(this.traits).forEach(([traitType, values]) => {
      const value = this.selectWeightedRandom(values);
      attributes.push({
        trait_type: traitType,
        value: value,
      });
    });

    // Calculate rarity score
    const rarityScore = this.calculateRarityScore(attributes);

    const metadata = {
      name: `${this.config.name} #${tokenId}`,
      description: this.config.description,
      image: `${this.config.imageBaseUri}${tokenId}.png`,
      external_url: `${this.config.externalUrl}/${tokenId}`,
      attributes: attributes,
      properties: {
        rarity_score: rarityScore,
        edition: tokenId,
      },
    };

    // Add animation if configured
    if (this.config.animationBaseUri) {
      metadata.animation_url = `${this.config.animationBaseUri}${tokenId}.mp4`;
    }

    return metadata;
  }

  /**
   * Calculate rarity score based on trait frequencies
   */
  calculateRarityScore(attributes) {
    let score = 0;

    attributes.forEach((attr) => {
      const traitValues = this.traits[attr.trait_type];
      if (traitValues) {
        const traitItem = traitValues.find((t) => t.value === attr.value);
        if (traitItem) {
          // Higher score for rarer traits (lower weight)
          const totalWeight = this.getTotalWeight(traitValues);
          const rarity = totalWeight / traitItem.weight;
          score += rarity;
        }
      }
    });

    return parseFloat(score.toFixed(2));
  }

  /**
   * Generate all metadata for the collection
   */
  generateCollection() {
    console.log('\n🎨 Generating NFT Metadata Collection...');
    console.log('═'.repeat(80));

    const startTime = Date.now();

    for (let i = 0; i < this.config.collectionSize; i++) {
      const metadata = this.generateToken(i);
      this.metadata.push(metadata);

      if ((i + 1) % 1000 === 0) {
        console.log(`Generated ${i + 1}/${this.config.collectionSize} tokens...`);
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`\n✅ Generated ${this.metadata.length} tokens in ${duration}s`);
    console.log('═'.repeat(80));

    this.analyzeCollection();
  }

  /**
   * Analyze collection for trait distribution and rarity
   */
  analyzeCollection() {
    console.log('\n📊 Collection Analysis');
    console.log('─'.repeat(80));

    // Trait distribution
    const distribution = {};

    this.metadata.forEach((token) => {
      token.attributes.forEach((attr) => {
        if (!distribution[attr.trait_type]) {
          distribution[attr.trait_type] = {};
        }
        if (!distribution[attr.trait_type][attr.value]) {
          distribution[attr.trait_type][attr.value] = 0;
        }
        distribution[attr.trait_type][attr.value]++;
      });
    });

    Object.entries(distribution).forEach(([trait, values]) => {
      console.log(`\n${trait}:`);
      Object.entries(values)
        .sort((a, b) => b[1] - a[1])
        .forEach(([value, count]) => {
          const percentage = ((count / this.metadata.length) * 100).toFixed(2);
          console.log(`  ${value}: ${count} (${percentage}%)`);
        });
    });

    // Rarity statistics
    const rarityScores = this.metadata.map((m) => m.properties.rarity_score);
    const avgRarity = (
      rarityScores.reduce((a, b) => a + b, 0) / rarityScores.length
    ).toFixed(2);
    const maxRarity = Math.max(...rarityScores).toFixed(2);
    const minRarity = Math.min(...rarityScores).toFixed(2);

    console.log('\n📈 Rarity Statistics:');
    console.log(`  Average: ${avgRarity}`);
    console.log(`  Max: ${maxRarity}`);
    console.log(`  Min: ${minRarity}`);

    console.log('\n' + '─'.repeat(80));
  }

  /**
   * Export metadata to files
   */
  exportMetadata(outputDir = '../metadata') {
    console.log('\n💾 Exporting Metadata Files...');
    console.log('─'.repeat(80));

    const dir = path.join(__dirname, outputDir);

    // Create directory if it doesn't exist
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Export individual files
    this.metadata.forEach((token, index) => {
      const filename = path.join(dir, `${index}.json`);
      fs.writeFileSync(filename, JSON.stringify(token, null, 2));
    });

    console.log(`✅ Exported ${this.metadata.length} metadata files to ${outputDir}/`);

    // Export collection metadata
    const collectionMetadata = {
      name: this.config.name,
      description: this.config.description,
      image: this.config.imageBaseUri + 'collection.png',
      external_link: this.config.externalUrl,
      seller_fee_basis_points: 500, // 5% royalty
      fee_recipient: '0x...', // Update with actual address
    };

    fs.writeFileSync(
      path.join(dir, 'collection.json'),
      JSON.stringify(collectionMetadata, null, 2)
    );

    console.log('✅ Exported collection.json');

    // Export rarity data
    const rarityData = this.metadata
      .map((token, index) => ({
        tokenId: index,
        name: token.name,
        rarityScore: token.properties.rarity_score,
        rank: 0, // Will be set after sorting
      }))
      .sort((a, b) => b.rarityScore - a.rarityScore)
      .map((item, index) => ({ ...item, rank: index + 1 }));

    fs.writeFileSync(
      path.join(dir, 'rarity.json'),
      JSON.stringify(rarityData, null, 2)
    );

    console.log('✅ Exported rarity.json');
    console.log('\n' + '─'.repeat(80));

    return dir;
  }

  /**
   * Generate sample preview
   */
  previewSample(count = 5) {
    console.log('\n👀 Sample Token Preview');
    console.log('═'.repeat(80));

    const samples = this.metadata.slice(0, count);

    samples.forEach((token, index) => {
      console.log(`\n[Token #${index}]`);
      console.log(`Name: ${token.name}`);
      console.log(`Rarity Score: ${token.properties.rarity_score}`);
      console.log('Attributes:');
      token.attributes.forEach((attr) => {
        console.log(`  • ${attr.trait_type}: ${attr.value}`);
      });
      console.log('─'.repeat(80));
    });
  }

  /**
   * Validate metadata against OpenSea standards
   */
  validateMetadata() {
    console.log('\n✓ Validating Metadata...');
    console.log('─'.repeat(80));

    const errors = [];
    const warnings = [];

    this.metadata.forEach((token, index) => {
      // Required fields
      if (!token.name) errors.push(`Token ${index}: Missing name`);
      if (!token.description) warnings.push(`Token ${index}: Missing description`);
      if (!token.image) errors.push(`Token ${index}: Missing image`);

      // Attributes
      if (!token.attributes || !Array.isArray(token.attributes)) {
        warnings.push(`Token ${index}: No attributes defined`);
      }

      // Image URL format
      if (token.image && !token.image.startsWith('ipfs://') && !token.image.startsWith('http')) {
        warnings.push(`Token ${index}: Image URL should use ipfs:// or https://`);
      }
    });

    if (errors.length > 0) {
      console.log('\n❌ Errors Found:');
      errors.forEach((err) => console.log(`  ${err}`));
    }

    if (warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      warnings.forEach((warn) => console.log(`  ${warn}`));
    }

    if (errors.length === 0 && warnings.length === 0) {
      console.log('✅ All metadata validated successfully!');
    }

    console.log('\n' + '─'.repeat(80));

    return { errors, warnings };
  }
}

// Example usage
if (require.main === module) {
  // Define your collection
  const generator = new MetadataGenerator({
    name: 'My Awesome NFT',
    description: 'A collection of unique digital art pieces',
    externalUrl: 'https://my-nft-project.com',
    collectionSize: 100, // For testing, use small number
    imageBaseUri: 'ipfs://QmYourImageCID/',
  });

  // Define traits with weighted rarity
  generator.defineTraits({
    Background: [
      { value: 'Blue', weight: 40 },
      { value: 'Red', weight: 30 },
      { value: 'Green', weight: 20 },
      { value: 'Gold', weight: 10 }, // Rare
    ],
    Character: [
      { value: 'Human', weight: 50 },
      { value: 'Robot', weight: 30 },
      { value: 'Alien', weight: 15 },
      { value: 'Zombie', weight: 5 }, // Very rare
    ],
    Clothing: [
      { value: 'T-Shirt', weight: 50 },
      { value: 'Hoodie', weight: 25 },
      { value: 'Suit', weight: 15 },
      { value: 'Armor', weight: 10 }, // Rare
    ],
    Accessory: [
      { value: 'None', weight: 60 },
      { value: 'Glasses', weight: 25 },
      { value: 'Hat', weight: 10 },
      { value: 'Crown', weight: 5 }, // Very rare
    ],
  });

  // Generate collection
  generator.generateCollection();

  // Preview samples
  generator.previewSample(5);

  // Validate
  generator.validateMetadata();

  // Export to files
  generator.exportMetadata();

  console.log('\n✨ Metadata Generation Complete!');
  console.log('\n📝 Next Steps:');
  console.log('1. Review generated metadata files');
  console.log('2. Create corresponding images for each token');
  console.log('3. Upload metadata and images to IPFS');
  console.log('4. Update contract baseURI with IPFS CID');
  console.log('5. Deploy and mint your NFTs!\n');
}

module.exports = MetadataGenerator;
