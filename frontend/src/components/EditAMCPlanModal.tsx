import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Trash2 } from 'lucide-react';

interface AMCPlan {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  shortDescription: string;
  features: Array<{
    title: string;
    description: string;
  }>;
  benefits: {
    callSupport: string;
    remoteSupport: string;
    homeVisits: { count: number; description: string };
    antivirus: { included: boolean; name?: string };
    softwareInstallation: { included: boolean };
    sparePartsDiscount: { percentage: number };
    freeSpareParts: { amount: number };
    laborCost: { included: boolean };
  };
  status: string;
  isPopular: boolean;
  validityPeriod: number;
  tags: string[];
}

interface EditAMCPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: AMCPlan | null;
  onSave: (planData: AMCPlan) => Promise<void>;
}

const EditAMCPlanModal: React.FC<EditAMCPlanModalProps> = ({
  isOpen,
  onClose,
  plan,
  onSave
}) => {
  const [formData, setFormData] = useState<AMCPlan>({
    id: '',
    name: '',
    price: 0,
    period: 'yearly',
    description: '',
    shortDescription: '',
    features: [],
    benefits: {
      callSupport: 'unlimited',
      remoteSupport: 'unlimited',
      homeVisits: { count: 0, description: '' },
      antivirus: { included: false },
      softwareInstallation: { included: false },
      sparePartsDiscount: { percentage: 0 },
      freeSpareParts: { amount: 0 },
      laborCost: { included: false }
    },
    status: 'active',
    isPopular: false,
    validityPeriod: 365,
    tags: []
  });

  const [loading, setLoading] = useState(false);
  const [newFeature, setNewFeature] = useState({ title: '', description: '' });
  const [newTag, setNewTag] = useState('');
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (plan) {
      setFormData(plan);
    }
  }, [plan]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Plan name is required';
    }

    if (!formData.price || formData.price <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.validityPeriod || formData.validityPeriod <= 0) {
      newErrors.validityPeriod = 'Validity period must be greater than 0';
    }

    if (formData.features.length === 0) {
      newErrors.features = 'At least one feature is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleBenefitsChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      benefits: {
        ...prev.benefits,
        [field]: value
      }
    }));
  };

  const addFeature = () => {
    if (newFeature.title.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, { ...newFeature }]
      }));
      setNewFeature({ title: '', description: '' });
    }
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving plan:', error);
      // You can add more specific error handling here
    } finally {
      setLoading(false);
    }
  };

  if (!plan) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-y-auto !top-[55%] !translate-y-[-50%]" 
      >
        <DialogHeader>
          <DialogTitle>Edit AMC Plan: {plan.name}</DialogTitle>
          {plan?.id.startsWith('temp-') && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-2">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> This is a temporary plan. When you save changes, it will be created in the database and become a permanent plan.
              </p>
            </div>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Plan Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price (₹)</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => handleInputChange('price', parseFloat(e.target.value))}
                required
                className={errors.price ? 'border-red-500' : ''}
              />
              {errors.price && <p className="text-red-500 text-sm">{errors.price}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="period">Period</Label>
              <select
                id="period"
                value={formData.period}
                onChange={(e) => handleInputChange('period', e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="yearly">Yearly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="validityPeriod">Validity Period (Days)</Label>
              <Input
                id="validityPeriod"
                type="number"
                value={formData.validityPeriod}
                onChange={(e) => handleInputChange('validityPeriod', parseInt(e.target.value))}
                required
                className={errors.validityPeriod ? 'border-red-500' : ''}
              />
              {errors.validityPeriod && <p className="text-red-500 text-sm">{errors.validityPeriod}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={2}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="shortDescription">Short Description</Label>
            <Input
              id="shortDescription"
              value={formData.shortDescription}
              onChange={(e) => handleInputChange('shortDescription', e.target.value)}
            />
          </div>

          {/* Status and Popularity */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.status === 'active'}
                onCheckedChange={(checked) => handleInputChange('status', checked ? 'active' : 'inactive')}
              />
              <Label>Active Plan</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.isPopular}
                onCheckedChange={(checked) => handleInputChange('isPopular', checked)}
              />
              <Label>Most Popular</Label>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <Label>Plan Features</Label>
            {errors.features && <p className="text-red-500 text-sm">{errors.features}</p>}
            <div className="space-y-2">
              {formData.features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-2 p-2 border rounded">
                  <div className="flex-1">
                    <Input
                      value={feature.title}
                      onChange={(e) => {
                        const newFeatures = [...formData.features];
                        newFeatures[index].title = e.target.value;
                        handleInputChange('features', newFeatures);
                      }}
                      placeholder="Feature title"
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      value={feature.description}
                      onChange={(e) => {
                        const newFeatures = [...formData.features];
                        newFeatures[index].description = e.target.value;
                        handleInputChange('features', newFeatures);
                      }}
                      placeholder="Feature description"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeFeature(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex space-x-2">
              <Input
                value={newFeature.title}
                onChange={(e) => setNewFeature(prev => ({ ...prev, title: e.target.value }))}
                placeholder="New feature title"
              />
              <Input
                value={newFeature.description}
                onChange={(e) => setNewFeature(prev => ({ ...prev, description: e.target.value }))}
                placeholder="New feature description"
              />
              <Button type="button" onClick={addFeature}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Benefits Configuration */}
          <div className="space-y-4">
            <Label>Benefits Configuration</Label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Call Support</Label>
                <select
                  value={formData.benefits.callSupport}
                  onChange={(e) => handleBenefitsChange('callSupport', e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="unlimited">Unlimited</option>
                  <option value="limited">Limited</option>
                  <option value="none">None</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Remote Support</Label>
                <select
                  value={formData.benefits.remoteSupport}
                  onChange={(e) => handleBenefitsChange('remoteSupport', e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="unlimited">Unlimited</option>
                  <option value="limited">Limited</option>
                  <option value="none">None</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Home Visits Count</Label>
                <Input
                  type="number"
                  value={formData.benefits.homeVisits.count}
                  onChange={(e) => handleBenefitsChange('homeVisits', {
                    ...formData.benefits.homeVisits,
                    count: parseInt(e.target.value)
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label>Home Visits Description</Label>
                <Input
                  value={formData.benefits.homeVisits.description}
                  onChange={(e) => handleBenefitsChange('homeVisits', {
                    ...formData.benefits.homeVisits,
                    description: e.target.value
                  })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.benefits.antivirus.included}
                  onCheckedChange={(checked) => handleBenefitsChange('antivirus', {
                    ...formData.benefits.antivirus,
                    included: checked
                  })}
                />
                <Label>Include Antivirus</Label>
              </div>

              {formData.benefits.antivirus.included && (
                <div className="space-y-2">
                  <Label>Antivirus Name</Label>
                  <Input
                    value={formData.benefits.antivirus.name || ''}
                    onChange={(e) => handleBenefitsChange('antivirus', {
                      ...formData.benefits.antivirus,
                      name: e.target.value
                    })}
                    placeholder="e.g., Quick Heal Pro"
                  />
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.benefits.softwareInstallation.included}
                  onCheckedChange={(checked) => handleBenefitsChange('softwareInstallation', {
                    included: checked
                  })}
                />
                <Label>Include Software Installation</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.benefits.laborCost.included}
                  onCheckedChange={(checked) => handleBenefitsChange('laborCost', {
                    included: checked
                  })}
                />
                <Label>Include Labor Cost</Label>
              </div>

              <div className="space-y-2">
                <Label>Spare Parts Discount (%)</Label>
                <Input
                  type="number"
                  value={formData.benefits.sparePartsDiscount.percentage}
                  onChange={(e) => handleBenefitsChange('sparePartsDiscount', {
                    percentage: parseInt(e.target.value)
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label>Free Spare Parts Amount (₹)</Label>
                <Input
                  type="number"
                  value={formData.benefits.freeSpareParts.amount}
                  onChange={(e) => handleBenefitsChange('freeSpareParts', {
                    amount: parseInt(e.target.value)
                  })}
                />
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => removeTag(tag)}
                  />
                </Badge>
              ))}
            </div>
            <div className="flex space-x-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add new tag"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" onClick={addTag}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditAMCPlanModal;
