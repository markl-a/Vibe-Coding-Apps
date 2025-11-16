const express = require('express');
const { Client } = require('@elastic/elasticsearch');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 6003;

app.use(cors());
app.use(express.json());

const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
});

const INDEX = 'cms-content';

const initIndex = async () => {
  try {
    const exists = await esClient.indices.exists({ index: INDEX });
    if (!exists) {
      await esClient.indices.create({
        index: INDEX,
        body: {
          mappings: {
            properties: {
              title: { type: 'text' },
              content: { type: 'text' },
              excerpt: { type: 'text' },
              tags: { type: 'keyword' },
              categories: { type: 'keyword' },
              status: { type: 'keyword' },
              createdAt: { type: 'date' }
            }
          }
        }
      });
      console.log(`✅ Elasticsearch index ${INDEX} created`);
    } else {
      console.log('✅ Connected to Elasticsearch');
    }
  } catch (error) {
    console.error('❌ Elasticsearch error:', error);
  }
};

initIndex();

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'Search Service' });
});

// Index content
app.post('/api/search/index', async (req, res) => {
  try {
    const { id, ...document } = req.body;

    await esClient.index({
      index: INDEX,
      id: id,
      document: document
    });

    res.status(201).json({ message: 'Content indexed', id });
  } catch (error) {
    console.error('Index error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Search content
app.get('/api/search', async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Query parameter required' });
    }

    const result = await esClient.search({
      index: INDEX,
      body: {
        query: {
          multi_match: {
            query: q,
            fields: ['title^3', 'content', 'excerpt^2', 'tags', 'categories']
          }
        },
        size: parseInt(limit)
      }
    });

    const hits = result.hits.hits.map(hit => ({
      id: hit._id,
      score: hit._score,
      ...hit._source
    }));

    res.json({ results: hits, total: result.hits.total.value });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Search suggestions
app.get('/api/search/suggest', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Query parameter required' });
    }

    const result = await esClient.search({
      index: INDEX,
      body: {
        suggest: {
          title_suggest: {
            prefix: q,
            completion: {
              field: 'title'
            }
          }
        }
      }
    });

    const suggestions = result.suggest.title_suggest[0]?.options || [];

    res.json({ suggestions });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete from index
app.delete('/api/search/:id', async (req, res) => {
  try {
    await esClient.delete({
      index: INDEX,
      id: req.params.id
    });

    res.json({ message: 'Content removed from index' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Search Service running on port ${PORT}`);
});
