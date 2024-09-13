import React, { useState } from 'react';
import './App.css';
import axios from 'axios';

const App = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [gifs, setGifs] = useState([]);
  const [newGif, setNewGif] = useState({
    title: '',
    content_description: '',
    long_title: '',
    h1_title: '',
    tags: '',
    file: null,
  });

  const handleSearch = async () => {
    try {
      const response = await axios.get(`https://tenor.googleapis.com/v2/search?q=${searchTerm}&key=AIzaSyAkNzp-tFlSHosyufPtq5YQ4cW1gqJ4g6M`);
      console.log(response.data.results); // Debugging to inspect the data structure
      setGifs(response.data.results);
    } catch (error) {
      console.error('Error fetching GIFs:', error);
    }
  };

  const handleFileChange = (e) => {
    setNewGif({ ...newGif, file: e.target.files[0] });
  };

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append('gif', newGif.file);
    formData.append('title', newGif.title);
    formData.append('content_description', newGif.content_description);
    formData.append('long_title', newGif.long_title);
    formData.append('h1_title', newGif.h1_title);
    formData.append('tags', newGif.tags);
  
    try {
      const uploadResponse = await axios.post('http://localhost:5000/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
  
      console.log('Upload response:', uploadResponse.data);
  
      if (uploadResponse.data && uploadResponse.data.file) {
        setGifs(prevGifs => {
          // Assuming `searchTerm` is a state variable
          const currentSearchTerm = searchTerm; // Get the current search term
  
          // Remove the last GIF and add the new one
          const updatedGifs = [...prevGifs.slice(0, -1), uploadResponse.data.file];
  
          // Define the ranking function
          const rankGifs = (gifs, searchTerm) => {
            return gifs.sort((a, b) => {
              const getRelevanceScore = (gif) => {
                let score = 0;
          
                // Set default values if properties are undefined
                const title = gif.title || '';
                const contentDescription = gif.content_description || '';
                const longTitle = gif.long_title || '';
                const h1Title = gif.h1_title || '';
                const tags = gif.tags || [];
          
                if (title.toLowerCase().includes(searchTerm.toLowerCase())) {
                  score += 30;
                }
          
                if (contentDescription.toLowerCase().includes(searchTerm.toLowerCase())) {
                  score += 25;
                }
          
                if (longTitle.toLowerCase().includes(searchTerm.toLowerCase())) {
                  score += 20;
                }
          
                if (h1Title.toLowerCase().includes(searchTerm.toLowerCase())) {
                  score += 15;
                }
          
                if (tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))) {
                  score += 10;
                }
          
                return score;
              };
          
              const relevanceA = getRelevanceScore(a);
              const relevanceB = getRelevanceScore(b);
          
              return relevanceB - relevanceA;
            });
          };
          
  
          // Rank the updated list
          const rankedGifs = rankGifs(updatedGifs, currentSearchTerm);
  
          return rankedGifs;
        });
      } else {
        console.error('Unexpected response format:', uploadResponse.data);
      }
    } catch (error) {
      console.error('Error uploading GIF:', error);
    }
  };
  
  
  
   
  
  return (
    <div className="container">
      <h1>GIF Search & Upload</h1>
      <div className="form-group">
        <input
          type="text"
          className="form-control"
          placeholder="Search for GIFs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className="btn btn-primary" onClick={handleSearch}>Search</button>
      </div>
      <div className="my-4">
        <h2>Upload New GIF</h2>
        <div className="form-group">
          <input
            type="file"
            className="form-control"
            onChange={handleFileChange}
          />
          <input
            type="text"
            className="form-control mt-2"
            placeholder="Title"
            value={newGif.title}
            onChange={(e) => setNewGif({ ...newGif, title: e.target.value })}
          />
          <input
            type="text"
            className="form-control mt-2"
            placeholder="Content Description"
            value={newGif.content_description}
            onChange={(e) => setNewGif({ ...newGif, content_description: e.target.value })}
          />
          <input
            type="text"
            className="form-control mt-2"
            placeholder="Long Title"
            value={newGif.long_title}
            onChange={(e) => setNewGif({ ...newGif, long_title: e.target.value })}
          />
          <input
            type="text"
            className="form-control mt-2"
            placeholder="H1 Title"
            value={newGif.h1_title}
            onChange={(e) => setNewGif({ ...newGif, h1_title: e.target.value })}
          />
          <input
            type="text"
            className="form-control mt-2"
            placeholder="Tags (comma separated)"
            value={newGif.tags}
            onChange={(e) => setNewGif({ ...newGif, tags: e.target.value })}
          />
          <button className="btn btn-primary mt-2" onClick={handleUpload}>Upload & Rank</button>
        </div>
      </div>
      <div className="gallery">
        {gifs.map((gif) => (
          <div className="gallery-item" key={gif.id}>
            <img
              src={
                gif.media_formats?.gif?.url ||
                gif.media?.[0]?.gif?.url ||
                gif.media_formats?.tinygif?.url ||
                gif.media?.[0]?.tinygif?.url ||
                gif.media_formats?.nanogif?.url ||
                gif.media?.[0]?.nanogif?.url ||
                gif.url // Fallback to the URL if available
              }
              alt={gif.title}
            />
            <div className="gallery-caption">
              <h5>{gif.title}</h5>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
