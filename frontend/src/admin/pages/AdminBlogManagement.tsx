import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminHeader from '../components/AdminHeader';
import BlogViewModal from '../components/BlogViewModal';
import { 
  BookOpen, 
  Plus, 
  Upload, 
  Edit, 
  Trash2, 
  Eye,
  Search, 
  Filter,
  Image as ImageIcon,
  Grid3X3,
  List,
  Save,
  X,
  User,
  Calendar,
  Tag,
  FileText,
  Loader2,
  ZoomIn
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { adminBlogApi, Blog } from '@/services/blogApi';
import { toast } from '@/hooks/use-toast';
import { testAdminAuth } from '@/utils/authTest';
import BlogCard from '../components/BlogCard';

const AdminBlogManagement = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isAddBlogOpen, setIsAddBlogOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for blogs and pagination
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  // Categories
  const categories = [
    'Home Maintenance',
    'Technology',
    'HVAC',
    'Plumbing',
    'Electrical',
    'General Tips',
    'Product Reviews',
    'Air Conditioning',
    'Television',
    'Refrigerator',
    'Washing Machine',
    'Laptop',
    'Desktop'
  ];

  const [newBlog, setNewBlog] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: '',
    tags: '',
    metaTitle: '',
    metaDescription: '',
    isFeatured: false,
    commentsEnabled: true,
    image: null as File | null
  });

  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [viewingBlog, setViewingBlog] = useState<Blog | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Note: Authentication is handled by AdminProtectedRoute wrapper

  // Load blogs on component mount and when filters change
  useEffect(() => {
    // Run authentication test on component mount
    console.log('AdminBlogManagement mounted - running auth test...');
    testAdminAuth();
    loadBlogs();
  }, [pagination.page, categoryFilter, statusFilter, searchTerm]);

  const loadBlogs = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchTerm || undefined
      };

      const response = await adminBlogApi.getAdminBlogs(params);

      if (response && response.success && response.data) {
        setBlogs(response.data.blogs || []);
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
      } else {
        setBlogs([]);
      }
    } catch (error) {
      console.error('Error loading blogs:', error);
      
      // Handle authentication errors specifically
      if (error.message && (error.message.includes('Admin session expired') || error.message.includes('Admin not authenticated'))) {
        toast({
          title: "Session Expired",
          description: "Your admin session has expired. Please login again.",
          variant: "destructive",
        });
        // Clear auth data and redirect to admin login
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminRefreshToken');
        localStorage.removeItem('adminData');
        navigate('/admin/login');
        return;
      }
      
      toast({
        title: "Error",
        description: "Failed to load blogs. Please try again.",
        variant: "destructive",
      });
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      setNewBlog(prev => ({ ...prev, image: imageFile }));
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewBlog(prev => ({ ...prev, image: file }));
    }
  };

  const handleAddBlog = async () => {
    if (!newBlog.title || !newBlog.content || !newBlog.category) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Create blog first
      const blogData = {
        title: newBlog.title,
        content: newBlog.content,
        category: newBlog.category
      };

      const response = await adminBlogApi.createBlog(blogData);

      if (response && response.success && response.data) {
        // Upload image if provided
        if (newBlog.image && response.data.blog && response.data.blog.id) {
          try {
            await adminBlogApi.uploadBlogImage(response.data.blog.id, newBlog.image);
          } catch (imageError) {
            console.error('Error uploading image:', imageError);
            toast({
              title: "Warning",
              description: "Blog created but image upload failed. You can upload it later.",
              variant: "destructive",
            });
          }
        }

        toast({
          title: "Success",
          description: "Blog created successfully!",
        });

        // Reset form
      setNewBlog({
        title: '',
        excerpt: '',
        content: '',
        category: '',
        tags: '',
        metaTitle: '',
        metaDescription: '',
        isFeatured: false,
        commentsEnabled: true,
        image: null
      });
      setIsAddBlogOpen(false);

        // Reload blogs
        loadBlogs();
      }
    } catch (error) {
      console.error('Error creating blog:', error);
      
      // Handle authentication errors specifically
      if (error.message && (error.message.includes('Admin session expired') || error.message.includes('Admin not authenticated'))) {
        toast({
          title: "Session Expired",
          description: "Your admin session has expired. Please login again.",
          variant: "destructive",
        });
        // Clear auth data and redirect to admin login
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminRefreshToken');
        localStorage.removeItem('adminData');
        navigate('/admin/login');
        return;
      }
      
      toast({
        title: "Error",
        description: "Failed to create blog. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditBlog = (blog: Blog) => {
    setEditingBlog(blog);
    setNewBlog({
      title: blog.title,
      excerpt: blog.excerpt || '',
      content: blog.content,
      category: blog.category,
      tags: Array.isArray(blog.tags) ? blog.tags.join(', ') : (blog.tags || ''),
      metaTitle: blog.metaTitle || '',
      metaDescription: blog.metaDescription || '',
      isFeatured: blog.isFeatured || false,
      commentsEnabled: true,
      image: null
    });
    setIsAddBlogOpen(true);
  };

  const handleViewBlog = (blog: Blog) => {
    setViewingBlog(blog);
    setIsViewModalOpen(true);
  };

  const handleUpdateBlog = async () => {
    if (!editingBlog || !newBlog.title || !newBlog.content || !newBlog.category) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      const blogData = {
        title: newBlog.title,
        content: newBlog.content,
        category: newBlog.category
      };

      const response = await adminBlogApi.updateBlog(editingBlog.id, blogData);
      
      if (response.success) {
        // Upload new image if provided
        if (newBlog.image) {
          try {
            await adminBlogApi.uploadBlogImage(editingBlog.id, newBlog.image);
          } catch (imageError) {
            console.error('Error uploading image:', imageError);
            toast({
              title: "Warning",
              description: "Blog updated but image upload failed. You can upload it later.",
              variant: "destructive",
            });
          }
        }

        toast({
          title: "Success",
          description: "Blog updated successfully!",
        });

        // Reset form
        setNewBlog({
          title: '',
          excerpt: '',
          content: '',
          category: '',
          tags: '',
          metaTitle: '',
          metaDescription: '',
          isFeatured: false,
          commentsEnabled: true,
          image: null
        });
        setEditingBlog(null);
        setIsAddBlogOpen(false);
        
        // Reload blogs
        loadBlogs();
      }
    } catch (error) {
      console.error('Error updating blog:', error);
      toast({
        title: "Error",
        description: "Failed to update blog. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBlog = async (blogId: string) => {
    if (window.confirm('Are you sure you want to delete this blog post?')) {
      try {
        setLoading(true);
        const response = await adminBlogApi.deleteBlog(blogId);
        
        if (response.success) {
          toast({
            title: "Success",
            description: "Blog deleted successfully!",
          });
          loadBlogs();
        }
      } catch (error) {
        console.error('Error deleting blog:', error);
        toast({
          title: "Error",
          description: "Failed to delete blog. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleBlogStatus = async (blogId: string, currentStatus: string) => {
    try {
      setLoading(true);
      const newStatus = currentStatus === 'published' ? 'draft' : 'published';
      const response = await adminBlogApi.toggleBlogStatus(blogId, newStatus);
      
      if (response.success) {
        toast({
          title: "Success",
          description: `Blog ${newStatus} successfully!`,
        });
        loadBlogs();
      }
    } catch (error) {
      console.error('Error toggling blog status:', error);
      toast({
        title: "Error",
        description: "Failed to update blog status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      
      <main className="ml-72 pt-32 p-6">
        {/* Page Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold mb-2">
                Blog <span className="text-gradient">Management</span>
              </h1>
              <p className="text-sm text-muted-foreground">Manage blog posts and content</p>
            </div>
            <div className="flex items-center gap-3">
              <Dialog open={isAddBlogOpen} onOpenChange={setIsAddBlogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90" size="sm">
                    <Plus className="w-3 h-3 mr-2" />
                    Add Blog Post
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto mt-12">
                  <DialogHeader>
                    <DialogTitle className="text-lg">Add New Blog Post</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="blogTitle" className="text-sm">Blog Title *</Label>
                      <Input
                        id="blogTitle"
                        value={newBlog.title}
                        onChange={(e) => setNewBlog(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter blog title"
                        className="text-sm"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="blogCategory" className="text-sm">Category *</Label>
                      <Select value={newBlog.category} onValueChange={(value) => setNewBlog(prev => ({ ...prev, category: value }))}>
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(category => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="blogContent" className="text-sm">Blog Content *</Label>
                      <Textarea
                        id="blogContent"
                        value={newBlog.content}
                        onChange={(e) => setNewBlog(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="Write your blog content here..."
                        rows={5}
                        className="text-sm"
                      />
                    </div>


                    <div>
                      <Label className="text-sm">Featured Image</Label>
                      <div
                        className={`border-2 border-dashed rounded-lg p-3 text-center transition-colors ${
                          dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                        }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                      >
                        {newBlog.image ? (
                          <div className="space-y-1">
                            <img
                              src={URL.createObjectURL(newBlog.image)}
                              alt="Blog preview"
                              className="w-20 h-20 object-cover rounded mx-auto"
                            />
                            <p className="text-xs text-muted-foreground">{newBlog.image.name}</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setNewBlog(prev => ({ ...prev, image: null }))}
                              className="text-xs"
                            >
                              <X className="w-3 h-3 mr-2" />
                              Remove
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <Upload className="w-5 h-5 mx-auto text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">
                              Drag & drop image or click to browse
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => fileInputRef.current?.click()}
                              className="text-xs"
                            >
                              <Upload className="w-3 h-3 mr-2" />
                              Browse
                            </Button>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleFileInput}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={editingBlog ? handleUpdateBlog : handleAddBlog} 
                        className="flex-1 text-xs"
                        disabled={loading}
                        size="sm"
                      >
                        {loading ? (
                          <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                        ) : (
                        <Save className="w-3 h-3 mr-2" />
                        )}
                        {editingBlog ? 'Update Blog Post' : 'Add Blog Post'}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setIsAddBlogOpen(false);
                          setEditingBlog(null);
                          setNewBlog({
                            title: '',
                            excerpt: '',
                            content: '',
                            category: '',
                            tags: '',
                            metaTitle: '',
                            metaDescription: '',
                            isFeatured: false,
                            commentsEnabled: true,
                            image: null
                          });
                        }}
                        disabled={loading}
                        size="sm"
                        className="text-xs"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search blogs by title, content, or author..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 text-sm"
                  />
                </div>
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="text-xs"
                >
                  <Grid3X3 className="w-3 h-3" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="text-xs"
                >
                  <List className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Blogs Display */}
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2 text-sm">Loading blogs...</span>
          </div>
        ) : (
          <>
        {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {blogs.map((blog) => (
                  <BlogCard
                    key={blog.id}
                    blog={blog}
                    onEdit={handleEditBlog}
                    onDelete={handleDeleteBlog}
                    onToggleStatus={toggleBlogStatus}
                    onPreviewImage={setPreviewImage}
                    onView={handleViewBlog}
                  />
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Blog Posts ({blogs.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Blog Post</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                      {blogs.map((blog) => (
                    <TableRow key={blog.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 bg-muted rounded flex items-center justify-center overflow-hidden relative group cursor-pointer">
                            {blog.featuredImage ? (
                              <>
                          <img
                                  src={blog.featuredImage}
                            alt={blog.title}
                                  className="w-full h-full object-contain bg-gray-100 transition-transform group-hover:scale-105"
                                  onError={(e) => {
                                    e.currentTarget.src = '/placeholder.svg';
                                  }}
                                  onClick={() => setPreviewImage(blog.featuredImage)}
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                  <ZoomIn className="w-3 h-3 text-white" />
                                </div>
                              </>
                            ) : (
                              <ImageIcon className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{blog.title}</p>
                            <p className="text-xs text-muted-foreground">{blog.readTime}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span className="text-sm">{blog.author.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{blog.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={blog.status === 'published' ? 'default' : 'secondary'} className="text-xs">
                          {blog.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{blog.views}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-1 justify-end">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEditBlog(blog)}
                            className="text-xs"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => toggleBlogStatus(blog.id, blog.status)}
                            className="text-xs"
                          >
                            {blog.status === 'published' ? 'Unpublish' : 'Publish'}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs"
                            onClick={() => handleDeleteBlog(blog.id)}
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
            )}
          </>
        )}
      </main>

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-4xl max-h-[90vh] p-3">
            <img
              src={previewImage}
              alt="Blog preview"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <Button
              variant="outline"
              size="sm"
              className="absolute top-2 right-2 bg-white/90 hover:bg-white text-xs"
              onClick={() => setPreviewImage(null)}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Blog View Modal */}
      <BlogViewModal
        blog={viewingBlog}
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setViewingBlog(null);
        }}
      />
    </div>
  );
};

export default AdminBlogManagement;
