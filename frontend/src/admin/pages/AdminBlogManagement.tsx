import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminHeader from '../components/AdminHeader';
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
  FileText
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

const AdminBlogManagement = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isAddBlogOpen, setIsAddBlogOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sample blog data
  const [blogs, setBlogs] = useState([
    {
      id: 'B001',
      title: 'How to Maintain Your Home Appliances',
      content: 'Regular maintenance of home appliances can extend their lifespan and improve efficiency. Here are some essential tips...',
      author: 'John Smith',
      category: 'Home Maintenance',
      image: '/washing.jpg',
      status: 'published',
      publishDate: '2024-01-15',
      readTime: '5 min read',
      views: 1250,
      tags: ['appliances', 'maintenance', 'home']
    },
    {
      id: 'B002',
      title: 'Common Laptop Issues and Solutions',
      content: 'Laptops can face various issues over time. Learn about the most common problems and how to fix them...',
      author: 'Sarah Johnson',
      category: 'Technology',
      image: '/laptop.avif',
      status: 'published',
      publishDate: '2024-01-12',
      readTime: '7 min read',
      views: 980,
      tags: ['laptop', 'repair', 'technology']
    },
    {
      id: 'B003',
      title: 'AC Maintenance Tips for Summer',
      content: 'Keep your air conditioner running efficiently during the hot summer months with these maintenance tips...',
      author: 'Mike Wilson',
      category: 'HVAC',
      image: '/ac.png',
      status: 'draft',
      publishDate: '2024-01-10',
      readTime: '4 min read',
      views: 0,
      tags: ['ac', 'summer', 'maintenance']
    }
  ]);

  // Sample categories
  const categories = [
    'Home Maintenance',
    'Technology',
    'HVAC',
    'Plumbing',
    'Electrical',
    'General Tips',
    'Product Reviews'
  ];

  const [newBlog, setNewBlog] = useState({
    title: '',
    content: '',
    author: '',
    category: '',
    tags: '',
    image: null as File | null
  });

  const filteredBlogs = blogs.filter(blog => {
    const matchesSearch = blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         blog.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         blog.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || blog.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || blog.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

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

  const handleAddBlog = () => {
    if (newBlog.title && newBlog.content && newBlog.author && newBlog.category && newBlog.image) {
      const blog = {
        id: `B${String(blogs.length + 1).padStart(3, '0')}`,
        title: newBlog.title,
        content: newBlog.content,
        author: newBlog.author,
        category: newBlog.category,
        image: URL.createObjectURL(newBlog.image),
        status: 'draft',
        publishDate: new Date().toISOString().split('T')[0],
        readTime: `${Math.ceil(newBlog.content.length / 500)} min read`,
        views: 0,
        tags: newBlog.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };
      
      setBlogs(prev => [...prev, blog]);
      setNewBlog({
        title: '',
        content: '',
        author: '',
        category: '',
        tags: '',
        image: null
      });
      setIsAddBlogOpen(false);
    }
  };

  const handleEditBlog = (blog: any) => {
    setNewBlog({
      title: blog.title,
      content: blog.content,
      author: blog.author,
      category: blog.category,
      tags: blog.tags.join(', '),
      image: null
    });
    setIsAddBlogOpen(true);
  };

  const handleDeleteBlog = (blogId: string) => {
    if (window.confirm('Are you sure you want to delete this blog post?')) {
      setBlogs(prev => prev.filter(blog => blog.id !== blogId));
    }
  };

  const toggleBlogStatus = (blogId: string) => {
    setBlogs(prev => prev.map(blog => 
      blog.id === blogId 
        ? { ...blog, status: blog.status === 'published' ? 'draft' : 'published' }
        : blog
    ));
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      
      <main className="ml-72 pt-32 p-6">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4">
                Blog <span className="text-gradient">Management</span>
              </h1>
              <p className="text-muted-foreground">Manage blog posts and content</p>
            </div>
            <div className="flex items-center gap-4">
              <Dialog open={isAddBlogOpen} onOpenChange={setIsAddBlogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Blog Post
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Blog Post</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="blogTitle">Blog Title</Label>
                      <Input
                        id="blogTitle"
                        value={newBlog.title}
                        onChange={(e) => setNewBlog(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter blog title"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="blogAuthor">Author</Label>
                      <Input
                        id="blogAuthor"
                        value={newBlog.author}
                        onChange={(e) => setNewBlog(prev => ({ ...prev, author: e.target.value }))}
                        placeholder="Enter author name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="blogCategory">Category</Label>
                      <Select value={newBlog.category} onValueChange={(value) => setNewBlog(prev => ({ ...prev, category: value }))}>
                        <SelectTrigger>
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
                      <Label htmlFor="blogTags">Tags (comma separated)</Label>
                      <Input
                        id="blogTags"
                        value={newBlog.tags}
                        onChange={(e) => setNewBlog(prev => ({ ...prev, tags: e.target.value }))}
                        placeholder="e.g., maintenance, tips, repair"
                      />
                    </div>

                    <div>
                      <Label htmlFor="blogContent">Blog Content</Label>
                      <Textarea
                        id="blogContent"
                        value={newBlog.content}
                        onChange={(e) => setNewBlog(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="Write your blog content here..."
                        rows={8}
                      />
                    </div>

                    <div>
                      <Label>Featured Image</Label>
                      <div
                        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                          dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                        }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                      >
                        {newBlog.image ? (
                          <div className="space-y-2">
                            <img
                              src={URL.createObjectURL(newBlog.image)}
                              alt="Blog preview"
                              className="w-32 h-32 object-cover rounded mx-auto"
                            />
                            <p className="text-sm text-muted-foreground">{newBlog.image.name}</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setNewBlog(prev => ({ ...prev, image: null }))}
                            >
                              <X className="w-4 h-4 mr-2" />
                              Remove
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                              Drag & drop blog image here or click to browse
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <Upload className="w-4 h-4 mr-2" />
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
                      <Button onClick={handleAddBlog} className="flex-1">
                        <Save className="w-4 h-4 mr-2" />
                        Add Blog Post
                      </Button>
                      <Button variant="outline" onClick={() => setIsAddBlogOpen(false)}>
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
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search blogs by title, content, or author..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-48">
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
                <SelectTrigger className="w-full md:w-48">
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
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Blogs Display */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBlogs.map((blog) => (
              <Card key={blog.id} className="service-card hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <div className="aspect-video bg-muted rounded-t-lg flex items-center justify-center overflow-hidden">
                    <img
                      src={blog.image}
                      alt={blog.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground line-clamp-2">{blog.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{blog.content}</p>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>{blog.author}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{blog.publishDate}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{blog.category}</Badge>
                      <Badge variant={blog.status === 'published' ? 'default' : 'secondary'}>
                        {blog.status}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {blog.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {blog.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{blog.tags.length - 3}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{blog.readTime}</span>
                      <span>{blog.views} views</span>
                    </div>

                    <div className="space-y-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full text-xs"
                        onClick={() => handleEditBlog(blog)}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1 text-xs"
                          onClick={() => toggleBlogStatus(blog.id)}
                        >
                          {blog.status === 'published' ? 'Unpublish' : 'Publish'}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteBlog(blog.id)}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Blog Posts ({filteredBlogs.length})</CardTitle>
            </CardHeader>
            <CardContent>
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
                  {filteredBlogs.map((blog) => (
                    <TableRow key={blog.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img
                            src={blog.image}
                            alt={blog.title}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div>
                            <p className="font-medium text-foreground">{blog.title}</p>
                            <p className="text-sm text-muted-foreground">{blog.readTime}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>{blog.author}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{blog.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={blog.status === 'published' ? 'default' : 'secondary'}>
                          {blog.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span>{blog.views}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEditBlog(blog)}
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => toggleBlogStatus(blog.id)}
                          >
                            {blog.status === 'published' ? 'Unpublish' : 'Publish'}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
      </main>
    </div>
  );
};

export default AdminBlogManagement;
