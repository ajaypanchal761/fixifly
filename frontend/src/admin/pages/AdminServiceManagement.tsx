import React, { useState } from 'react';
import AdminHeader from '../components/AdminHeader';
import AdminProductForm from '../components/AdminProductForm';
import AdminProductList from '../components/AdminProductList';
import AdminProductDetailModal from '../components/AdminProductDetailModal';
import { 
  Car, 
  Plus,
  List,
  Grid3X3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const AdminServiceManagement = () => {
  const [currentView, setCurrentView] = useState<'list' | 'form'>('list');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [viewProduct, setViewProduct] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setCurrentView('form');
  };

  const handleEditProduct = (product: any) => {
    setSelectedProduct(product);
    setCurrentView('form');
  };

  const handleViewProduct = (product: any) => {
    setViewProduct(product);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setViewProduct(null);
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedProduct(null);
  };

  const handleRefresh = () => {
    // This will be handled by the AdminProductList component
    console.log('Refreshing product list...');
  };

  if (currentView === 'form') {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminHeader />
        <main className="ml-72 pt-32 p-6">
          <div className="mb-6">
            <Button 
              variant="outline" 
              onClick={handleBackToList}
              className="mb-4"
            >
              ← Back to Products
            </Button>
          </div>
          <AdminProductForm 
            onProductCreated={handleRefresh} 
            selectedProduct={selectedProduct}
            onBackToList={handleBackToList}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      
      <main className="ml-72 pt-32 p-6">
        {/* Page Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold mb-2">
                Product <span className="text-gradient">Management</span>
              </h1>
              <p className="text-sm text-gray-600">Manage and monitor all available products and services</p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline"
                size="sm"
                onClick={() => setCurrentView('list')}
                className={currentView === 'list' ? 'bg-blue-50 border-blue-200' : ''}
              >
                <List className="w-3 h-3 mr-2" />
                List View
              </Button>
              <Button 
                variant="outline"
                size="sm"
                onClick={() => setCurrentView('form')}
                className={currentView === 'form' ? 'bg-blue-50 border-blue-200' : ''}
              >
                <Grid3X3 className="w-3 h-3 mr-2" />
                Add Product
              </Button>
              <Button 
                onClick={handleAddProduct}
                className="bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                <Plus className="w-3 h-3 mr-2" />
                Add New Product
              </Button>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <AdminProductList 
          onEditProduct={handleEditProduct}
          onViewProduct={handleViewProduct}
          onRefresh={handleRefresh}
        />
      </main>

      {/* Product Detail Modal */}
      <AdminProductDetailModal
        product={viewProduct}
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
      />
    </div>
  );
};

export default AdminServiceManagement;
