import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Mail, Lock, Shield, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import adminApiService from '@/services/adminApi';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Basic validation
      if (!formData.email || !formData.password) {
        setError('Please fill in all fields');
        setIsLoading(false);
        return;
      }

      // Call backend API to login admin
      const response = await adminApiService.login({
        email: formData.email,
        password: formData.password
      });

      if (response.success && response.data) {
        // Tokens are automatically stored by adminApiService.login()
        console.log('Admin login successful:', {
          accessToken: response.data.accessToken ? `${response.data.accessToken.substring(0, 20)}...` : 'missing',
          refreshToken: response.data.refreshToken ? `${response.data.refreshToken.substring(0, 20)}...` : 'missing',
          adminData: response.data.admin
        });
        
        // Verify tokens were stored
        const storedToken = localStorage.getItem('adminToken');
        const storedRefreshToken = localStorage.getItem('adminRefreshToken');
        const storedAdminData = localStorage.getItem('adminData');
        
        console.log('Verification after login:', {
          storedToken: storedToken ? `${storedToken.substring(0, 20)}...` : 'missing',
          storedRefreshToken: storedRefreshToken ? `${storedRefreshToken.substring(0, 20)}...` : 'missing',
          storedAdminData: storedAdminData ? 'present' : 'missing'
        });

        toast({
          title: "Login Successful!",
          description: response.message || "Welcome to Fixifly Admin Panel",
        });

        // Redirect to admin dashboard
        navigate('/admin');
      } else {
        setError(response.message || 'Invalid email or password');
      }
    } catch (err: any) {
      console.error('Admin login error:', err);
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to Home Button */}
        <div className="mb-6">
          <Link 
            to="/" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">
              Admin <span className="text-gradient">Login</span>
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Access the Fixifly Admin Panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="admin@fixifly.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full btn-tech"
                disabled={isLoading}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>


            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an admin account?{' '}
                <Link to="/admin/signup" className="text-primary hover:text-primary/80 font-medium">
                  Create one here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            © 2024 Fixifly. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
