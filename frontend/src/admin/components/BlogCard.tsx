import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Image as ImageIcon, 
  ZoomIn, 
  User, 
  Calendar, 
  Edit, 
  Trash2, 
  Eye,
  Tag,
  Heart
} from 'lucide-react';
import { Blog } from '@/services/blogApi';

interface BlogCardProps {
  blog: Blog;
  onEdit: (blog: Blog) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, status: string) => void;
  onPreviewImage: (imageUrl: string) => void;
  onView: (blog: Blog) => void;
}

const BlogCard: React.FC<BlogCardProps> = ({
  blog,
  onEdit,
  onDelete,
  onToggleStatus,
  onPreviewImage,
  onView
}) => {
  return (
    <Card className="service-card hover:shadow-lg transition-shadow">
      <CardContent className="p-0">
        {/* Blog Image */}
        <div className="aspect-video bg-muted rounded-t-lg flex items-center justify-center overflow-hidden relative group">
          {blog.featuredImage ? (
            <>
              <img
                src={blog.featuredImage}
                alt={blog.title}
                className="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg';
                }}
                onClick={() => onPreviewImage(blog.featuredImage)}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <ZoomIn className="w-6 h-6 text-white" />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-muted-foreground">
              <ImageIcon className="w-8 h-8 mb-2" />
              <span className="text-xs">No Image</span>
            </div>
          )}
        </div>

        {/* Blog Content */}
        <div className="p-3 space-y-3">
          {/* Title and Excerpt */}
          <div>
            <h3 className="text-sm font-semibold text-foreground line-clamp-2 mb-1">
              {blog.title}
            </h3>
          </div>

          {/* Author and Date */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span className="truncate">{blog.author.name}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{blog.formattedDate || new Date(blog.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Category and Status */}
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs px-2 py-1">
              {blog.category}
            </Badge>
          </div>

          {/* Tags */}
          {blog.tags && blog.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {blog.tags.slice(0, 2).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs px-1 py-0">
                  <Tag className="w-2 h-2 mr-1" />
                  {tag}
                </Badge>
              ))}
              {blog.tags.length > 2 && (
                <Badge variant="secondary" className="text-xs px-1 py-0">
                  +{blog.tags.length - 2}
                </Badge>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <span>{blog.readTime}</span>          
              <span>{blog.likes} likes</span>
            </div>
            <div className="flex items-center gap-1">
              <span>★</span>
              <span>{blog.rating}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-1 pt-2 border-t">
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full text-xs h-7"
              onClick={() => onView(blog)}
            >
              <Eye className="w-3 h-3 mr-1" />
              View
            </Button>
            <div className="flex gap-1">
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1 text-xs h-7"
                onClick={() => onEdit(blog)}
              >
                <Edit className="w-3 h-3 mr-1" />
                Edit
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1 text-xs h-7"
                onClick={() => onToggleStatus(blog.id, blog.status || 'draft')}
              >
                {(blog.status || 'draft') === 'published' ? 'Unpublish' : 'Publish'}
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs h-7"
                onClick={() => onDelete(blog.id)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BlogCard;
