"use client"

import { useState } from 'react'
import { Navigation } from '@/components/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Leaf, 
  MessageSquare, 
  Send,
  CheckCircle,
  Users,
  Truck,
  Award
} from 'lucide-react'
import Link from 'next/link'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    inquiryType: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000))

    toast({
      title: "Message sent successfully!",
      description: "We'll get back to you within 24 hours.",
    })

    // Reset form
    setFormData({
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: '',
      inquiryType: ''
    })
    setIsSubmitting(false)
  }

  const contactMethods = [
    {
      icon: <Phone className="h-6 w-6 text-green-600" />,
      title: "Phone",
      details: ["+1 (555) 123-4567", "+1 (555) 123-4568"],
      description: "Mon-Fri 8AM-6PM EST"
    },
    {
      icon: <Mail className="h-6 w-6 text-green-600" />,
      title: "Email",
      details: ["info@agroplus.com", "support@agroplus.com"],
      description: "We reply within 24 hours"
    },
    {
      icon: <MapPin className="h-6 w-6 text-green-600" />,
      title: "Address",
      details: ["123 Farm Road", "Green Valley, CA 90210"],
      description: "Visit our farm store"
    },
    {
      icon: <Clock className="h-6 w-6 text-green-600" />,
      title: "Hours",
      details: ["Mon-Fri: 8AM-6PM", "Sat-Sun: 9AM-5PM"],
      description: "Farm store & office hours"
    }
  ]

  const features = [
    {
      icon: <Users className="h-8 w-8 text-green-600" />,
      title: "Expert Team",
      description: "Our agricultural experts are here to help with any questions about our products."
    },
    {
      icon: <Truck className="h-8 w-8 text-green-600" />,
      title: "Delivery Support",
      description: "Get assistance with orders, delivery scheduling, and special requests."
    },
    {
      icon: <Award className="h-8 w-8 text-green-600" />,
      title: "Quality Guarantee",
      description: "We stand behind our products with a 100% satisfaction guarantee."
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Header Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20">
        <div className="container mx-auto text-center">
          <Badge variant="outline" className="mb-6 border-green-200 text-green-700">
            <MessageSquare className="h-4 w-4 mr-2" />
            Get in Touch
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Contact AgroPlus
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Have questions about our products, need help with an order, or want to learn more about our farming practices? 
            We're here to help!
          </p>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {contactMethods.map((method, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mx-auto mb-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-full w-fit">
                    {method.icon}
                  </div>
                  <CardTitle className="text-lg">{method.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 mb-2">
                    {method.details.map((detail, i) => (
                      <p key={i} className="font-medium text-gray-900 dark:text-white">
                        {detail}
                      </p>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {method.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form & Features */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900/50">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Send Us a Message</CardTitle>
                <CardDescription>
                  Fill out the form below and we'll get back to you as soon as possible.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Your full name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="your@email.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="inquiryType">Inquiry Type</Label>
                      <Select onValueChange={(value) => handleSelectChange('inquiryType', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select inquiry type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General Inquiry</SelectItem>
                          <SelectItem value="products">Product Information</SelectItem>
                          <SelectItem value="orders">Order Support</SelectItem>
                          <SelectItem value="delivery">Delivery Questions</SelectItem>
                          <SelectItem value="wholesale">Wholesale Inquiry</SelectItem>
                          <SelectItem value="partnership">Partnership</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="Brief subject of your message"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Tell us more about your inquiry..."
                      className="min-h-[120px]"
                      required
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending...
                      </div>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Features & Additional Info */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Why Contact Us?
                </h2>
                <div className="space-y-6">
                  {features.map((feature, index) => (
                    <div key={index} className="flex space-x-4">
                      <div className="flex-shrink-0 p-2 bg-green-50 dark:bg-green-950/20 rounded-lg">
                        {feature.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                          {feature.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Card className="bg-green-50 dark:bg-green-950/20 border-green-200">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <CardTitle className="text-green-800 dark:text-green-200">
                      Quick Response Guarantee
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-green-700 dark:text-green-300">
                    We pride ourselves on excellent customer service. All inquiries are answered within 24 hours, 
                    and urgent matters are handled within 4 hours during business days.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Farm Visit Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Interested in seeing where your food comes from? We offer guided farm tours every Saturday at 10 AM.
                  </p>
                  <Button asChild variant="outline">
                    <Link href="/shop">
                      Schedule a Visit
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Map or Additional CTA Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Ready to Experience Fresh?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Don't wait! Browse our fresh products and place your order today for farm-to-table freshness.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-green-600 hover:bg-green-700">
              <Link href="/shop">Shop Now</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Leaf className="h-8 w-8 text-green-400" />
                <span className="text-xl font-bold">AgroPlus</span>
              </div>
              <p className="text-gray-400">
                Your trusted partner for fresh, organic agricultural products.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link href="/" className="text-gray-400 hover:text-white">Home</Link></li>
                <li><Link href="/about" className="text-gray-400 hover:text-white">About</Link></li>
                <li><Link href="/shop" className="text-gray-400 hover:text-white">Shop</Link></li>
                <li><Link href="/contact" className="text-gray-400 hover:text-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Categories</h3>
              <ul className="space-y-2">
                <li><span className="text-gray-400">Fresh Vegetables</span></li>
                <li><span className="text-gray-400">Organic Fruits</span></li>
                <li><span className="text-gray-400">Herbs & Spices</span></li>
                <li><span className="text-gray-400">Dairy Products</span></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Contact Info</h3>
              <div className="space-y-2 text-gray-400">
                <p>📞 +1 (555) 123-4567</p>
                <p>✉️ info@agroplus.com</p>
                <p>📍 123 Farm Road, Green Valley</p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 AgroPlus. All rights reserved. Created by Rukshan Tharindu</p>
          </div>
        </div>
      </footer>

      <Toaster />
    </div>
  )
}
