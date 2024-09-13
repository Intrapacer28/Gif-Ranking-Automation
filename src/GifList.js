import React from 'react';

function GifList({ gifs }) {
  return (
    <div className="gif-list">
      {gifs.map((gif) => (
        <div key={gif.id} className="gif-item">
          <img src={gif.media_formats.gif.url} alt="GIF" />
        </div>
      ))}
    </div>
  );
}

export default GifList;
