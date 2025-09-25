import Blog from '../models/Blog.js';
import Admin from '../models/Admin.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import imageUploadService from '../utils/imageUpload.js';
import { logger } from '../utils/logger.js';

// @desc    Get all published blogs (Public)
// @route   GET /api/blogs
// @access  Public
const getBlogs = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    category, 
    search, 
    featured, 
    sort = 'publishedAt' 
  } = req.query;

  // Build query
  const query = {
    status: 'published',
    isActive: true
  };

  if (category && category !== 'all') {
    query.category = category;
  }

  if (featured === 'true') {
    query.isFeatured = true;
  }

  // Build sort object
  let sortObj = {};
  switch (sort) {
    case 'views':
      sortObj = { views: -1 };
      break;
    case 'likes':
      sortObj = { likes: -1 };
      break;
    case 'rating':
      sortObj = { rating: -1 };
      break;
    case 'title':
      sortObj = { title: 1 };
      break;
    default:
      sortObj = { publishedAt: -1 };
  }

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  let blogs;
  let total;

  if (search) {
    // Text search
    blogs = await Blog.find({
      ...query,
      $text: { $search: search }
    })
      .populate('author', 'name email')
      .sort({ score: { $meta: 'textScore' }, ...sortObj })
      .skip(skip)
      .limit(parseInt(limit));

    total = await Blog.countDocuments({
      ...query,
      $text: { $search: search }
    });
  } else {
    blogs = await Blog.find(query)
      .populate('author', 'name email')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    total = await Blog.countDocuments(query);
  }

  // Format response
  const formattedBlogs = blogs.map(blog => ({
    id: blog._id,
    title: blog.title,
    slug: blog.slug,
    excerpt: blog.excerpt,
    content: blog.content,
    author: {
      id: blog.author._id,
      name: blog.authorName,
      email: blog.author.email
    },
    featuredImage: blog.featuredImage,
    category: blog.category,
    tags: blog.tags,
    readTime: blog.readTime,
    publishedAt: blog.publishedAt,
    formattedDate: blog.formattedDate,
    views: blog.views,
    likes: blog.likes,
    rating: blog.rating,
    reviewCount: blog.reviewCount,
    isFeatured: blog.isFeatured,
    createdAt: blog.createdAt,
    updatedAt: blog.updatedAt
  }));

  res.status(200).json({
    success: true,
    data: {
      blogs: formattedBlogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }
  });
});

// @desc    Get single blog by slug (Public)
// @route   GET /api/blogs/:slug
// @access  Public
const getBlogBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const blog = await Blog.findOne({
    slug,
    status: 'published',
    isActive: true
  }).populate('author', 'name email');

  if (!blog) {
    return res.status(404).json({
      success: false,
      message: 'Blog not found'
    });
  }

  // Increment views
  await blog.incrementViews();

  // Get related blogs
  const relatedBlogs = await Blog.find({
    _id: { $ne: blog._id },
    category: blog.category,
    status: 'published',
    isActive: true
  })
    .populate('author', 'name email')
    .sort({ publishedAt: -1 })
    .limit(3);

  const formattedBlog = {
    id: blog._id,
    title: blog.title,
    slug: blog.slug,
    excerpt: blog.excerpt,
    content: blog.content,
    author: {
      id: blog.author._id,
      name: blog.authorName,
      email: blog.author.email
    },
    featuredImage: blog.featuredImage,
    category: blog.category,
    tags: blog.tags,
    readTime: blog.readTime,
    publishedAt: blog.publishedAt,
    formattedDate: blog.formattedDate,
    views: blog.views + 1, // Incremented view
    likes: blog.likes,
    rating: blog.rating,
    reviewCount: blog.reviewCount,
    isFeatured: blog.isFeatured,
    metaTitle: blog.metaTitle,
    metaDescription: blog.metaDescription,
    createdAt: blog.createdAt,
    updatedAt: blog.updatedAt
  };

  const formattedRelatedBlogs = relatedBlogs.map(relatedBlog => ({
    id: relatedBlog._id,
    title: relatedBlog.title,
    slug: relatedBlog.slug,
    excerpt: relatedBlog.excerpt,
    featuredImage: relatedBlog.featuredImage,
    category: relatedBlog.category,
    readTime: relatedBlog.readTime,
    publishedAt: relatedBlog.publishedAt,
    formattedDate: relatedBlog.formattedDate,
    views: relatedBlog.views,
    rating: relatedBlog.rating
  }));

  res.status(200).json({
    success: true,
    data: {
      blog: formattedBlog,
      relatedBlogs: formattedRelatedBlogs
    }
  });
});

// @desc    Get featured blogs (Public)
// @route   GET /api/blogs/featured
// @access  Public
const getFeaturedBlogs = asyncHandler(async (req, res) => {
  const { limit = 5 } = req.query;

  const blogs = await Blog.getFeaturedBlogs(parseInt(limit));

  const formattedBlogs = blogs.map(blog => ({
    id: blog._id,
    title: blog.title,
    slug: blog.slug,
    excerpt: blog.excerpt,
    content: blog.content,
    author: {
      name: blog.authorName
    },
    featuredImage: blog.featuredImage,
    category: blog.category,
    readTime: blog.readTime,
    publishedAt: blog.publishedAt,
    formattedDate: blog.formattedDate,
    views: blog.views,
    rating: blog.rating,
    reviewCount: blog.reviewCount
  }));

  res.status(200).json({
    success: true,
    data: {
      blogs: formattedBlogs
    }
  });
});

// @desc    Get recent blogs (Public)
// @route   GET /api/blogs/recent
// @access  Public
const getRecentBlogs = asyncHandler(async (req, res) => {
  const { limit = 5 } = req.query;

  const blogs = await Blog.getRecentBlogs(parseInt(limit));

  const formattedBlogs = blogs.map(blog => ({
    id: blog._id,
    title: blog.title,
    slug: blog.slug,
    excerpt: blog.excerpt,
    content: blog.content,
    author: {
      name: blog.authorName
    },
    featuredImage: blog.featuredImage,
    category: blog.category,
    readTime: blog.readTime,
    publishedAt: blog.publishedAt,
    formattedDate: blog.formattedDate,
    views: blog.views,
    rating: blog.rating,
    reviewCount: blog.reviewCount
  }));

  res.status(200).json({
    success: true,
    data: {
      blogs: formattedBlogs
    }
  });
});

// @desc    Get popular blogs (Public)
// @route   GET /api/blogs/popular
// @access  Public
const getPopularBlogs = asyncHandler(async (req, res) => {
  const { limit = 5 } = req.query;

  const blogs = await Blog.getPopularBlogs(parseInt(limit));

  const formattedBlogs = blogs.map(blog => ({
    id: blog._id,
    title: blog.title,
    slug: blog.slug,
    excerpt: blog.excerpt,
    author: {
      name: blog.authorName
    },
    featuredImage: blog.featuredImage,
    category: blog.category,
    readTime: blog.readTime,
    publishedAt: blog.publishedAt,
    formattedDate: blog.formattedDate,
    views: blog.views,
    likes: blog.likes,
    rating: blog.rating,
    reviewCount: blog.reviewCount
  }));

  res.status(200).json({
    success: true,
    data: {
      blogs: formattedBlogs
    }
  });
});

// @desc    Get blog categories (Public)
// @route   GET /api/blogs/categories
// @access  Public
const getBlogCategories = asyncHandler(async (req, res) => {
  const categories = await Blog.aggregate([
    {
      $match: {
        status: 'published',
        isActive: true
      }
    },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  const formattedCategories = categories.map(cat => ({
    name: cat._id,
    count: cat.count
  }));

  res.status(200).json({
    success: true,
    data: {
      categories: formattedCategories
    }
  });
});

// ==================== ADMIN ROUTES ====================

// @desc    Get all blogs for admin
// @route   GET /api/admin/blogs
// @access  Private (Admin)
const getAdminBlogs = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    status, 
    category, 
    search, 
    sort = 'createdAt' 
  } = req.query;

  // Build query
  const query = {};

  if (status && status !== 'all') {
    query.status = status;
  }

  if (category && category !== 'all') {
    query.category = category;
  }

  if (search) {
    query.$text = { $search: search };
  }

  // Build sort object
  let sortObj = {};
  switch (sort) {
    case 'title':
      sortObj = { title: 1 };
      break;
    case 'publishedAt':
      sortObj = { publishedAt: -1 };
      break;
    case 'views':
      sortObj = { views: -1 };
      break;
    case 'likes':
      sortObj = { likes: -1 };
      break;
    default:
      sortObj = { createdAt: -1 };
  }

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const blogs = await Blog.find(query)
    .populate('author', 'name email')
    .sort(sortObj)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Blog.countDocuments(query);

  const formattedBlogs = blogs.map(blog => ({
    id: blog._id,
    title: blog.title,
    slug: blog.slug,
    excerpt: blog.excerpt,
    content: blog.content,
    author: {
      id: blog.author._id,
      name: blog.authorName,
      email: blog.author.email
    },
    featuredImage: blog.featuredImage,
    category: blog.category,
    tags: blog.tags,
    status: blog.status,
    readTime: blog.readTime,
    publishedAt: blog.publishedAt,
    formattedDate: blog.formattedDate,
    views: blog.views,
    likes: blog.likes,
    rating: blog.rating,
    reviewCount: blog.reviewCount,
    isFeatured: blog.isFeatured,
    isActive: blog.isActive,
    createdAt: blog.createdAt,
    updatedAt: blog.updatedAt
  }));

  res.status(200).json({
    success: true,
    data: {
      blogs: formattedBlogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }
  });
});

// @desc    Get single blog for admin
// @route   GET /api/admin/blogs/:id
// @access  Private (Admin)
const getAdminBlog = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const blog = await Blog.findById(id).populate('author', 'name email');

  if (!blog) {
    return res.status(404).json({
      success: false,
      message: 'Blog not found'
    });
  }

  const formattedBlog = {
    id: blog._id,
    title: blog.title,
    slug: blog.slug,
    excerpt: blog.excerpt,
    content: blog.content,
    author: {
      id: blog.author._id,
      name: blog.authorName,
      email: blog.author.email
    },
    featuredImage: blog.featuredImage,
    category: blog.category,
    tags: blog.tags,
    status: blog.status,
    readTime: blog.readTime,
    publishedAt: blog.publishedAt,
    formattedDate: blog.formattedDate,
    views: blog.views,
    likes: blog.likes,
    rating: blog.rating,
    reviewCount: blog.reviewCount,
    isFeatured: blog.isFeatured,
    isActive: blog.isActive,
    metaTitle: blog.metaTitle,
    metaDescription: blog.metaDescription,
    commentsEnabled: blog.commentsEnabled,
    createdAt: blog.createdAt,
    updatedAt: blog.updatedAt
  };

  res.status(200).json({
    success: true,
    data: {
      blog: formattedBlog
    }
  });
});

// @desc    Create new blog
// @route   POST /api/admin/blogs
// @access  Private (Admin)
const createBlog = asyncHandler(async (req, res) => {
  const {
    title,
    excerpt,
    content,
    category,
    tags,
    metaTitle,
    metaDescription,
    isFeatured,
    commentsEnabled
  } = req.body;

  const adminId = req.admin._id;

  // Get admin details
  const admin = await Admin.findById(adminId);
  if (!admin) {
    return res.status(404).json({
      success: false,
      message: 'Admin not found'
    });
  }

  // Create blog
  const blog = new Blog({
    title,
    excerpt: excerpt || '', // Default empty string if not provided
    content,
    author: adminId,
    authorName: admin.name,
    category,
    tags: tags ? tags.split(',').map(tag => tag.trim().toLowerCase()) : [],
    metaTitle: metaTitle || '',
    metaDescription: metaDescription || '',
    isFeatured: isFeatured === 'true' || isFeatured === true || false,
    commentsEnabled: commentsEnabled !== 'false' && commentsEnabled !== false || true,
    status: 'draft',
    featuredImage: '' // Default empty string for featured image
  });

  await blog.save();

  const formattedBlog = {
    id: blog._id,
    title: blog.title,
    slug: blog.slug,
    excerpt: blog.excerpt,
    content: blog.content,
    author: {
      id: blog.author,
      name: blog.authorName
    },
    featuredImage: blog.featuredImage,
    category: blog.category,
    tags: blog.tags,
    status: blog.status,
    readTime: blog.readTime,
    isFeatured: blog.isFeatured,
    isActive: blog.isActive,
    createdAt: blog.createdAt,
    updatedAt: blog.updatedAt
  };

  logger.info('Blog created successfully', {
    blogId: blog._id,
    title: blog.title,
    authorId: adminId
  });

  res.status(201).json({
    success: true,
    message: 'Blog created successfully',
    data: {
      blog: formattedBlog
    }
  });
});

// @desc    Update blog
// @route   PUT /api/admin/blogs/:id
// @access  Private (Admin)
const updateBlog = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    title,
    excerpt,
    content,
    category,
    tags,
    status,
    metaTitle,
    metaDescription,
    isFeatured,
    commentsEnabled
  } = req.body;

  const blog = await Blog.findById(id);

  if (!blog) {
    return res.status(404).json({
      success: false,
      message: 'Blog not found'
    });
  }

  // Update fields
  if (title !== undefined) blog.title = title;
  if (excerpt !== undefined) blog.excerpt = excerpt;
  if (content !== undefined) blog.content = content;
  if (category !== undefined) blog.category = category;
  if (tags !== undefined) {
    blog.tags = tags ? tags.split(',').map(tag => tag.trim().toLowerCase()) : [];
  }
  if (status !== undefined) blog.status = status;
  if (metaTitle !== undefined) blog.metaTitle = metaTitle;
  if (metaDescription !== undefined) blog.metaDescription = metaDescription;
  if (isFeatured !== undefined) blog.isFeatured = isFeatured === 'true' || isFeatured === true;
  if (commentsEnabled !== undefined) blog.commentsEnabled = commentsEnabled !== 'false' && commentsEnabled !== false;

  await blog.save();

  const formattedBlog = {
    id: blog._id,
    title: blog.title,
    slug: blog.slug,
    excerpt: blog.excerpt,
    content: blog.content,
    author: {
      id: blog.author,
      name: blog.authorName
    },
    featuredImage: blog.featuredImage,
    category: blog.category,
    tags: blog.tags,
    status: blog.status,
    readTime: blog.readTime,
    publishedAt: blog.publishedAt,
    formattedDate: blog.formattedDate,
    isFeatured: blog.isFeatured,
    isActive: blog.isActive,
    metaTitle: blog.metaTitle,
    metaDescription: blog.metaDescription,
    commentsEnabled: blog.commentsEnabled,
    createdAt: blog.createdAt,
    updatedAt: blog.updatedAt
  };

  logger.info('Blog updated successfully', {
    blogId: blog._id,
    title: blog.title
  });

  res.status(200).json({
    success: true,
    message: 'Blog updated successfully',
    data: {
      blog: formattedBlog
    }
  });
});

// @desc    Upload blog featured image
// @route   POST /api/admin/blogs/:id/image
// @access  Private (Admin)
const uploadBlogImage = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No image file provided'
    });
  }

  const blog = await Blog.findById(id);

  if (!blog) {
    return res.status(404).json({
      success: false,
      message: 'Blog not found'
    });
  }

  try {
    logger.info('Starting blog image upload', {
      blogId: id,
      fileName: req.file.originalname,
      fileSize: req.file.size
    });

    // Upload image to Cloudinary
    const uploadResult = await imageUploadService.uploadBlogImage(req.file, id);

    if (uploadResult.success) {
      // Delete old image from Cloudinary if exists
      if (blog.featuredImage) {
        try {
          const oldPublicId = imageUploadService.extractPublicId(blog.featuredImage);
          if (oldPublicId) {
            await imageUploadService.deleteBlogImage(oldPublicId, id);
          }
        } catch (deleteError) {
          logger.warn('Failed to delete old blog image', {
            blogId: id,
            oldImageUrl: blog.featuredImage,
            error: deleteError.message
          });
        }
      }

      // Update blog with new image URL
      blog.featuredImage = uploadResult.data.secureUrl;
      await blog.save();

      logger.info('Blog image uploaded successfully', {
        blogId: id,
        newImageUrl: blog.featuredImage
      });

      res.status(200).json({
        success: true,
        message: 'Blog image uploaded successfully',
        data: {
          featuredImage: blog.featuredImage,
          imageUrl: blog.featuredImage,
          publicId: uploadResult.data.publicId
        }
      });
    } else {
      throw new Error('Failed to upload image to Cloudinary');
    }

  } catch (error) {
    logger.error('Upload Blog Image Error:', {
      blogId: id,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload blog image. Please try again.'
    });
  }
});

// @desc    Delete blog
// @route   DELETE /api/admin/blogs/:id
// @access  Private (Admin)
const deleteBlog = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const blog = await Blog.findById(id);

  if (!blog) {
    return res.status(404).json({
      success: false,
      message: 'Blog not found'
    });
  }

  // Delete image from Cloudinary if exists
  if (blog.featuredImage) {
    try {
      const publicId = imageUploadService.extractPublicId(blog.featuredImage);
      if (publicId) {
        await imageUploadService.deleteBlogImage(publicId, id);
      }
    } catch (deleteError) {
      logger.warn('Failed to delete blog image from Cloudinary', {
        blogId: id,
        imageUrl: blog.featuredImage,
        error: deleteError.message
      });
    }
  }

  await Blog.findByIdAndDelete(id);

  logger.info('Blog deleted successfully', {
    blogId: id,
    title: blog.title
  });

  res.status(200).json({
    success: true,
    message: 'Blog deleted successfully'
  });
});

// @desc    Toggle blog status
// @route   PUT /api/admin/blogs/:id/status
// @access  Private (Admin)
const toggleBlogStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const blog = await Blog.findById(id);

  if (!blog) {
    return res.status(404).json({
      success: false,
      message: 'Blog not found'
    });
  }

  blog.status = status;
  await blog.save();

  logger.info('Blog status updated', {
    blogId: id,
    title: blog.title,
    newStatus: status
  });

  res.status(200).json({
    success: true,
    message: 'Blog status updated successfully',
    data: {
      status: blog.status,
      publishedAt: blog.publishedAt
    }
  });
});

// @desc    Get blog statistics
// @route   GET /api/admin/blogs/stats
// @access  Private (Admin)
const getBlogStats = asyncHandler(async (req, res) => {
  const stats = await Blog.getBlogStats();

  const result = stats[0] || {
    totalBlogs: 0,
    publishedBlogs: 0,
    draftBlogs: 0,
    totalViews: 0,
    totalLikes: 0,
    averageRating: 0
  };

  res.status(200).json({
    success: true,
    data: {
      stats: result
    }
  });
});

// @desc    Like a blog
// @route   POST /api/blogs/:id/like
// @access  Public
const likeBlog = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const blog = await Blog.findById(id);
  
  if (!blog) {
    return res.status(404).json({
      success: false,
      message: 'Blog not found'
    });
  }
  
  // Get user identifier (IP address + User-Agent for uniqueness)
  const userIdentifier = `${req.ip}-${req.get('User-Agent')}`;
  
  try {
    await blog.likePost(userIdentifier);
    
    res.status(200).json({
      success: true,
      data: {
        likes: blog.likes,
        hasLiked: true
      },
      message: 'Blog liked successfully'
    });
  } catch (error) {
    if (error.message === 'User has already liked this post') {
      return res.status(400).json({
        success: false,
        message: 'You have already liked this post'
      });
    }
    throw error;
  }
});

// @desc    Unlike a blog
// @route   POST /api/blogs/:id/unlike
// @access  Public
const unlikeBlog = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const blog = await Blog.findById(id);
  
  if (!blog) {
    return res.status(404).json({
      success: false,
      message: 'Blog not found'
    });
  }
  
  // Get user identifier (IP address + User-Agent for uniqueness)
  const userIdentifier = `${req.ip}-${req.get('User-Agent')}`;
  
  try {
    await blog.unlikePost(userIdentifier);
    
    res.status(200).json({
      success: true,
      data: {
        likes: blog.likes,
        hasLiked: false
      },
      message: 'Blog unliked successfully'
    });
  } catch (error) {
    if (error.message === 'User has not liked this post') {
      return res.status(400).json({
        success: false,
        message: 'You have not liked this post'
      });
    }
    throw error;
  }
});

// @desc    Check if user has liked a blog
// @route   GET /api/blogs/:id/like-status
// @access  Public
const getLikeStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const blog = await Blog.findById(id);
  
  if (!blog) {
    return res.status(404).json({
      success: false,
      message: 'Blog not found'
    });
  }
  
  // Get user identifier (IP address + User-Agent for uniqueness)
  const userIdentifier = `${req.ip}-${req.get('User-Agent')}`;
  const hasLiked = blog.likedBy.includes(userIdentifier);
  
  res.status(200).json({
    success: true,
    data: {
      hasLiked,
      likes: blog.likes
    }
  });
});

export {
  // Public routes
  getBlogs,
  getBlogBySlug,
  getFeaturedBlogs,
  getRecentBlogs,
  getPopularBlogs,
  getBlogCategories,
  likeBlog,
  unlikeBlog,
  getLikeStatus,
  
  // Admin routes
  getAdminBlogs,
  getAdminBlog,
  createBlog,
  updateBlog,
  uploadBlogImage,
  deleteBlog,
  toggleBlogStatus,
  getBlogStats
};
