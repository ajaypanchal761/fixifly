import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, CheckCircle, Clock, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import cityApiService, { City } from '@/services/cityApi';

interface CitySelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCitySelect: (city: City) => void;
  serviceName: string;
  serviceId: string;
}

const CitySelectionModal: React.FC<CitySelectionModalProps> = ({
  isOpen,
  onClose,
  onCitySelect,
  serviceName,
  serviceId
}) => {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      const fetchCities = async () => {
        try {
          setLoading(true);
          const response = await cityApiService.getActiveCities({ limit: 10 });
          if (response.success) {
            setCities(response.data.cities);
          } else {
            // No fallback data - show empty array if API fails
            setCities([]);
          }
        } catch (error) {
          console.error('Error fetching cities:', error);
          // No fallback data - show empty array if API fails
          setCities([]);
        } finally {
          setLoading(false);
        }
      };

      fetchCities();
    }
  }, [isOpen]);

  const handleCitySelect = (city: City) => {
    if (!city.isActive) {
      toast({
        title: "Service Not Available",
        description: `Sorry, ${serviceName} is not available in ${city.name} yet.`,
        variant: "destructive"
      });
      return;
    }

    setSelectedCity(city);
    onCitySelect(city);
    onClose();
  };

  const handleClose = () => {
    setSelectedCity(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            Select Your City
          </DialogTitle>
          <p className="text-sm text-muted-foreground text-center mt-2">
            Choose your city to check service availability for <strong>{serviceName}</strong>
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : cities.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">No Cities Available</h3>
              <p className="text-sm text-muted-foreground mb-4">
                No cities have been added yet. Please contact admin to add service cities.
              </p>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {cities.map((city) => (
                <Card 
                  key={city._id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    !city.isActive ? 'opacity-60' : 'hover:border-primary'
                  } ${selectedCity?._id === city._id ? 'border-primary bg-primary/5' : ''}`}
                  onClick={() => handleCitySelect(city)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          city.isActive ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          <MapPin className={`w-5 h-5 ${
                            city.isActive ? 'text-green-600' : 'text-gray-400'
                          }`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm">{city.name}</h3>
                          <p className="text-xs text-muted-foreground">{city.state}</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        {city.isActive ? (
                          <div className="space-y-1">
                            <Badge variant="secondary" className="text-xs">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Available
                            </Badge>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            Coming Soon
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground text-center">
              Don't see your city? Service is not available in your city yet.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CitySelectionModal;
