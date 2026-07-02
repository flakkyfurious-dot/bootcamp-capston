const form = document.getElementById('searchForm');
const movieInput = document.getElementById('movieInput');
const movieGrid = document.getElementById('movieGrid');
const statusMessage = document.getElementById('statusMessage');

const API_KEY = 'trilogy';
const API_BASE = 'https://www.omdbapi.com/';

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const query = movieInput.value.trim();

  if (!query) {
    statusMessage.textContent = 'Please enter a movie title.';
    return;
  }

  statusMessage.textContent = `Searching for ${query}...`;
  movieGrid.innerHTML = '<p>Loading movies...</p>';

  try {
    const searchResponse = await fetch(`${API_BASE}?s=${encodeURIComponent(query)}&apikey=${API_KEY}&type=movie`);
    const searchData = await searchResponse.json();

    if (!searchData.Search) {
      statusMessage.textContent = 'No movies found. Try another title.';
      movieGrid.innerHTML = '';
      return;
    }

    const detailedMovies = await Promise.all(
      searchData.Search.slice(0, 8).map(async (movie) => {
        const detailResponse = await fetch(`${API_BASE}?i=${movie.imdbID}&apikey=${API_KEY}&plot=short`);
        const details = await detailResponse.json();
        return details.Response === 'True' ? createMovieCard(details) : null;
      })
    );

    movieGrid.innerHTML = '';
    detailedMovies.filter(Boolean).forEach((card) => movieGrid.appendChild(card));
    statusMessage.textContent = `Showing ${detailedMovies.filter(Boolean).length} worldwide movie results for ${query}.`;
  } catch (error) {
    console.error(error);
    statusMessage.textContent = 'The movie service is unavailable right now. Please try again later.';
    movieGrid.innerHTML = '';
  }
});

function createMovieCard(movie) {
  const card = document.createElement('article');
  card.className = 'movie-card';

  const rating = movie.Ratings?.[0]?.Value || 'Not rated';
  const boxOffice = movie.BoxOffice || 'Box office info unavailable';
  const poster = movie.Poster && movie.Poster !== 'N/A'
    ? movie.Poster
    : 'https://via.placeholder.com/300x450?text=No+Poster';

  card.innerHTML = `
    <img src="${poster}" alt="${movie.Title}" />
    <div class="movie-body">
      <h3>${movie.Title}</h3>
      <div class="badge-row">
        <span class="badge">${movie.Year || 'Year unknown'}</span>
        <span class="badge">⭐ ${rating}</span>
        <span class="badge">💰 ${boxOffice}</span>
      </div>
      <p>${truncate(movie.Plot || 'A popular movie from around the world.', 140)}</p>
      <div class="cta-row">
        <a href="#" class="cta-btn" data-toggle="${movie.imdbID}">See more</a>
        <a href="https://www.google.com/search?q=${encodeURIComponent(movie.Title + ' watch download')}" class="cta-link" target="_blank" rel="noreferrer">Download / Watch</a>
      </div>
      <div class="detail-panel" id="detail-${movie.imdbID}" hidden>
        <h4>Cast</h4>
        <p>${movie.Actors || 'Cast details are not available.'}</p>
        <h4>Director</h4>
        <p>${movie.Director || 'Director details are not available.'}</p>
        <h4>Genre</h4>
        <p>${movie.Genre || 'Genre details are not available.'}</p>
        <h4>Awards</h4>
        <p>${movie.Awards || 'Awards are not available.'}</p>
      </div>
    </div>
  `;

  const toggleButton = card.querySelector('.cta-btn');
  toggleButton.addEventListener('click', (event) => {
    event.preventDefault();
    const detailPanel = card.querySelector('.detail-panel');
    detailPanel.hidden = !detailPanel.hidden;
    toggleButton.textContent = detailPanel.hidden ? 'See more' : 'Hide details';
  });

  return card;
}

function truncate(text, limit) {
  if (text.length <= limit) return text;
  return `${text.slice(0, limit - 1)}…`;
}
