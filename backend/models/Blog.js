const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Blog title is required'],
    trim: true,
    minlength: [10, 'Title must be at least 10 characters long'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },

  slug: {
    type: String,
    required: false, // Made optional
    unique: true,
    lowercase: true,
    trim: true
  },

  excerpt: {
    type: String,
    required: false, // Made optional
    trim: true,
    maxlength: [500, 'Excerpt cannot exceed 500 characters'],
    default: '' // Default empty string
  },

  content: {
    type: String,
    required: [true, 'Blog content is required'],
    trim: true,
    minlength: [100, 'Content must be at least 100 characters long']
  },

  // Author Information
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: [true, 'Author is required']
  },

  authorName: {
    type: String,
    required: [true, 'Author name is required']
  },

  // Categorization
  category: {
    type: String,
    required: [true, 'Blog category is required'],
    enum: [
      'Technology',
      'Home Improvement',
      'Electronics',
      'Plumbing',
      'Electrical',
      'Air Conditioning',
      'Carpentry',
      'General',
      'General Tips',
      'Tips & Tricks',
      'Maintenance',
      'Repair',
      'Installation'
    ]
  },

  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],

  // Media
  featuredImage: {
    type: String,
    required: false, // Made optional
    default: '' // Default empty string
  },

  // Status and Publishing
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },

  publishedAt: {
    type: Date,
    default: null
  },

  // Reading Information
  readTime: {
    type: String,
    required: false, // Made optional
    default: '5 min read'
  },

  // Engagement Metrics
  views: {
    type: Number,
    default: 0
  },

  likes: {
    type: Number,
    default: 0
  },

  likedBy: [{
    type: String, // Store user IP or session ID
    default: []
  }],

  rating: {
    type: Number,
    default: 4.5,
    min: 0,
    max: 5
  },

  reviewCount: {
    type: Number,
    default: 0
  },

  // SEO
  metaTitle: {
    type: String,
    trim: true,
    maxlength: [60, 'Meta title cannot exceed 60 characters']
  },

  metaDescription: {
    type: String,
    trim: true,
    maxlength: [160, 'Meta description cannot exceed 160 characters']
  },

  // Status Flags
  isFeatured: {
    type: Boolean,
    default: false
  },

  isActive: {
    type: Boolean,
    default: true
  },

  // Comments
  commentsEnabled: {
    type: Boolean,
    default: true
  },

  // Related Blogs
  relatedBlogs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Blog'
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
blogSchema.index({ title: 'text', content: 'text', excerpt: 'text' });
blogSchema.index({ category: 1 });
blogSchema.index({ status: 1 });
blogSchema.index({ publishedAt: -1 });
blogSchema.index({ views: -1 });
blogSchema.index({ rating: -1 });
blogSchema.index({ isFeatured: 1 });
blogSchema.index({ isActive: 1 });

// Virtual for formatted date
blogSchema.virtual('formattedDate').get(function() {
  if (this.publishedAt) {
    return this.publishedAt.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
  return null;
});

// Pre-save middleware to generate slug and calculate read time
blogSchema.pre('save', function(next) {
  // Generate slug from title (always generate if not present)
  if (this.isModified('title') || !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }

  // Calculate read time (always calculate if content is present)
  if (this.isModified('content') || !this.readTime) {
    const wordsPerMinute = 200;
    const wordCount = this.content.split(/\s+/).length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    this.readTime = `${minutes} min read`;
  }

  // Set publishedAt when status changes to published
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }

  next();
});

// Instance methods
blogSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

blogSchema.methods.toggleLike = function() {
  this.likes += 1;
  return this.save();
};

blogSchema.methods.likePost = function(userIdentifier) {
  // Check if user already liked this post
  if (this.likedBy.includes(userIdentifier)) {
    return Promise.reject(new Error('User has already liked this post'));
  }
  
  // Add user to likedBy array and increment likes
  this.likedBy.push(userIdentifier);
  this.likes += 1;
  return this.save();
};

blogSchema.methods.unlikePost = function(userIdentifier) {
  // Check if user has liked this post
  if (!this.likedBy.includes(userIdentifier)) {
    return Promise.reject(new Error('User has not liked this post'));
  }
  
  // Remove user from likedBy array and decrement likes
  this.likedBy = this.likedBy.filter(id => id !== userIdentifier);
  if (this.likes > 0) {
    this.likes -= 1;
  }
  return this.save();
};

blogSchema.methods.updateRating = function(newRating) {
  const totalRating = (this.rating * this.reviewCount) + newRating;
  this.reviewCount += 1;
  this.rating = totalRating / this.reviewCount;
  return this.save();
};

// Static methods
blogSchema.statics.getFeaturedBlogs = function(limit = 5) {
  return this.find({ 
    isFeatured: true, 
    status: 'published', 
    isActive: true 
  })
  .sort({ publishedAt: -1 })
  .limit(limit)
  .populate('author', 'name email');
};

blogSchema.statics.getPopularBlogs = function(limit = 5) {
  return this.find({ 
    status: 'published', 
    isActive: true 
  })
  .sort({ views: -1 })
  .limit(limit)
  .populate('author', 'name email');
};

blogSchema.statics.getRecentBlogs = function(limit = 5) {
  return this.find({ 
    status: 'published', 
    isActive: true 
  })
  .sort({ publishedAt: -1 })
  .limit(limit)
  .populate('author', 'name email');
};

blogSchema.statics.getBlogsByCategory = function(category, limit = 10) {
  return this.find({ 
    category, 
    status: 'published', 
    isActive: true 
  })
  .sort({ publishedAt: -1 })
  .limit(limit)
  .populate('author', 'name email');
};

blogSchema.statics.searchBlogs = function(searchTerm, limit = 10) {
  return this.find({
    $text: { $search: searchTerm },
    status: 'published',
    isActive: true
  })
  .sort({ score: { $meta: 'textScore' } })
  .limit(limit)
  .populate('author', 'name email');
};

module.exports = mongoose.model('Blog', blogSchema);