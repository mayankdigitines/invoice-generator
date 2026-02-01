const axios = require('axios');

exports.getProxyImage = async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).send('URL is required');
    }

    const response = await axios.get(url, {
      responseType: 'stream',
      headers: { 'User-Agent': 'Mozilla/5.0' } // Fake UA to avoid blocking
    });

    const contentType = response.headers['content-type'];

    // Set headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    
    response.data.pipe(res);
  } catch (error) {
    console.error('Proxy Image Error:', error.message);
    if (!res.headersSent) {
      res.status(error.response?.status || 500).send('Failed to fetch image');
    }
  }
};
