// POST /api/analytics
// Simple analytics tracking endpoint

// In-memory storage (use database in production)
const events = [];

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // POST - Track event
    if (req.method === 'POST') {
      const { event, properties = {} } = req.body;

      if (!event) {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: event'
        });
      }

      // Create analytics event
      const analyticsEvent = {
        id: events.length + 1,
        event,
        properties,
        timestamp: new Date().toISOString(),
        userAgent: req.headers['user-agent'],
        ip: req.headers['x-forwarded-for'] || req.headers['x-real-ip'],
        referer: req.headers.referer || null
      };

      events.push(analyticsEvent);

      return res.status(200).json({
        success: true,
        message: 'Event tracked successfully',
        eventId: analyticsEvent.id
      });
    }

    // GET - Get analytics summary
    if (req.method === 'GET') {
      const { startDate, endDate, event: eventFilter } = req.query;

      let filteredEvents = [...events];

      // Filter by date range
      if (startDate) {
        filteredEvents = filteredEvents.filter(e =>
          new Date(e.timestamp) >= new Date(startDate)
        );
      }

      if (endDate) {
        filteredEvents = filteredEvents.filter(e =>
          new Date(e.timestamp) <= new Date(endDate)
        );
      }

      // Filter by event type
      if (eventFilter) {
        filteredEvents = filteredEvents.filter(e =>
          e.event === eventFilter
        );
      }

      // Calculate summary
      const eventCounts = filteredEvents.reduce((acc, e) => {
        acc[e.event] = (acc[e.event] || 0) + 1;
        return acc;
      }, {});

      return res.status(200).json({
        success: true,
        data: {
          totalEvents: filteredEvents.length,
          eventCounts,
          events: filteredEvents.slice(-100) // Return last 100 events
        }
      });
    }

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
