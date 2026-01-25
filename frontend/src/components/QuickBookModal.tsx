
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CalendarClock, MapPin, Mail, Phone, FileText } from 'lucide-react';
import axios from 'axios';

// Create API instance if not imported
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface QuickBookModalProps {
    isOpen: boolean;
    onClose: () => void;
    service: {
        _id?: string;
        id?: string;
        serviceName: string;
        price: number;
        discountPrice?: number;
    };
    productName?: string;
}

const QuickBookModal: React.FC<QuickBookModalProps> = ({
    isOpen,
    onClose,
    service,
    productName
}) => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        phone: '',
        address: '',
        preferredTime: '',
        issueNote: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validateForm = () => {
        if (!formData.phone || formData.phone.length < 10) {
            toast({ title: "Invalid Phone", description: "Please enter a valid phone number", variant: "destructive" });
            return false;
        }
        if (!formData.address) {
            toast({ title: "Address Required", description: "Please enter your address", variant: "destructive" });
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            setLoading(true);

            const payload = {
                ...formData,
                services: [{
                    id: service._id || service.id,
                    serviceName: service.serviceName,
                    price: service.discountPrice || service.price
                }],
                productName
            };

            const response = await axios.post(`${API_URL}/bookings/quick`, payload);

            if (response.data.success) {
                toast({
                    title: "Booking Successful! 🎉",
                    description: "Your booking has been confirmed. You will receive details shortly.",
                    variant: "default",
                    className: "bg-green-50 border-green-200 text-green-900"
                });
                onClose();
                // Reset form
                setFormData({ email: '', phone: '', address: '', preferredTime: '', issueNote: '' });
            }

        } catch (error: any) {
            console.error('Quick booking error:', error);
            toast({
                title: "Booking Failed",
                description: error.response?.data?.message || "Something went wrong. Please try again.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-center">Quick Booking</DialogTitle>
                    <DialogDescription className="text-center">
                        Complete your booking for <span className="font-semibold text-blue-600">{service.serviceName}</span>
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-2">

                    <div className="space-y-2">
                        <Label htmlFor="phone" className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-500" /> Phone Number <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="phone"
                            name="phone"
                            placeholder="e.g. 9876543210"
                            value={formData.phone}
                            onChange={handleChange}
                            type="tel"
                            required
                            className="border-gray-300 focus:border-blue-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-500" /> Email Address
                        </Label>
                        <Input
                            id="email"
                            name="email"
                            placeholder="email@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            type="email"
                            className="border-gray-300 focus:border-blue-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address" className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-500" /> Address <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                            id="address"
                            name="address"
                            placeholder="Flat no, Building, Area, City"
                            value={formData.address}
                            onChange={handleChange}
                            required
                            className="border-gray-300 focus:border-blue-500 min-h-[60px]"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="preferredTime" className="flex items-center gap-2">
                                <CalendarClock className="w-4 h-4 text-gray-500" /> Preferred Time (Optional)
                            </Label>
                            <Input
                                id="preferredTime"
                                name="preferredTime"
                                placeholder="e.g. Tomorrow Morning"
                                value={formData.preferredTime}
                                onChange={handleChange}
                                className="border-gray-300 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="issueNote" className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-500" /> Issue Note (Optional)
                        </Label>
                        <Textarea
                            id="issueNote"
                            name="issueNote"
                            placeholder="Briefly describe the issue..."
                            value={formData.issueNote}
                            onChange={handleChange}
                            className="border-gray-300 focus:border-blue-500 min-h-[60px]"
                        />
                    </div>

                    <DialogFooter className="pt-4 sticky bottom-0 bg-white">
                        <Button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Confirm Booking
                                </>
                            ) : (
                                'Confirm Booking'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default QuickBookModal;
