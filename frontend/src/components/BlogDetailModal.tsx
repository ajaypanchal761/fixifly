import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Star, X } from "lucide-react";

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  image: string;
  category: string;
  readTime: string;
  date: string;
  author: string;
  rating: number;
  reviewCount: number;
}

interface BlogDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  blogPost: BlogPost | null;
}

const BlogDetailModal = ({ isOpen, onClose, blogPost }: BlogDetailModalProps) => {
  if (!blogPost) return null;

  // Helper function to render star rating
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={i} className="w-2 h-2 fill-yellow-400 text-yellow-400" />
      );
    }
    
    if (hasHalfStar) {
      stars.push(
        <Star key="half" className="w-2 h-2 fill-yellow-400/50 text-yellow-400" />
      );
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} className="w-2 h-2 text-gray-300" />
      );
    }
    
    return stars;
  };

  // Sample detailed content for each blog post
  const getBlogContent = (id: number) => {
    const contentMap: { [key: number]: string } = {
      1: `
        <h3>Common AC Problems and Solutions</h3>
        <p>Air conditioning systems are essential for comfort, but they can develop various issues over time. Here are the most common problems and their solutions:</p>
        
        <h4>1. AC Not Cooling</h4>
        <p>If your AC isn't cooling properly, check these common causes:</p>
        <ul>
          <li>Dirty air filters - Replace or clean monthly</li>
          <li>Blocked condenser unit - Clear debris around outdoor unit</li>
          <li>Low refrigerant levels - Requires professional service</li>
          <li>Thermostat issues - Check settings and battery</li>
        </ul>
        
        <h4>2. Strange Noises</h4>
        <p>Unusual sounds can indicate different problems:</p>
        <ul>
          <li>Grinding noise - Motor bearing issues</li>
          <li>Hissing sound - Refrigerant leak</li>
          <li>Clicking - Electrical problems</li>
          <li>Banging - Loose parts or debris</li>
        </ul>
        
        <h4>3. High Energy Bills</h4>
        <p>If your energy bills are unusually high:</p>
        <ul>
          <li>Clean or replace air filters</li>
          <li>Check for air leaks around windows and doors</li>
          <li>Ensure proper insulation</li>
          <li>Schedule regular maintenance</li>
        </ul>
        
        <h4>When to Call a Professional</h4>
        <p>While some issues can be DIY fixes, call a professional for:</p>
        <ul>
          <li>Refrigerant leaks</li>
          <li>Electrical problems</li>
          <li>Compressor issues</li>
          <li>Annual maintenance</li>
        </ul>
      `,
      2: `
        <h3>TV Repair: DIY vs Professional Service</h3>
        <p>Television problems can range from simple fixes to complex repairs. Here's how to determine when you can handle it yourself and when to call the experts.</p>
        
        <h4>Simple DIY Fixes</h4>
        <p>These issues can often be resolved at home:</p>
        <ul>
          <li>No power - Check power cord and outlet</li>
          <li>Remote not working - Replace batteries</li>
          <li>Poor picture quality - Adjust settings</li>
          <li>Sound issues - Check volume and audio settings</li>
        </ul>
        
        <h4>Moderate Issues</h4>
        <p>These may require some technical knowledge:</p>
        <ul>
          <li>Backlight problems</li>
          <li>HDMI port issues</li>
          <li>Software updates</li>
          <li>Basic component replacement</li>
        </ul>
        
        <h4>Professional Service Required</h4>
        <p>Call a professional for these complex issues:</p>
        <ul>
          <li>Screen damage or cracks</li>
          <li>Main board failures</li>
          <li>Power supply problems</li>
          <li>Warranty-covered repairs</li>
        </ul>
      `,
      3: `
        <h3>Refrigerator Maintenance for Longevity</h3>
        <p>Proper maintenance can extend your refrigerator's life by years and improve its efficiency. Follow these essential tips:</p>
        
        <h4>Regular Cleaning</h4>
        <ul>
          <li>Clean condenser coils every 6 months</li>
          <li>Wipe down door seals monthly</li>
          <li>Clean interior shelves and drawers</li>
          <li>Replace water filter as recommended</li>
        </ul>
        
        <h4>Temperature Management</h4>
        <ul>
          <li>Keep refrigerator at 37-40°F</li>
          <li>Freezer at 0°F</li>
          <li>Don't overfill compartments</li>
          <li>Allow proper air circulation</li>
        </ul>
        
        <h4>Energy Efficiency</h4>
        <ul>
          <li>Keep door seals clean and tight</li>
          <li>Don't leave doors open unnecessarily</li>
          <li>Check for proper leveling</li>
          <li>Clean dust from vents</li>
        </ul>
      `,
      4: `
        <h3>Washing Machine Troubleshooting Guide</h3>
        <p>Washing machine problems can be frustrating, but many issues have simple solutions. Here's your complete troubleshooting guide:</p>
        
        <h4>Common Problems and Solutions</h4>
        
        <h4>Machine Won't Start</h4>
        <ul>
          <li>Check power supply and circuit breaker</li>
          <li>Ensure door/lid is properly closed</li>
          <li>Check water supply valves</li>
          <li>Verify control panel settings</li>
        </ul>
        
        <h4>Poor Cleaning Performance</h4>
        <ul>
          <li>Use correct amount of detergent</li>
          <li>Don't overload the machine</li>
          <li>Clean detergent dispenser</li>
          <li>Check water temperature settings</li>
        </ul>
        
        <h4>Excessive Vibration</h4>
        <ul>
          <li>Level the machine properly</li>
          <li>Check for loose items in drum</li>
          <li>Ensure balanced load</li>
          <li>Check shock absorbers</li>
        </ul>
      `,
      5: `
        <h3>Electrical Safety Tips for Homeowners</h3>
        <p>Electrical safety is crucial for protecting your family and property. Follow these essential guidelines:</p>
        
        <h4>Basic Safety Rules</h4>
        <ul>
          <li>Never work on live circuits</li>
          <li>Use proper tools and equipment</li>
          <li>Turn off power at breaker box</li>
          <li>Test circuits before working</li>
        </ul>
        
        <h4>Outlet and Switch Safety</h4>
        <ul>
          <li>Don't overload outlets</li>
          <li>Use GFCI outlets in wet areas</li>
          <li>Replace damaged outlets immediately</li>
          <li>Keep outlets covered when not in use</li>
        </ul>
        
        <h4>When to Call an Electrician</h4>
        <ul>
          <li>Frequent circuit breaker trips</li>
          <li>Burning smells or sparks</li>
          <li>Hot outlets or switches</li>
          <li>Major electrical installations</li>
        </ul>
      `,
      6: `
        <h3>Plumbing Maintenance: Prevent Costly Repairs</h3>
        <p>Regular plumbing maintenance can save you thousands in emergency repairs. Here's your comprehensive guide:</p>
        
        <h4>Preventive Maintenance</h4>
        <ul>
          <li>Inspect pipes for leaks monthly</li>
          <li>Clean drains regularly</li>
          <li>Check water pressure</li>
          <li>Insulate pipes in cold areas</li>
        </ul>
        
        <h4>Common Issues to Watch For</h4>
        <ul>
          <li>Slow drains - Use drain cleaners or call plumber</li>
          <li>Low water pressure - Check for blockages</li>
          <li>Running toilets - Replace flapper or fill valve</li>
          <li>Leaky faucets - Replace washers or cartridges</li>
        </ul>
        
        <h4>Seasonal Maintenance</h4>
        <ul>
          <li>Winter: Insulate pipes, shut off outdoor water</li>
          <li>Spring: Check for winter damage</li>
          <li>Summer: Inspect outdoor plumbing</li>
          <li>Fall: Prepare for winter</li>
        </ul>
      `
    };
    
    return contentMap[id] || "<p>Detailed content coming soon...</p>";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xs sm:max-w-sm md:max-w-md max-h-[75vh] overflow-y-auto mx-1 sm:mx-4 mt-6 sm:mt-12 rounded-xl">
        <DialogHeader className="relative pb-1">      
          <DialogTitle className="text-xs sm:text-sm font-bold pr-5 leading-tight">
            {blogPost.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-1 sm:space-y-2">
          {/* Blog Image */}
          <div className="relative">
            <img 
              src={blogPost.image} 
              alt={blogPost.title}
              className="w-full h-24 sm:h-32 object-cover rounded-lg"
            />
            <Badge className="absolute top-0.5 left-0.5 sm:top-1 sm:left-1 bg-primary/90 text-white text-xs px-1 py-0.5 rounded-md">
              {blogPost.category}
            </Badge>
          </div>

          {/* Blog Meta Information */}
          <div className="flex flex-wrap items-center gap-0.5 sm:gap-1 text-xs text-gray-600">
            <div className="flex items-center gap-0.5">
              <Calendar className="w-2 h-2" />
              <span className="text-xs">{blogPost.date}</span>
            </div>
            <div className="flex items-center gap-0.5">
              <Clock className="w-2 h-2" />
              <span className="text-xs">{blogPost.readTime}</span>
            </div>
            <div className="flex items-center gap-0.5">
              <div className="flex items-center gap-0.5">
                {renderStars(blogPost.rating)}
              </div>
              <span className="font-semibold text-xs">{blogPost.rating}</span>
              <span className="text-xs">({blogPost.reviewCount})</span>
            </div>
            <span className="text-xs hidden sm:inline">By {blogPost.author}</span>
          </div>


          {/* Blog Content */}
          <div 
            className="prose prose-gray max-w-none prose-xs sm:prose-sm text-xs sm:text-sm"
            dangerouslySetInnerHTML={{ __html: getBlogContent(blogPost.id) }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BlogDetailModal;
