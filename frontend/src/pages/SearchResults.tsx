import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Package, Filter } from 'lucide-react';
import publicProductApi, { PublicProduct } from '../services/publicProductApi';
import Header from '../components/Header';
import Footer from '../components/Footer';

const SearchResults: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
    hasNext: false,
    hasPrev: false
  });

  useEffect(() => {
    if (query.trim()) {
      searchProducts();
    }
  }, [query]);

  const searchProducts = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const response = await publicProductApi.getProducts({
        search: query,
        page,
        limit: 12
      });
      
      setProducts(response.data.products || []);
      setPagination(response.data.pagination || pagination);
    } catch (err) {
      console.error('Error searching products:', err);
      setError('Failed to load search results');
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = (product: PublicProduct) => {
    // Navigate to product detail or service page
    navigate(`/service/${product.category.name.toLowerCase().replace(/\s+/g, '-')}`);
  };

  const handlePageChange = (newPage: number) => {
    searchProducts(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="pt-24 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Search Header */}
          <div className="mb-12">
            <div className="flex items-center space-x-2 mb-4">
              <Search className="w-6 h-6 text-gray-600" />
              <h1 className="text-2xl font-bold text-gray-900">
                Search Results
              </h1>
            </div>
            
            {query && (
              <p className="text-gray-600">
                Showing results for: <span className="font-semibold">"{query}"</span>
              </p>
            )}
          </div>

          {/* Results Count */}
          {!loading && !error && (
            <div className="mb-6">
              <p className="text-sm text-gray-600">
                {pagination.totalProducts} product{pagination.totalProducts !== 1 ? 's' : ''} found
              </p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Searching...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Search Error</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => searchProducts()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* No Results */}
          {!loading && !error && products.length === 0 && query && (
            <div className="text-center py-12">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Found</h3>
              <p className="text-gray-600 mb-4">
                We couldn't find any products matching "{query}". Try different keywords.
              </p>
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Browse All Products
              </button>
            </div>
          )}

          {/* Products Grid */}
          {!loading && !error && products.length > 0 && (
            <>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 mb-8">
                {products.map((product) => {
                  const primaryImage = product.images?.find(img => img.isPrimary)?.url || product.primaryImage;
                  
                  return (
                    <div
                      key={product._id}
                      onClick={() => handleProductClick(product)}
                      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 cursor-pointer group"
                    >
                      <div className="aspect-square p-1">
                        <img
                          src={primaryImage || '/placeholder.svg'}
                          alt={product.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/placeholder.svg';
                          }}
                        />
                      </div>
                      <div className="p-1 border-t">
                        <h3 className="text-xs font-medium text-gray-900 mb-0.5 line-clamp-2 leading-tight">
                          {product.name}
                        </h3>
                        <p className="text-xs text-gray-600 mb-0.5">
                          {product.category.name}
                        </p>
                        {product.currentPrice && (
                          <p className="text-xs font-bold text-blue-600">
                            ₹{product.currentPrice.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrev}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  <span className="px-3 py-2 text-sm text-gray-700">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNext}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default SearchResults;
