import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Calendar, 
  Clock, 
  Eye, 
  Heart, 
  Star,
  Tag,
  X,
  Image as ImageIcon
} from 'lucide-react';
import { Blog } from './BlogCard';

interface BlogViewModalProps {
  blog: Blog | null;
  isOpen: boolean;
  onClose: () => void;
}

const BlogViewModal: React.FC<BlogViewModalProps> = ({ blog, isOpen, onClose }) => {
  if (!blog) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto mt-10">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-bold">Blog Preview</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Blog Image */}
          <div className="aspect-video bg-muted rounded-lg overflow-hidden h-32">
            {blog.featuredImage ? (
              <img
                src={blog.featuredImage}
                alt={blog.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg';
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <ImageIcon className="w-16 h-16 mb-4" />
                <span className="text-lg">No Image Available</span>
              </div>
            )}
          </div>

          {/* Blog Title */}
          <div>
            <h1 className="text-xl font-bold text-foreground mb-2">
              {blog.title}
            </h1>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                <span>{blog.author.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{blog.formattedDate}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{blog.readTime}</span>
              </div>
            </div>
          </div>

          {/* Blog Meta Information */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-xs px-2 py-1">
              {blog.category}
            </Badge>
            <Badge 
              variant={blog.status === 'published' ? 'default' : 'secondary'} 
              className="text-xs px-2 py-1"
            >
              {blog.status}
            </Badge>
            {blog.isFeatured && (
              <Badge variant="secondary" className="text-xs px-2 py-1">
                Featured
              </Badge>
            )}
          </div>

          {/* Tags */}
          {blog.tags && blog.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {blog.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs px-1 py-0">
                  <Tag className="w-2 h-2 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Blog Stats */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>{blog.views} views</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="w-3 h-3" />
              <span>{blog.likes} likes</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3" />
              <span>{blog.rating} ({blog.reviewCount} reviews)</span>
            </div>
          </div>

          {/* Blog Excerpt */}
          {blog.excerpt && (
            <div className="bg-muted/50 p-3 rounded-lg">
              <h3 className="font-semibold text-foreground mb-1 text-sm">Excerpt</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                {blog.excerpt}
              </p>
            </div>
          )}

          {/* Blog Content */}
          <div>
            <h3 className="font-semibold text-foreground mb-2">Content</h3>
            <div className="border rounded-lg p-3 bg-background max-h-40 overflow-y-auto">
              <div className="text-foreground leading-relaxed whitespace-pre-wrap text-sm">
                {blog.content || 'No content available'}
              </div>
            </div>
          </div>

          {/* Blog Metadata */}
          <div className="border-t pt-3">
            <h3 className="font-semibold text-foreground mb-2 text-sm">Blog Information</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="font-medium text-foreground">Created:</span>
                <span className="text-muted-foreground ml-2">
                  {new Date(blog.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="font-medium text-foreground">Last Updated:</span>
                <span className="text-muted-foreground ml-2">
                  {new Date(blog.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="font-medium text-foreground">Slug:</span>
                <span className="text-muted-foreground ml-2 font-mono">
                  {blog.slug}
                </span>
              </div>
              <div>
                <span className="font-medium text-foreground">Active:</span>
                <span className="text-muted-foreground ml-2">
                  {blog.isActive ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BlogViewModal;
