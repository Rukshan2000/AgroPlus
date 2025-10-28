"use client"

import { Navigation } from '@/components/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Leaf, 
  Users, 
  Award, 
  Heart, 
  Truck, 
  Shield,
  Target,
  Globe,
  Sprout,
  Clock,
  CheckCircle,
  TreePine
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function AboutPage() {
  const values = [
    {
      icon: <Leaf className="h-8 w-8 text-green-600" />,
      title: "Sustainability",
      description: "We're committed to sustainable farming practices that protect our environment for future generations."
    },
    {
      icon: <Heart className="h-8 w-8 text-green-600" />,
      title: "Quality First",
      description: "Every product is carefully selected and inspected to ensure you receive only the finest quality."
    },
    {
      icon: <Users className="h-8 w-8 text-green-600" />,
      title: "Community",
      description: "Supporting local farmers and building stronger communities through sustainable agriculture."
    },
    {
      icon: <Shield className="h-8 w-8 text-green-600" />,
      title: "Trust",
      description: "Transparency in our processes and honest relationships with our customers and partners."
    }
  ]

  const milestones = [
    {
      year: "2015",
      title: "Founded Green Plus Agro",
      description: "Started with a small organic farm and a vision to provide fresh, healthy produce to our community."
    },
    {
      year: "2018",
      title: "Expanded Operations",
      description: "Grew to partner with over 50 local farms and launched our online marketplace."
    },
    {
      year: "2021",
      title: "Sustainability Certification",
      description: "Achieved organic certification and implemented zero-waste packaging initiatives."
    },
    {
      year: "2023",
      title: "Technology Integration",
      description: "Launched our advanced farm management system and mobile app for seamless ordering."
    },
    {
      year: "2025",
      title: "Regional Leader",
      description: "Now serving over 10,000 customers across the region with 200+ partner farms."
    }
  ]

  const team = [
    {
      name: "Sarah Johnson",
      role: "Founder & CEO",
      image: "/placeholder-user.jpg",
      description: "Agricultural engineer with 15+ years in sustainable farming."
    },
    {
      name: "Mike Chen",
      role: "Head of Operations",
      image: "/placeholder-user.jpg",
      description: "Supply chain expert ensuring quality from farm to table."
    },
    {
      name: "Emma Davis",
      role: "Sustainability Director",
      image: "/placeholder-user.jpg",
      description: "Environmental scientist leading our green initiatives."
    },
    {
      name: "David Wilson",
      role: "Technology Lead",
      image: "/placeholder-user.jpg",
      description: "Developing innovative solutions for modern agriculture."
    }
  ]

  const stats = [
    { icon: <Users className="h-6 w-6" />, label: "Happy Customers", value: "10,000+" },
    { icon: <TreePine className="h-6 w-6" />, label: "Partner Farms", value: "200+" },
    { icon: <Globe className="h-6 w-6" />, label: "Cities Served", value: "25+" },
    { icon: <Award className="h-6 w-6" />, label: "Years Experience", value: "10+" }
  ]

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="outline" className="mb-6 border-green-200 text-green-700">
                <Sprout className="h-4 w-4 mr-2" />
                Our Story
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                Growing Fresh, 
                <span className="text-green-600"> Naturally</span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                For over a decade, Green Plus Agro has been connecting communities with the freshest, 
                most sustainable agricultural products. We believe in the power of natural farming 
                and the importance of supporting local growers.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="bg-green-600 hover:bg-green-700">
                  <Link href="/shop">Shop Our Products</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/contact">Get in Touch</Link>
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square bg-green-100 dark:bg-green-900/20 rounded-2xl p-8">
                <Image
                  src="/placeholder.svg"
                  alt="Green Plus Agro Farm"
                  width={400}
                  height={400}
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 border-b">
        <div className="container mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="mx-auto mb-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-full w-fit text-green-600">
                    {stat.icon}
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {stat.value}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Values */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Our Mission & Values
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              We're dedicated to revolutionizing agriculture through sustainable practices, 
              innovative technology, and unwavering commitment to quality.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow border-green-100">
                <CardHeader>
                  <div className="mx-auto mb-4 p-4 bg-green-50 dark:bg-green-950/20 rounded-full w-fit">
                    {value.icon}
                  </div>
                  <CardTitle className="text-xl text-gray-900 dark:text-white">
                    {value.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Journey/Timeline */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900/50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Our Journey
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              From a small organic farm to a leading agricultural technology company, 
              here's how we've grown over the years.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <div key={index} className="flex items-start space-x-6">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                      {milestone.year.slice(-2)}
                    </div>
                  </div>
                  <Card className="flex-1">
                    <CardHeader>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-green-700 border-green-200">
                          {milestone.year}
                        </Badge>
                        <CardTitle className="text-lg">{milestone.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 dark:text-gray-300">
                        {milestone.description}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Meet Our Team
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              The passionate individuals behind Green Plus Agro, working together to bring you 
              the freshest and most sustainable agricultural products.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mx-auto mb-4">
                    <Image
                      src={member.image}
                      alt={member.name}
                      width={120}
                      height={120}
                      className="w-24 h-24 rounded-full object-cover mx-auto"
                    />
                  </div>
                  <CardTitle className="text-xl">{member.name}</CardTitle>
                  <CardDescription className="text-green-600 font-medium">
                    {member.role}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {member.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Sustainability Section */}
      <section className="py-16 px-4 bg-green-50 dark:bg-green-950/20">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="outline" className="mb-6 border-green-200 text-green-700">
                <Leaf className="h-4 w-4 mr-2" />
                Sustainability
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                Committed to a 
                <span className="text-green-600"> Greener Future</span>
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                Our sustainable farming practices not only produce healthier food but also 
                protect the environment, conserve water, and support biodiversity.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-gray-700 dark:text-gray-300">100% Organic Certification</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-gray-700 dark:text-gray-300">Zero-Waste Packaging</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-gray-700 dark:text-gray-300">Carbon Neutral Delivery</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-gray-700 dark:text-gray-300">Water Conservation Systems</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square bg-white dark:bg-gray-800 rounded-2xl p-8">
                <Image
                  src="/placeholder.svg"
                  alt="Sustainable Farming"
                  width={400}
                  height={400}
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Ready to Join Our Community?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Experience the difference that comes from truly fresh, sustainably grown produce. 
            Join thousands of satisfied customers who trust Green Plus Agro for their daily needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-green-600 hover:bg-green-700">
              <Link href="/shop">Start Shopping</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/contact">Contact Us</Link>
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
                <span className="text-xl font-bold">Green Plus Agro</span>
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
                <p>✉️ info@Green Plus Agro.com</p>
                <p>📍 123 Farm Road, Green Valley</p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Green Plus Agro. All rights reserved. Created by Rukshan Tharindu</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
