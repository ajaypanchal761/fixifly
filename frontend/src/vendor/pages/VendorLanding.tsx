import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Users, Star, Shield, Clock, DollarSign } from 'lucide-react';

const VendorLanding = () => {
  const features = [
    {
      icon: Users,
      title: "Connect with Customers",
      description: "Get matched with customers in your area who need your services"
    },
    {
      icon: DollarSign,
      title: "Earn More",
      description: "Set your own rates and earn competitive commissions on every job"
    },
    {
      icon: Star,
      title: "Build Reputation",
      description: "Get rated by customers and build a strong reputation in your field"
    },
    {
      icon: Shield,
      title: "Secure Payments",
      description: "Get paid securely and on time for all your completed services"
    },
    {
      icon: Clock,
      title: "Flexible Schedule",
      description: "Work on your own schedule and accept jobs that fit your availability"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <img 
            src="/logofixifly.png" 
            alt="Fixifly Logo" 
            className="h-12"
          />
          <div className="flex gap-4">
            <Button variant="outline" asChild>
              <Link to="/vendor/login">Login</Link>
            </Button>
            <Button asChild>
              <Link to="/vendor/signup">Sign Up</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
          Join Fixifly as a
          <span className="text-blue-600"> Service Provider</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Connect with customers, grow your business, and earn more with India's leading 
          home services platform. Join thousands of skilled professionals already earning with Fixifly.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" asChild>
            <Link to="/vendor/signup">
              Get Started Today
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="/vendor/login">Already a Partner?</Link>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Why Choose Fixifly?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <IconComponent className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">10,000+</div>
              <div className="text-gray-600">Active Service Providers</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">₹50,000+</div>
              <div className="text-gray-600">Average Monthly Earnings</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">4.8★</div>
              <div className="text-gray-600">Average Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">
          Ready to Start Earning?
        </h2>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Join Fixifly today and start connecting with customers who need your expertise. 
          The registration process is quick and easy.
        </p>
        <Button size="lg" asChild>
          <Link to="/vendor/signup">
            Become a Service Provider
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">
            © 2024 Fixifly. All rights reserved. | 
            <Link to="/vendor/terms" className="ml-2 hover:text-white">Terms</Link> | 
            <Link to="/vendor/privacy" className="ml-2 hover:text-white">Privacy</Link>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default VendorLanding;
