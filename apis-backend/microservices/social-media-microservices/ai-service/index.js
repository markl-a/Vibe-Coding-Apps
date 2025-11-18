const express = require('express');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const promClient = require('prom-client');
const natural = require('natural');
const compromise = require('compromise');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4005;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/social_ai';

// Natural Language Processing setup
const tokenizer = new natural.WordTokenizer();
const TfIdf = natural.TfIdf;
const SentimentAnalyzer = natural.SentimentAnalyzer;
const stemmer = natural.PorterStemmer;
const analyzer = new SentimentAnalyzer('English', stemmer, 'afinn');

// Prometheus metrics
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

const aiRequestCounter = new promClient.Counter({
  name: 'ai_requests_total',
  help: 'Total number of AI requests',
  labelNames: ['type', 'result'],
  registers: [register]
});

const aiProcessingDuration = new promClient.Histogram({
  name: 'ai_processing_duration_seconds',
  help: 'AI processing duration',
  labelNames: ['type'],
  buckets: [0.1, 0.5, 1, 2, 5],
  registers: [register]
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// MongoDB Connection
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB (Social AI)'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Content Analysis Schema
const contentAnalysisSchema = new mongoose.Schema({
  contentId: { type: String, required: true, index: true },
  contentType: { type: String, enum: ['post', 'comment', 'message'], required: true },
  text: { type: String, required: true },
  sentiment: {
    score: Number,
    label: { type: String, enum: ['positive', 'neutral', 'negative'] },
    confidence: Number
  },
  moderation: {
    isApproved: { type: Boolean, default: true },
    flags: [String],
    toxicityScore: Number,
    categories: {
      spam: Number,
      hate: Number,
      violence: Number,
      nsfw: Number,
      harassment: Number
    }
  },
  topics: [String],
  keywords: [String],
  entities: {
    people: [String],
    places: [String],
    organizations: [String]
  },
  language: String,
  processedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

const ContentAnalysis = mongoose.model('ContentAnalysis', contentAnalysisSchema);

// User Interaction Schema for recommendations
const userInteractionSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  postId: { type: String, required: true },
  interactionType: { type: String, enum: ['view', 'like', 'comment', 'share'], required: true },
  duration: Number,
  timestamp: { type: Date, default: Date.now }
});

const UserInteraction = mongoose.model('UserInteraction', userInteractionSchema);

// Swagger Configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Social Media AI Service API',
      version: '1.0.0',
      description: 'AI-Powered Content Analysis, Moderation, and Recommendations',
    },
    servers: [{ url: `http://localhost:${PORT}` }],
  },
  apis: ['./index.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Offensive words list (simplified for demo)
const OFFENSIVE_WORDS = [
  'spam', 'scam', 'fake', 'hate', 'kill', 'attack', 'abuse',
  'idiot', 'stupid', 'dumb', 'loser', 'ugly'
];

// Helper: Detect offensive content
function detectOffensiveContent(text) {
  const lowerText = text.toLowerCase();
  const foundWords = OFFENSIVE_WORDS.filter(word => lowerText.includes(word));

  return {
    hasOffensive: foundWords.length > 0,
    offensiveWords: foundWords,
    score: Math.min(foundWords.length * 0.2, 1)
  };
}

// Helper: Sentiment analysis
function analyzeSentiment(text) {
  const tokens = tokenizer.tokenize(text.toLowerCase());
  const score = analyzer.getSentiment(tokens);

  let label = 'neutral';
  if (score > 0.1) label = 'positive';
  else if (score < -0.1) label = 'negative';

  return {
    score: score,
    label: label,
    confidence: Math.abs(score)
  };
}

// Helper: Extract topics and keywords
function extractTopics(text) {
  const doc = compromise(text);

  const topics = doc.topics().out('array');
  const people = doc.people().out('array');
  const places = doc.places().out('array');
  const organizations = doc.organizations().out('array');

  // TF-IDF for keyword extraction
  const tfidf = new TfIdf();
  tfidf.addDocument(text);

  const keywords = [];
  tfidf.listTerms(0).slice(0, 10).forEach(item => {
    keywords.push(item.term);
  });

  return {
    topics,
    keywords,
    entities: {
      people,
      places,
      organizations
    }
  };
}

// Helper: Content moderation
function moderateContent(text) {
  const offensive = detectOffensiveContent(text);

  // Calculate category scores (simplified)
  const categories = {
    spam: text.toLowerCase().includes('buy') || text.toLowerCase().includes('click here') ? 0.7 : 0.1,
    hate: offensive.score,
    violence: text.toLowerCase().includes('kill') || text.toLowerCase().includes('attack') ? 0.8 : 0.1,
    nsfw: 0.1,
    harassment: offensive.score * 0.5
  };

  const toxicityScore = Math.max(...Object.values(categories));
  const isApproved = toxicityScore < 0.6;

  const flags = [];
  Object.entries(categories).forEach(([category, score]) => {
    if (score > 0.5) flags.push(category);
  });

  return {
    isApproved,
    flags,
    toxicityScore,
    categories
  };
}

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check
 *     tags: [Health]
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Social Media AI Service',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    aiEngine: 'natural.js + compromise'
  });
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

/**
 * @swagger
 * /api/ai/analyze:
 *   post:
 *     summary: Comprehensive content analysis
 *     tags: [AI Analysis]
 *     description: Analyze content for sentiment, moderation, topics, and entities
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contentId
 *               - contentType
 *               - text
 *             properties:
 *               contentId:
 *                 type: string
 *               contentType:
 *                 type: string
 *                 enum: [post, comment, message]
 *               text:
 *                 type: string
 */
app.post('/api/ai/analyze', [
  body('contentId').notEmpty(),
  body('contentType').isIn(['post', 'comment', 'message']),
  body('text').trim().notEmpty()
], async (req, res) => {
  const start = Date.now();

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { contentId, contentType, text } = req.body;

    // Perform all analyses
    const sentiment = analyzeSentiment(text);
    const moderation = moderateContent(text);
    const topicsData = extractTopics(text);

    // Save analysis
    const analysis = new ContentAnalysis({
      contentId,
      contentType,
      text,
      sentiment,
      moderation,
      topics: topicsData.topics,
      keywords: topicsData.keywords,
      entities: topicsData.entities,
      language: 'en'
    });

    await analysis.save();

    const duration = (Date.now() - start) / 1000;
    aiProcessingDuration.labels('full_analysis').observe(duration);
    aiRequestCounter.labels('full_analysis', moderation.isApproved ? 'approved' : 'flagged').inc();

    res.json({
      message: 'Content analyzed successfully',
      analysis: {
        contentId,
        sentiment,
        moderation,
        topics: topicsData.topics,
        keywords: topicsData.keywords,
        entities: topicsData.entities,
        processingTime: `${duration.toFixed(2)}s`
      }
    });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Server error during analysis' });
  }
});

/**
 * @swagger
 * /api/ai/sentiment:
 *   post:
 *     summary: Sentiment analysis
 *     tags: [AI Analysis]
 *     description: Analyze text sentiment (positive, neutral, negative)
 */
app.post('/api/ai/sentiment', [
  body('text').trim().notEmpty()
], async (req, res) => {
  const start = Date.now();

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { text } = req.body;
    const sentiment = analyzeSentiment(text);

    const duration = (Date.now() - start) / 1000;
    aiProcessingDuration.labels('sentiment').observe(duration);
    aiRequestCounter.labels('sentiment', sentiment.label).inc();

    res.json({
      sentiment,
      processingTime: `${duration.toFixed(2)}s`
    });
  } catch (error) {
    console.error('Sentiment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @swagger
 * /api/ai/moderate:
 *   post:
 *     summary: Content moderation
 *     tags: [AI Analysis]
 *     description: Check content for offensive material, spam, hate speech
 */
app.post('/api/ai/moderate', [
  body('text').trim().notEmpty()
], async (req, res) => {
  const start = Date.now();

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { text } = req.body;
    const moderation = moderateContent(text);

    const duration = (Date.now() - start) / 1000;
    aiProcessingDuration.labels('moderation').observe(duration);
    aiRequestCounter.labels('moderation', moderation.isApproved ? 'approved' : 'flagged').inc();

    res.json({
      moderation,
      processingTime: `${duration.toFixed(2)}s`
    });
  } catch (error) {
    console.error('Moderation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @swagger
 * /api/ai/topics:
 *   post:
 *     summary: Topic and keyword extraction
 *     tags: [AI Analysis]
 *     description: Extract topics, keywords, and named entities from text
 */
app.post('/api/ai/topics', [
  body('text').trim().notEmpty()
], async (req, res) => {
  const start = Date.now();

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { text } = req.body;
    const topicsData = extractTopics(text);

    const duration = (Date.now() - start) / 1000;
    aiProcessingDuration.labels('topics').observe(duration);
    aiRequestCounter.labels('topics', 'success').inc();

    res.json({
      ...topicsData,
      processingTime: `${duration.toFixed(2)}s`
    });
  } catch (error) {
    console.error('Topics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @swagger
 * /api/ai/interactions:
 *   post:
 *     summary: Record user interaction
 *     tags: [Recommendations]
 *     description: Record user interaction for recommendation engine
 */
app.post('/api/ai/interactions', [
  body('userId').notEmpty(),
  body('postId').notEmpty(),
  body('interactionType').isIn(['view', 'like', 'comment', 'share'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, postId, interactionType, duration } = req.body;

    const interaction = new UserInteraction({
      userId,
      postId,
      interactionType,
      duration
    });

    await interaction.save();

    res.json({
      message: 'Interaction recorded successfully',
      interaction
    });
  } catch (error) {
    console.error('Interaction error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @swagger
 * /api/ai/recommendations/{userId}:
 *   get:
 *     summary: Get personalized recommendations
 *     tags: [Recommendations]
 *     description: AI-powered content recommendations based on user behavior
 */
app.get('/api/ai/recommendations/:userId', async (req, res) => {
  const start = Date.now();

  try {
    const { userId } = req.params;
    const { limit = 10 } = req.query;

    // Get user's interaction history
    const interactions = await UserInteraction.find({ userId })
      .sort({ timestamp: -1 })
      .limit(100);

    if (interactions.length === 0) {
      // Return trending content for new users
      const trending = await UserInteraction.aggregate([
        {
          $match: {
            timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: '$postId',
            score: {
              $sum: {
                $switch: {
                  branches: [
                    { case: { $eq: ['$interactionType', 'view'] }, then: 1 },
                    { case: { $eq: ['$interactionType', 'like'] }, then: 3 },
                    { case: { $eq: ['$interactionType', 'comment'] }, then: 5 },
                    { case: { $eq: ['$interactionType', 'share'] }, then: 10 }
                  ],
                  default: 0
                }
              }
            }
          }
        },
        { $sort: { score: -1 } },
        { $limit: parseInt(limit) }
      ]);

      const duration = (Date.now() - start) / 1000;
      aiRequestCounter.labels('recommendations', 'trending').inc();

      return res.json({
        recommendations: trending.map(t => ({
          postId: t._id,
          score: t.score,
          reason: 'trending'
        })),
        algorithm: 'trending',
        processingTime: `${duration.toFixed(2)}s`
      });
    }

    // Calculate user preferences
    const likedPosts = interactions.filter(i => ['like', 'comment', 'share'].includes(i.interactionType))
      .map(i => i.postId);

    // Get content similar to liked posts (simplified collaborative filtering)
    const similarUsers = await UserInteraction.aggregate([
      {
        $match: {
          postId: { $in: likedPosts },
          userId: { $ne: userId }
        }
      },
      {
        $group: {
          _id: '$userId',
          commonInterests: { $sum: 1 }
        }
      },
      { $sort: { commonInterests: -1 } },
      { $limit: 10 }
    ]);

    const similarUserIds = similarUsers.map(u => u._id);

    // Get posts these similar users liked
    const recommendations = await UserInteraction.aggregate([
      {
        $match: {
          userId: { $in: similarUserIds },
          postId: { $nin: likedPosts },
          interactionType: { $in: ['like', 'comment', 'share'] }
        }
      },
      {
        $group: {
          _id: '$postId',
          score: { $sum: 1 }
        }
      },
      { $sort: { score: -1 } },
      { $limit: parseInt(limit) }
    ]);

    const duration = (Date.now() - start) / 1000;
    aiProcessingDuration.labels('recommendations').observe(duration);
    aiRequestCounter.labels('recommendations', 'personalized').inc();

    res.json({
      recommendations: recommendations.map(r => ({
        postId: r._id,
        score: r.score,
        reason: 'similar users liked this'
      })),
      algorithm: 'collaborative-filtering',
      processingTime: `${duration.toFixed(2)}s`
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @swagger
 * /api/ai/stats:
 *   get:
 *     summary: Get AI service statistics
 *     tags: [Analytics]
 */
app.get('/api/ai/stats', async (req, res) => {
  try {
    const totalAnalyses = await ContentAnalysis.countDocuments();
    const flaggedContent = await ContentAnalysis.countDocuments({ 'moderation.isApproved': false });

    const sentimentStats = await ContentAnalysis.aggregate([
      {
        $group: {
          _id: '$sentiment.label',
          count: { $sum: 1 },
          avgScore: { $avg: '$sentiment.score' }
        }
      }
    ]);

    const totalInteractions = await UserInteraction.countDocuments();

    res.json({
      totalAnalyses,
      flaggedContent,
      flaggedPercentage: totalAnalyses > 0 ? ((flaggedContent / totalAnalyses) * 100).toFixed(2) + '%' : '0%',
      sentimentStats,
      totalInteractions
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 Social Media AI Service running on port ${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
  console.log(`📊 Metrics: http://localhost:${PORT}/metrics`);
  console.log(`🤖 AI Features: Sentiment Analysis, Content Moderation, Recommendations`);
});

module.exports = app;
