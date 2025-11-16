// API endpoint for blog posts
// GET /api/posts - Get all posts
// GET /api/posts?id=1 - Get post by ID
// POST /api/posts - Create new post

// Mock database
let posts = [
  {
    id: 1,
    title: 'Getting Started with Serverless',
    content: 'Serverless computing is a cloud computing execution model...',
    author: 'John Doe',
    createdAt: '2025-01-10T10:00:00Z',
    tags: ['serverless', 'cloud', 'tutorial']
  },
  {
    id: 2,
    title: 'Building APIs with Vercel Functions',
    content: 'Vercel Functions make it easy to build serverless APIs...',
    author: 'Jane Smith',
    createdAt: '2025-01-12T14:30:00Z',
    tags: ['vercel', 'api', 'nodejs']
  },
  {
    id: 3,
    title: 'Deploying to Production',
    content: 'Learn how to deploy your serverless functions to production...',
    author: 'Bob Johnson',
    createdAt: '2025-01-15T09:15:00Z',
    tags: ['deployment', 'production', 'devops']
  }
];

export default function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { method, query } = req;

  try {
    // GET - Fetch posts
    if (method === 'GET') {
      // Get single post by ID
      if (query.id) {
        const post = posts.find(p => p.id === parseInt(query.id));
        if (!post) {
          return res.status(404).json({
            success: false,
            error: 'Post not found'
          });
        }
        return res.status(200).json({
          success: true,
          data: post
        });
      }

      // Get posts with pagination and filtering
      const page = parseInt(query.page) || 1;
      const limit = parseInt(query.limit) || 10;
      const tag = query.tag;

      let filteredPosts = [...posts];

      // Filter by tag if provided
      if (tag) {
        filteredPosts = filteredPosts.filter(p =>
          p.tags.includes(tag.toLowerCase())
        );
      }

      // Sort by date (newest first)
      filteredPosts.sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
      );

      // Paginate
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedPosts = filteredPosts.slice(startIndex, endIndex);

      return res.status(200).json({
        success: true,
        data: paginatedPosts,
        pagination: {
          page,
          limit,
          total: filteredPosts.length,
          totalPages: Math.ceil(filteredPosts.length / limit)
        }
      });
    }

    // POST - Create new post
    if (method === 'POST') {
      const { title, content, author, tags } = req.body;

      // Validation
      if (!title || !content || !author) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          required: ['title', 'content', 'author']
        });
      }

      // Create new post
      const newPost = {
        id: posts.length + 1,
        title,
        content,
        author,
        tags: tags || [],
        createdAt: new Date().toISOString()
      };

      posts.push(newPost);

      return res.status(201).json({
        success: true,
        message: 'Post created successfully',
        data: newPost
      });
    }

    // Method not allowed
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}
