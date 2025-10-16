import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useNavigate } from "react-router-dom";
import { useAuth, useAppStore } from "../hooks";
import {
  Users,
  Building2,
  Calendar,
  CreditCard,
  MessageSquare,
  CheckCircle,
  Baby,
  Star,
  ArrowRight,
  Play,
  Check,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Shield,
  Target,
  Award,
  Globe,
  User,
  LogOut,
  Settings,
  ChevronDown,
  Clock,
} from "lucide-react";

interface LandingPageProps {
  onGetStarted?: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { handleLogout } = useAppStore();

  // Helper functions for user display
  const getDisplayName = (user: any) => {
    if (!user) return "User";
    const fullName =
      user.profile?.fullName ||
      `${user.profile?.firstName || ""} ${user.profile?.lastName || ""}`.trim();
    if (fullName && fullName.trim()) return fullName;
    if (user.email && user.email.trim()) return user.email.split("@")[0];
    return "User";
  };

  const generateInitials = (name?: string, email?: string) => {
    if (name && name.trim()) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase();
    } else if (email && email.trim()) {
      return email.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  // No auto-redirect - let users stay on landing page even when logged in

  const handleGetStarted = () => {
    if (isAuthenticated && user) {
      // If logged in, go to appropriate page
      if (user.isOnboarded) {
        navigate("/app");
      } else {
        navigate("/onboarding");
      }
    } else {
      // If not logged in, go to auth
      if (onGetStarted) {
        onGetStarted();
      } else {
        navigate("/auth");
      }
    }
  };
  const features = [
    {
      icon: Users,
      title: "Member Management",
      description:
        "Streamline member registration, profiles, and tracking with advanced member management tools.",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      icon: Building2,
      title: "Club Administration",
      description:
        "Comprehensive club management system for multiple football academies and training centers.",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      icon: Calendar,
      title: "Event Scheduling",
      description:
        "Organize matches, training sessions, and tournaments with intelligent calendar management.",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      icon: CreditCard,
      title: "Billing & Payments",
      description:
        "Automated payment processing, subscription management, and financial reporting.",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      icon: MessageSquare,
      title: "Communication Hub",
      description:
        "Connect coaches, parents, and members with built-in messaging and notification systems.",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      icon: CheckCircle,
      title: "Attendance Tracking",
      description:
        "Monitor participation rates and generate detailed attendance reports for all activities.",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      icon: Baby,
      title: "Parent Portal",
      description:
        "Dedicated parent dashboard to track their child's progress, payments, and communications.",
      color: "text-pink-600",
      bgColor: "bg-pink-50",
    },
    {
      icon: Shield,
      title: "Data Security",
      description:
        "Enterprise-grade security with encryption, backup, and compliance with data protection laws.",
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
  ];

  const pricingPlans = [
    {
      name: "Starter",
      price: "49",
      period: "month",
      description: "Perfect for small clubs and academies",
      features: [
        "Up to 50 members",
        "Basic event scheduling",
        "Member management",
        "Email support",
        "Basic reporting",
      ],
      popular: false,
      color: "border-gray-200",
    },
    {
      name: "Professional",
      price: "99",
      period: "month",
      description: "Ideal for growing football clubs",
      features: [
        "Up to 200 members",
        "Advanced scheduling",
        "Payment processing",
        "Parent portal",
        "Advanced analytics",
        "Priority support",
        "Mobile app access",
      ],
      popular: true,
      color: "border-primary",
    },
    {
      name: "Enterprise",
      price: "199",
      period: "month",
      description: "For large clubs and organizations",
      features: [
        "Unlimited members",
        "Multi-club management",
        "Custom branding",
        "API access",
        "Advanced integrations",
        "24/7 dedicated support",
        "Training & onboarding",
      ],
      popular: false,
      color: "border-gray-200",
    },
  ];

  const testimonials = [
    {
      name: "Marcus Johnson",
      role: "Director, Elite Football Academy",
      content:
        "ClubQore transformed our operations. We've reduced admin time by 70% and improved parent communication significantly.",
      rating: 5,
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    },
    {
      name: "Sarah Williams",
      role: "Coach, Youth Champions FC",
      content:
        "The attendance tracking and parent portal features are game-changers. Parents love staying connected with their child's progress.",
      rating: 5,
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    },
    {
      name: "David Chen",
      role: "Administrator, Metro Soccer Club",
      content:
        "Managing payments and member registrations has never been easier. The automated billing system saves us hours every week.",
      rating: 5,
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    },
  ];

  const stats = [
    { number: "10,000+", label: "Active Members" },
    { number: "500+", label: "Football Clubs" },
    { number: "50,000+", label: "Events Managed" },
    { number: "99.9%", label: "Uptime" },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white/95 backdrop-blur-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold">CQ</span>
              </div>
              <span className="text-xl font-bold text-gray-900">ClubQore</span>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <a
                href="#features"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Features
              </a>
              <a
                href="#pricing"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Pricing
              </a>
              <a
                href="#about"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                About
              </a>
              <a
                href="#contact"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Contact
              </a>
            </div>

            <div className="flex items-center gap-4">
              {isAuthenticated && user ? (
                /* Logged in user section */
                <div className="hidden md:flex items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => navigate("/app")}
                    className="rounded-xl"
                  >
                    Go to Dashboard
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-xl"
                      >
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={user.profile?.avatar} />
                          <AvatarFallback className="bg-primary text-white text-sm">
                            {generateInitials(getDisplayName(user), user.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="hidden lg:block text-left">
                          <p className="text-sm font-medium text-gray-900">
                            {getDisplayName(user)}
                          </p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <div className="px-3 py-2">
                        <p className="text-sm font-medium">
                          {getDisplayName(user)}
                        </p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => navigate("/app")}
                      >
                        <User className="mr-2 h-4 w-4" />
                        Dashboard
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="cursor-pointer text-red-600 focus:text-red-600"
                        onClick={handleLogout}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                /* Not logged in section */
                <div className="hidden md:flex items-center gap-4">
                  <Button
                    variant="ghost"
                    className="rounded-xl"
                    onClick={() => navigate("/auth")}
                  >
                    Sign In
                  </Button>
                  <Button
                    onClick={handleGetStarted}
                    className="rounded-xl gradient-primary text-white hover:opacity-90"
                  >
                    Get Started
                  </Button>
                </div>
              )}

              {/* Mobile version */}
              <div className="md:hidden">
                {isAuthenticated && user ? (
                  /* Logged in user section - Mobile */
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => navigate("/app")}
                      className="rounded-xl text-sm"
                      size="sm"
                    >
                      Dashboard
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-xl"
                        >
                          <Avatar className="w-7 h-7">
                            <AvatarImage src={user.profile?.avatar} />
                            <AvatarFallback className="bg-primary text-white text-xs">
                              {generateInitials(
                                getDisplayName(user),
                                user.email
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <ChevronDown className="h-3 w-3 text-gray-500" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <div className="px-3 py-2">
                          <p className="text-sm font-medium truncate">
                            {getDisplayName(user)}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {user.email}
                          </p>
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={() => navigate("/app")}
                        >
                          <User className="mr-2 h-4 w-4" />
                          Dashboard
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer">
                          <Settings className="mr-2 h-4 w-4" />
                          Settings
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="cursor-pointer text-red-600 focus:text-red-600"
                          onClick={handleLogout}
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Logout
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ) : (
                  /* Not logged in section - Mobile */
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      className="rounded-xl text-sm"
                      onClick={() => navigate("/auth")}
                      size="sm"
                    >
                      Sign In
                    </Button>
                    <Button
                      onClick={handleGetStarted}
                      className="rounded-xl gradient-primary text-white hover:opacity-90 text-sm"
                      size="sm"
                    >
                      Get Started
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge className="bg-primary/10 text-primary border-primary/20 rounded-xl">
                  #1 Football Club Management Platform
                </Badge>
                <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight">
                  Power Your
                  <span className="text-primary"> Football Club</span>
                  <br />
                  with ClubQore
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Complete management solution for football clubs, academies,
                  and training centers. Manage members, schedule events, process
                  payments, and engage with parents - all in one platform.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="rounded-xl gradient-primary text-white hover:opacity-90 px-8 py-4"
                  onClick={handleGetStarted}
                >
                  <Play className="w-5 h-5 mr-2" />
                  Book Free Demo
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-xl border-gray-200 hover:border-gray-300 px-8 py-4"
                >
                  Watch Video Tour
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>

              <div className="flex items-center gap-6 pt-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full border-2 border-white bg-gray-200"
                    ></div>
                  ))}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Trusted by 500+ clubs
                  </p>
                  <p className="text-sm text-gray-500">
                    Join thousands of satisfied customers
                  </p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative z-10">
                <Card className="border-0 shadow-2xl rounded-2xl overflow-hidden">
                  <CardContent className="p-0">
                    <ImageWithFallback
                      src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=600&fit=crop"
                      alt="ClubQore Dashboard"
                      className="w-full h-96 object-cover"
                    />
                  </CardContent>
                </Card>
              </div>
              <div className="absolute top-4 -left-4 w-20 h-20 bg-yellow-400 rounded-2xl opacity-20"></div>
              <div className="absolute bottom-4 -right-4 w-16 h-16 bg-green-400 rounded-2xl opacity-20"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Manage Your Football Club
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our comprehensive platform provides all the tools you need to
              streamline operations, engage with members, and grow your football
              club.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="border-0 shadow-lg rounded-2xl hover:shadow-xl transition-shadow"
              >
                <CardHeader className="pb-4">
                  <div
                    className={`w-12 h-12 ${feature.bgColor} rounded-xl flex items-center justify-center mb-4`}
                  >
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Loved by Football Clubs Worldwide
            </h2>
            <p className="text-xl text-gray-600">
              See what our customers have to say about their experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star
                        key={i}
                        className="w-5 h-5 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 leading-relaxed">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center gap-3">
                    <ImageWithFallback
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-xl object-cover"
                    />
                    <div>
                      <p className="font-medium text-gray-900">
                        {testimonial.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Choose the perfect plan for your football club's needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <Card
                key={index}
                className={`border-2 ${
                  plan.color
                } shadow-lg rounded-2xl relative ${
                  plan.popular ? "scale-105" : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-white rounded-xl px-4 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="pb-6">
                  <CardTitle className="text-xl font-semibold text-gray-900">
                    {plan.name}
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    {plan.description}
                  </CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900">
                      ${plan.price}
                    </span>
                    <span className="text-gray-600">/{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li
                        key={featureIndex}
                        className="flex items-center gap-3"
                      >
                        <Check className="w-5 h-5 text-green-500" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full rounded-xl py-3 ${
                      plan.popular
                        ? "gradient-primary text-white hover:opacity-90"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    variant={plan.popular ? "default" : "outline"}
                    onClick={handleGetStarted}
                  >
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                Built by Football Enthusiasts for Football Clubs
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                We understand the unique challenges football clubs face.
                ClubQore was created by a team of former coaches, club
                administrators, and tech experts who lived these challenges
                firsthand.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <Target className="w-8 h-8 text-primary" />
                  <div>
                    <p className="font-medium text-gray-900">Mission-Driven</p>
                    <p className="text-sm text-gray-600">
                      Empowering clubs to focus on what matters most
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Award className="w-8 h-8 text-primary" />
                  <div>
                    <p className="font-medium text-gray-900">Award-Winning</p>
                    <p className="text-sm text-gray-600">
                      Recognized for innovation in sports tech
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="w-8 h-8 text-primary" />
                  <div>
                    <p className="font-medium text-gray-900">Global Reach</p>
                    <p className="text-sm text-gray-600">
                      Serving clubs across 25+ countries
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-8 h-8 text-primary" />
                  <div>
                    <p className="font-medium text-gray-900">24/7 Support</p>
                    <p className="text-sm text-gray-600">
                      Always here when you need us
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <Card className="border-0 shadow-2xl rounded-2xl overflow-hidden">
                <CardContent className="p-0">
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=600&h=400&fit=crop"
                    alt="Football team celebrating"
                    className="w-full h-80 object-cover"
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Get in Touch
            </h2>
            <p className="text-xl text-gray-600">
              Ready to transform your football club? Let's talk about your
              needs.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <Card className="border-0 shadow-lg rounded-2xl">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Send us a message
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Fill out the form below and we'll get back to you within 24
                  hours.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      First Name
                    </label>
                    <Input className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Last Name
                    </label>
                    <Input className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <Input
                    type="email"
                    className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Club Name
                  </label>
                  <Input className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Message
                  </label>
                  <Textarea
                    rows={4}
                    className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                    placeholder="Tell us about your club and how we can help..."
                  />
                </div>
                <Button className="w-full rounded-xl gradient-primary text-white hover:opacity-90 py-3">
                  Send Message
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6">
                  Contact Information
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                      <Mail className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Email</p>
                      <p className="text-gray-600">hello@clubqore.com</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                      <Phone className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Phone</p>
                      <p className="text-gray-600">+1 (555) 123-4567</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Address</p>
                      <p className="text-gray-600">
                        123 Football Ave, Sports City, SC 12345
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6">
                  Follow Us
                </h3>
                <div className="flex gap-4">
                  {[Facebook, Twitter, Linkedin, Instagram].map(
                    (Icon, index) => (
                      <div
                        key={index}
                        className="w-12 h-12 bg-gray-100 hover:bg-primary hover:text-white rounded-xl flex items-center justify-center cursor-pointer transition-colors"
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold">CQ</span>
                </div>
                <span className="text-lg font-bold">ClubQore</span>
              </div>
              <p className="text-gray-400">
                The complete management solution for football clubs and
                academies worldwide.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Demo
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    API
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Status
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 ClubQore. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
