/**
 * CodeAlpha - Random Quote Generator
 * QuoteEngine: Encapsulates non-repeating random selection, category filtering,
 * edge-case handling, and favorites persistence.
 */

const FAVORITES_STORAGE_KEY = 'codealpha_quote_favorites_v1';

export class QuoteEngine {
  /**
   * @param {Array<Object>} quotes 
   */
  constructor(quotes = []) {
    this.quotes = Array.isArray(quotes) ? [...quotes] : [];
    this.activeCategory = 'All';
    this.currentQuote = null;
    this.recentQuoteIds = []; // Ring buffer to prevent repetitive quotes
    this.maxRecentSize = Math.max(1, Math.floor(this.quotes.length / 2));
    this.favorites = this.loadFavorites();
  }

  /**
   * Returns filtered quote pool according to active category.
   * @returns {Array<Object>}
   */
  getFilteredQuotes() {
    if (this.activeCategory === 'All') {
      return this.quotes;
    }
    return this.quotes.filter(q => q.category.toLowerCase() === this.activeCategory.toLowerCase());
  }

  /**
   * Returns list of unique categories available.
   * @returns {Array<string>}
   */
  getCategories() {
    const categories = new Set(this.quotes.map(q => q.category));
    return ['All', ...Array.from(categories)];
  }

  /**
   * Changes active category filter.
   * @param {string} category 
   */
  setCategory(category) {
    this.activeCategory = category || 'All';
    this.recentQuoteIds = []; // Reset recent history on category switch
  }

  /**
   * Selects a random quote ensuring that:
   * 1. If pool > 1, consecutive duplicate quotes are avoided.
   * 2. If pool === 1, that single quote is safely returned without infinite loops.
   * 3. If pool is empty, returns null.
   * @returns {Object|null}
   */
  getRandomQuote() {
    const pool = this.getFilteredQuotes();
    if (pool.length === 0) {
      this.currentQuote = null;
      return null;
    }

    if (pool.length === 1) {
      this.currentQuote = pool[0];
      return this.currentQuote;
    }

    // Filter out quotes that were recently displayed
    let candidates = pool.filter(q => !this.recentQuoteIds.includes(q.id));
    if (candidates.length === 0) {
      // If history exhausted, clear history except the very last one
      this.recentQuoteIds = this.currentQuote ? [this.currentQuote.id] : [];
      candidates = pool.filter(q => !this.recentQuoteIds.includes(q.id));
    }

    // Pick random candidate
    const randomIndex = Math.floor(Math.random() * candidates.length);
    const selectedQuote = candidates[randomIndex];

    // Update history ring buffer
    this.currentQuote = selectedQuote;
    this.recentQuoteIds.push(selectedQuote.id);
    if (this.recentQuoteIds.length > this.maxRecentSize) {
      this.recentQuoteIds.shift();
    }

    return selectedQuote;
  }

  /**
   * Loads favorites from LocalStorage.
   * @returns {Array<string>} List of quote IDs.
   */
  loadFavorites() {
    try {
      const data = localStorage.getItem(FAVORITES_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Saves favorites to LocalStorage.
   */
  saveFavorites() {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(this.favorites));
    } catch (e) {
      console.warn('Could not persist favorites to LocalStorage:', e);
    }
  }

  /**
   * Checks if a quote ID is bookmarked.
   * @param {string} id 
   * @returns {boolean}
   */
  isFavorite(id) {
    return this.favorites.includes(id);
  }

  /**
   * Toggles bookmark state for a quote ID.
   * @param {string} id 
   * @returns {boolean} New favorited state.
   */
  toggleFavorite(id) {
    const index = this.favorites.indexOf(id);
    if (index > -1) {
      this.favorites.splice(index, 1);
      this.saveFavorites();
      return false;
    } else {
      this.favorites.push(id);
      this.saveFavorites();
      return true;
    }
  }

  /**
   * Returns array of full quote objects that have been favorited.
   * @returns {Array<Object>}
   */
  getFavoriteQuotes() {
    return this.quotes.filter(q => this.favorites.includes(q.id));
  }
}
