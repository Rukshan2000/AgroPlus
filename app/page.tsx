import Link from 'next/link'
import { Navigation } from '@/components/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Leaf, ShoppingCart, Users, Truck, Star, ArrowRight, Award, Shield } from 'lucide-react'

export default function HomePage() {
  const features = [
    {
      icon: <ShoppingCart className="h-8 w-8 text-emerald-600" />,
      title: "Farm Fresh Products",
      description: "Direct from farm to your table with the freshest organic produce available daily."
    },
    {
      icon: <Truck className="h-8 w-8 text-emerald-600" />,
      title: "Same Day Delivery",
      description: "Quick and reliable delivery service to get your products to you fresh and fast."
    },
    {
      icon: <Users className="h-8 w-8 text-emerald-600" />,
      title: "Expert Guidance",
      description: "Our agricultural experts are here to help you choose the best products for your needs."
    },
    {
      icon: <Leaf className="h-8 w-8 text-emerald-600" />,
      title: "100% Organic",
      description: "All our products are certified organic and sustainably grown with zero pesticides."
    }
  ]

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Home Chef & Food Blogger",
      content: "Green Plus Agro has completely transformed how I cook. The quality of their organic vegetables is absolutely unmatched!",
      rating: 5,
      location: "San Francisco, CA"
    },
    {
      name: "Mike Chen",
      role: "Restaurant Owner",
      content: "Reliable supply and exceptional quality every single time. Green Plus Agro is our go-to supplier for fresh ingredients.",
      rating: 5,
      location: "Seattle, WA"
    },
    {
      name: "Emma Wilson",
      role: "Health & Wellness Coach",
      content: "I love knowing exactly where my food comes from. The traceability and quality are truly amazing.",
      rating: 5,
      location: "Portland, OR"
    }
  ]

  const stats = [
    { number: "10,000+", label: "Happy Customers" },
    { number: "500+", label: "Partner Farms" },
    { number: "50+", label: "Product Varieties" },
    { number: "99%", label: "Customer Satisfaction" }
  ]

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative py-24 px-4 bg-green-50 dark:bg-slate-900">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="outline" className="mb-8 border-green-300 text-green-700 bg-white/80 px-4 py-2 text-sm font-medium">
              <Leaf className="mr-2 h-4 w-4" />
              Farm Fresh • Organic • Sustainable
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 dark:text-white mb-8 leading-tight">
              Fresh Organic Products
              <span className="block text-emerald-600 mt-2">Direct From Farm</span>
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Discover the finest selection of organic fruits, vegetables, and agricultural products. 
              Sourced directly from certified organic farms and delivered fresh to your doorstep with care.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
              <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300">
                <Link href="/shop">
                  Shop Now <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 px-8 py-4 text-lg font-semibold rounded-full">
                <Link href="/contact">Learn More</Link>
              </Button>
            </div>
            
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-emerald-600 mb-2">{stat.number}</div>
                  <div className="text-slate-600 dark:text-slate-300 text-sm font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 bg-white dark:bg-slate-800">
        <div className="container mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
              Why Choose Green Plus Agro?
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
              We're committed to bringing you the highest quality organic products with exceptional service and care.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-green-25 dark:bg-slate-700 group hover:-translate-y-2">
                <CardHeader className="pb-4">
                  <div className="mx-auto mb-6 p-4 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl w-fit group-hover:bg-emerald-200 transition-colors duration-300">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 px-4 bg-green-25 dark:bg-slate-900">
        <div className="container mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
              What Our Customers Say
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Join thousands of satisfied customers who trust Green Plus Agro for their organic needs.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white dark:bg-slate-800 hover:-translate-y-1">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">{testimonial.name}</CardTitle>
                  <CardDescription className="text-emerald-600 font-medium">{testimonial.role}</CardDescription>
                  <CardDescription className="text-slate-500 text-sm">{testimonial.location}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 dark:text-slate-300 italic leading-relaxed text-lg">
                    "{testimonial.content}"
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-16 px-4 bg-white dark:bg-slate-800 border-t border-green-100">
        <div className="container mx-auto">
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-70">
            <div className="flex items-center space-x-3">
              <Award className="h-8 w-8 text-emerald-600" />
              <span className="text-slate-600 dark:text-slate-300 font-medium">USDA Certified Organic</span>
            </div>
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-emerald-600" />
              <span className="text-slate-600 dark:text-slate-300 font-medium">Non-GMO Project Verified</span>
            </div>
            <div className="flex items-center space-x-3">
              <Leaf className="h-8 w-8 text-emerald-600" />
              <span className="text-slate-600 dark:text-slate-300 font-medium">Sustainable Farming</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-emerald-600">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Ready to Experience Fresh?
            </h2>
            <p className="text-xl mb-12 text-emerald-50 max-w-2xl mx-auto leading-relaxed">
              Join our community of health-conscious customers and taste the difference of truly fresh, organic produce delivered with care.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button asChild size="lg" className="bg-white text-emerald-600 hover:bg-emerald-50 px-8 py-4 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300">
                <Link href="/shop">Browse Products</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-emerald-600 px-8 py-4 text-lg font-semibold rounded-full">
                <Link href="/contact">Contact Us</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-12">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <Leaf className="h-10 w-10 text-emerald-400" />
                <span className="text-2xl font-bold">Green Plus Agro</span>
              </div>
              <p className="text-slate-400 leading-relaxed mb-6">
                Your trusted partner for fresh, organic agricultural products. Committed to quality, sustainability, and your health.
              </p>
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">f</span>
                </div>
                <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">t</span>
                </div>
                <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">i</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-bold mb-6 text-lg">Quick Links</h3>
              <ul className="space-y-3">
                <li><Link href="/" className="text-slate-400 hover:text-emerald-400 transition-colors">Home</Link></li>
                <li><Link href="/about" className="text-slate-400 hover:text-emerald-400 transition-colors">About</Link></li>
                <li><Link href="/shop" className="text-slate-400 hover:text-emerald-400 transition-colors">Shop</Link></li>
                <li><Link href="/contact" className="text-slate-400 hover:text-emerald-400 transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-6 text-lg">Categories</h3>
              <ul className="space-y-3">
                <li><span className="text-slate-400">Fresh Vegetables</span></li>
                <li><span className="text-slate-400">Organic Fruits</span></li>
                <li><span className="text-slate-400">Herbs & Spices</span></li>
                <li><span className="text-slate-400">Dairy Products</span></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-6 text-lg">Contact Info</h3>
              <div className="space-y-4 text-slate-400">
                <div className="flex items-center space-x-3">
                  <span className="text-emerald-400">📞</span>
                  <span>+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-emerald-400">✉️</span>
                  <span>info@Green Plus Agro.com</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-emerald-400">📍</span>
                  <span>123 Farm Road, Green Valley</span>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-12 pt-8 text-center text-slate-400">
            <p>&copy; 2025 Green Plus Agro. All rights reserved. Created by Rukshan Tharindu</p>
          </div>
        </div>
      </footer>
    </div>
  )
}