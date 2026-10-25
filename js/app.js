/**
 * CodeAlpha - Random Quote Generator
 * Application Controller: UI rendering, events, clipboard, and share functionality.
 */

import { QUOTES_DATABASE } from './quotes-data.js';
import { QuoteEngine } from './quote-engine.js';

class QuoteApp {
  constructor() {
    this.engine = new QuoteEngine(QUOTES_DATABASE);

    this.cacheDOMElements();
    this.renderCategoryPills();
    this.bindEvents();

    // Mandatory Requirement: Display a random quote when the app opens
    this.displayNextQuote(false);
  }

  cacheDOMElements() {
    this.quoteCard = document.getElementById('quoteCard');
    this.quoteText = document.getElementById('quoteText');
    this.quoteAuthor = document.getElementById('quoteAuthor');
    this.quoteCategory = document.getElementById('quoteCategory');
    this.btnNewQuote = document.getElementById('btnNewQuote');
    this.btnCopy = document.getElementById('btnCopy');
    this.btnTweet = document.getElementById('btnTweet');
    this.btnFavToggle = document.getElementById('btnFavToggle');
    this.categoryFilterContainer = document.getElementById('categoryFilters');
    this.toastContainer = document.getElementById('toastContainer');

    // Favorites Modal Elements
    this.btnOpenFavorites = document.getElementById('btnOpenFavorites');
    this.favoritesModal = document.getElementById('favoritesModal');
    this.btnCloseFavorites = document.getElementById('btnCloseFavorites');
    this.favoritesList = document.getElementById('favoritesList');
  }

  bindEvents() {
    // New quote click
    this.btnNewQuote.addEventListener('click', () => this.displayNextQuote(true));

    // Utility actions
    this.btnCopy.addEventListener('click', () => this.copyCurrentQuote());
    this.btnTweet.addEventListener('click', () => this.tweetCurrentQuote());
    this.btnFavToggle.addEventListener('click', () => this.toggleFavorite());

    // Favorites modal
    this.btnOpenFavorites.addEventListener('click', () => this.openFavoritesModal());
    this.btnCloseFavorites.addEventListener('click', () => this.closeFavoritesModal());
    this.favoritesModal.addEventListener('click', (e) => {
      if (e.target === this.favoritesModal) this.closeFavoritesModal();
    });

    // Keyboard shortcut (Space or N for new quote)
    document.addEventListener('keydown', (e) => {
      if (this.favoritesModal.classList.contains('is-active')) {
        if (e.key === 'Escape') this.closeFavoritesModal();
        return;
      }
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        this.displayNextQuote(true);
      }
    });
  }

  renderCategoryPills() {
    const categories = this.engine.getCategories();
    this.categoryFilterContainer.innerHTML = '';

    categories.forEach(cat => {
      const pill = document.createElement('button');
      pill.className = `category-pill ${cat === this.engine.activeCategory ? 'is-active' : ''}`;
      pill.textContent = cat;
      pill.addEventListener('click', () => {
        document.querySelectorAll('.category-pill').forEach(p => p.classList.remove('is-active'));
        pill.classList.add('is-active');
        this.engine.setCategory(cat);
        this.displayNextQuote(true);
      });
      this.categoryFilterContainer.appendChild(pill);
    });
  }

  displayNextQuote(animate = true) {
    const quote = this.engine.getRandomQuote();
    if (!quote) {
      this.quoteText.textContent = 'No quotes found in this category.';
      this.quoteAuthor.textContent = 'System';
      this.quoteCategory.textContent = 'Notice';
      return;
    }

    if (animate) {
      this.quoteText.classList.add('fade-out');
      this.quoteAuthor.style.opacity = '0';
      this.quoteAuthor.style.transition = 'opacity 0.2s';

      setTimeout(() => {
        this.applyQuoteToDOM(quote);
        this.quoteText.classList.remove('fade-out');
        this.quoteAuthor.style.opacity = '1';
      }, 200);
    } else {
      this.applyQuoteToDOM(quote);
    }
  }

  applyQuoteToDOM(quote) {
    this.quoteText.textContent = `“${quote.text}”`;
    this.quoteAuthor.textContent = quote.author;
    this.quoteCategory.textContent = quote.category;
    this.updateFavoriteUI(this.engine.isFavorite(quote.id));
  }

  updateFavoriteUI(isFav) {
    if (isFav) {
      this.btnFavToggle.classList.add('is-favorited');
      this.btnFavToggle.textContent = '❤️';
      this.btnFavToggle.setAttribute('title', 'Remove from Favorites');
    } else {
      this.btnFavToggle.classList.remove('is-favorited');
      this.btnFavToggle.textContent = '🤍';
      this.btnFavToggle.setAttribute('title', 'Save to Favorites');
    }
  }

  toggleFavorite() {
    if (!this.engine.currentQuote) return;
    const isNowFav = this.engine.toggleFavorite(this.engine.currentQuote.id);
    this.updateFavoriteUI(isNowFav);
    this.showToast(isNowFav ? 'Saved to Favorites ❤️' : 'Removed from Favorites');
  }

  copyCurrentQuote() {
    if (!this.engine.currentQuote) return;
    const textToCopy = `"${this.engine.currentQuote.text}" — ${this.engine.currentQuote.author}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy)
        .then(() => this.showToast('📋 Copied to clipboard!'))
        .catch(() => this.fallbackCopy(textToCopy));
    } else {
      this.fallbackCopy(textToCopy);
    }
  }

  fallbackCopy(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      this.showToast('📋 Copied to clipboard!');
    } catch (e) {
      this.showToast('Unable to copy quote.');
    }
    document.body.removeChild(textArea);
  }

  tweetCurrentQuote() {
    if (!this.engine.currentQuote) return;
    const text = `"${this.engine.currentQuote.text}" — ${this.engine.currentQuote.author}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&hashtags=Quotes,Inspiration,CodeAlpha`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  openFavoritesModal() {
    const favorites = this.engine.getFavoriteQuotes();
    this.favoritesList.innerHTML = '';

    if (favorites.length === 0) {
      this.favoritesList.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); padding: 2rem 0;">
          <p style="font-size: 1.5rem; margin-bottom: 0.5rem;">🤍</p>
          <p>No favorites saved yet. Click the heart icon on any quote to bookmark it here!</p>
        </div>
      `;
    } else {
      favorites.forEach(q => {
        const item = document.createElement('div');
        item.className = 'favorite-item';
        item.innerHTML = `
          <div class="fav-item-text">“${q.text}”</div>
          <div class="fav-item-author">— ${q.author} (${q.category})</div>
        `;
        item.style.cursor = 'pointer';
        item.title = 'Click to view this quote';
        item.addEventListener('click', () => {
          this.engine.currentQuote = q;
          this.applyQuoteToDOM(q);
          this.closeFavoritesModal();
          this.showToast(`Loaded quote by ${q.author}`);
        });
        this.favoritesList.appendChild(item);
      });
    }

    this.favoritesModal.classList.add('is-active');
  }

  closeFavoritesModal() {
    this.favoritesModal.classList.remove('is-active');
  }

  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, 2400);
  }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  new QuoteApp();
});
