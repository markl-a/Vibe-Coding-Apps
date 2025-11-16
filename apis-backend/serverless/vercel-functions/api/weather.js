// GET /api/weather
// Weather API proxy endpoint
// Fetches weather data from a public API

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'Only GET requests are supported'
    });
  }

  try {
    const { city = 'London', units = 'metric' } = req.query;

    // In a real app, you would use an actual weather API like OpenWeatherMap
    // const apiKey = process.env.WEATHER_API_KEY;
    // const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=${units}&appid=${apiKey}`);

    // Mock response for demonstration
    const mockWeatherData = {
      city,
      temperature: Math.floor(Math.random() * 30) + 10,
      units,
      condition: ['Sunny', 'Cloudy', 'Rainy', 'Partly Cloudy'][Math.floor(Math.random() * 4)],
      humidity: Math.floor(Math.random() * 40) + 40,
      windSpeed: Math.floor(Math.random() * 20) + 5,
      timestamp: new Date().toISOString()
    };

    return res.status(200).json({
      success: true,
      data: mockWeatherData
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch weather data',
      message: error.message
    });
  }
}
