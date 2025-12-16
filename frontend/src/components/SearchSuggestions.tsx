import React, { useState, useEffect, useRef } from 'react';
import { Search, Package } from 'lucide-react';
import publicProductApi, { ProductSuggestion } from '../services/publicProductApi';

interface SearchSuggestionsProps {
  query: string;
  onSuggestionSelect: (suggestion: ProductSuggestion) => void;
  onClose: () => void;
  isVisible: boolean;
}

const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
  query,
  onSuggestionSelect,
  onClose,
  isVisible
}) => {
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Fetch suggestions or popular products
  useEffect(() => {
    // Only fetch when suggestions are visible
    if (!isVisible) {
      setSuggestions([]);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (query && query.trim().length >= 2) {
          // If query exists and is >= 2 characters, search for suggestions
          const response = await publicProductApi.getSuggestions(query.trim(), 8);
          setSuggestions(response.data.suggestions || []);
        } else {
          // If query is empty or short, show popular/all products
          const response = await publicProductApi.getProducts({ limit: 8 });
          // Convert products to suggestions format
          const products = response.data.products || [];
          const productSuggestions: ProductSuggestion[] = products.map((product: any) => ({
            _id: product._id,
            name: product.productName || product.name || '',
            category: product.serviceType || product.category || '',
            primaryImage: product.productImage || product.primaryImage,
            slug: product.slug
          }));
          setSuggestions(productSuggestions);
        }
      } catch (err) {
        console.error('Error fetching suggestions:', err);
        setError('Failed to load suggestions');
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchData, query && query.trim().length >= 2 ? 300 : 0); // No debounce for empty query

    return () => clearTimeout(timeoutId);
  }, [query, isVisible]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible, onClose]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isVisible, onClose]);

  if (!isVisible || (!loading && suggestions.length === 0 && !error)) {
    return null;
  }

  return (
    <div
      ref={suggestionsRef}
      className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
    >
      {loading && (
        <div className="p-4 text-center text-gray-500">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span>Searching...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 text-center text-red-500">
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && suggestions.length > 0 && (
        <div className="py-2">
          <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide border-b border-gray-100">
            {query && query.trim().length >= 2 ? 'Product Suggestions' : 'Popular Services'}
          </div>
          {suggestions.map((suggestion) => (
            <button
              key={suggestion._id}
              onClick={() => onSuggestionSelect(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors duration-150 flex items-center space-x-3"
            >
              <div className="flex-shrink-0">
                {suggestion.primaryImage ? (
                  <img
                    src={suggestion.primaryImage}
                    alt={suggestion.name}
                    loading="lazy"
                    decoding="async"
                    className="w-8 h-8 object-contain rounded"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder.svg';
                    }}
                  />
                ) : (
                  <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                    <Package className="w-4 h-4 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {suggestion.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {suggestion.category}
                </p>
              </div>
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            </button>
          ))}
        </div>
      )}

      {!loading && !error && suggestions.length === 0 && query && query.trim().length >= 2 && (
        <div className="p-4 text-center text-gray-500">
          <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p>No products found for "{query}"</p>
        </div>
      )}
      
      {!loading && !error && suggestions.length === 0 && (!query || query.trim().length < 2) && (
        <div className="p-4 text-center text-gray-500">
          <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p>Start typing to search for services</p>
        </div>
      )}
    </div>
  );
};

export default SearchSuggestions;
