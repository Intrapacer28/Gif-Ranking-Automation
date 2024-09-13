const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 5000;
const TENOR_API_KEY = 'AIzaSyAkNzp-tFlSHosyufPtq5YQ4cW1gqJ4g6M';

// CORS configuration
const corsOptions = {
  origin: 'http://localhost:3000',
  methods: 'GET,POST',
  allowedHeaders: 'Content-Type',
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, 'uploads'));
    },
    filename: (req, file, cb) => {
      cb(null, file.originalname);
    },
  }),
});

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Fetch GIFs from Tenor API
// Ensure that uploaded GIFs are included in the ranking logic

const fetchGifsFromTenor = async (searchTerm) => {
  try {
    const response = await axios.get('https://api.tenor.com/v1/search', {
      params: {
        q: searchTerm,
        key: TENOR_API_KEY,
        limit: 50,
      },
    });
    return response.data.results.map(gif => ({
      id: gif.id,
      url: gif.media[0].gif.url,
      title: gif.title,
      content_description: gif.content_description || '',
      long_title: gif.long_title || '',
      h1_title: gif.h1_title || '',
      tags: gif.tags || [],
    }));
  } catch (error) {
    console.error('Error fetching GIFs from Tenor:', error);
    return [];
  }
};

// Fetch GIFs including newly uploaded ones
const fetchAllGifs = async () => {
  // This should return all GIFs including those uploaded locally
  const gifsFromTenor = await fetchGifsFromTenor(searchTerm);
  // Assume local GIFs are in some storage or database
  const localGifs = getLocalGifs(); // Placeholder for actual local GIF fetching
  return [...gifsFromTenor, ...localGifs];
};

// Enhanced ranking logic function
const rankGifs = (gifs, searchTerm) => {
  return gifs.sort((a, b) => {
    const getRelevanceScore = (gif) => {
      let score = 0;

      if (gif.title.toLowerCase().includes(searchTerm.toLowerCase())) {
        score += 30;
      }

      if (gif.content_description.toLowerCase().includes(searchTerm.toLowerCase())) {
        score += 25;
      }

      if (gif.long_title.toLowerCase().includes(searchTerm.toLowerCase())) {
        score += 20;
      }

      if (gif.h1_title.toLowerCase().includes(searchTerm.toLowerCase())) {
        score += 15;
      }

      if (gif.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))) {
        score += 10;
      }

      return score;
    };

    const relevanceA = getRelevanceScore(a);
    const relevanceB = getRelevanceScore(b);

    return relevanceB - relevanceA;
  });
};

app.get('/gifs', async (req, res) => {
  try {
    const searchTerm = req.query.search || '';
    console.log('Search term:', searchTerm);

    const allGifs = await fetchAllGifs();
    const rankedGifs = rankGifs(allGifs, searchTerm);
    console.log('Ranked GIFs:', rankedGifs);

    res.json({ gifs: rankedGifs });
  } catch (error) {
    console.error('Error fetching and ranking GIFs:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});




// Endpoint to handle file uploads
app.post('/upload', upload.single('gif'), async (req, res) => {
  try {
    if (!req.file) {
      console.error('No file uploaded.');
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const newGif = {
      id: Date.now().toString(),
      url: `http://localhost:5000/uploads/${req.file.filename}`,
      title: req.body.title || '',
      content_description: req.body.content_description || '',
      long_title: req.body.long_title || '',
      h1_title: req.body.h1_title || '',
      tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [],
    };

    // Fetch existing GIFs based on search term
    const searchTerm = req.body.searchTerm || '';
    const gifsFromTenor = await fetchGifsFromTenor(searchTerm);
    
    // Add new GIF to the list and rank it
    const allGifs = [...gifsFromTenor, newGif];
    const rankedGifs = rankGifs(allGifs, searchTerm);

    // Pop the last element if there are more than 20 elements
    if (rankedGifs.length > 20) {
      rankedGifs.pop();
    }

    res.json({ gifs: rankedGifs });
  } catch (error) {
    console.error('Error handling file upload:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});






// Endpoint to fetch and rank GIFs
app.get('/gifs', async (req, res) => {
  try {
    const searchTerm = req.query.search || '';
    console.log('Search term:', searchTerm);

    const gifsFromTenor = await fetchGifsFromTenor(searchTerm);
    console.log('GIFs from Tenor:', gifsFromTenor);

    const rankedGifs = rankGifs(gifsFromTenor, searchTerm);
    console.log('Ranked GIFs:', rankedGifs);

    res.json({ gifs: rankedGifs });
  } catch (error) {
    console.error('Error fetching and ranking GIFs:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});





// Handle preflight requests for CORS
app.options('*', cors(corsOptions));

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
