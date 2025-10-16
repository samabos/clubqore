import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { 
  CreditCard, 
  DollarSign, 
  Calendar, 
  Download, 
  Plus,
  TrendingUp,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Receipt,
  Building2
} from "lucide-react";

export function ClubBilling() {
  const billingStats = [
    {
      title: "Monthly Revenue",
      value: "$13,890",
      change: "+8.2%",
      changeType: "increase",
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Outstanding Payments",
      value: "$2,340",
      change: "3 members",
      changeType: "warning",
      icon: AlertCircle,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50"
    },
    {
      title: "Active Subscriptions",
      value: "142",
      change: "+12 this month",
      changeType: "increase",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Collection Rate",
      value: "94.2%",
      change: "+2.1%",
      changeType: "increase",
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    }
  ];

  const recentTransactions = [
    {
      id: 1,
      memberName: "John Doe",
      description: "Monthly Membership Fee",
      amount: 89.00,
      date: "2024-01-20",
      status: "completed",
      method: "Credit Card"
    },
    {
      id: 2,
      memberName: "Emma Rodriguez",
      description: "Registration Fee",
      amount: 50.00,
      date: "2024-01-19",
      status: "completed",
      method: "Bank Transfer"
    },
    {
      id: 3,
      memberName: "Michael Chen",
      description: "Equipment Fee",
      amount: 120.00,
      date: "2024-01-18",
      status: "pending",
      method: "Credit Card"
    },
    {
      id: 4,
      memberName: "Sarah Wilson",
      description: "Monthly Membership Fee",
      amount: 89.00,
      date: "2024-01-17",
      status: "failed",
      method: "Credit Card"
    },
    {
      id: 5,
      memberName: "Alex Thompson",
      description: "Training Camp Fee",
      amount: 200.00,
      date: "2024-01-16",
      status: "completed",
      method: "PayPal"
    }
  ];

  const subscriptionPlans = [
    {
      id: 1,
      name: "Basic Membership",
      price: 89,
      frequency: "monthly",
      members: 45,
      description: "Standard training sessions and club access"
    },
    {
      id: 2,
      name: "Premium Membership",
      price: 139,
      frequency: "monthly",
      members: 67,
      description: "All training + personal coaching + nutrition plan"
    },
    {
      id: 3,
      name: "Elite Membership",
      price: 199,
      frequency: "monthly",
      members: 30,
      description: "Elite training + match participation + gear included"
    },
    {
      id: 4,
      name: "Annual Basic",
      price: 950,
      frequency: "yearly",
      members: 12,
      description: "Basic membership with 15% annual discount"
    }
  ];

  const overduePayments = [
    {
      id: 1,
      memberName: "James Wilson",
      amount: 89.00,
      dueDate: "2024-01-15",
      daysOverdue: 5,
      type: "Monthly Fee"
    },
    {
      id: 2,
      memberName: "Sofia Martinez",
      amount: 120.00,
      dueDate: "2024-01-12",
      daysOverdue: 8,
      type: "Equipment Fee"
    },
    {
      id: 3,
      memberName: "David Brown",
      amount: 139.00,
      dueDate: "2024-01-10",
      daysOverdue: 10,
      type: "Premium Fee"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Billing & Payments</h1>
          <p className="text-gray-600">Manage your club's billing and track member payments</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-xl border-gray-200 hover:border-gray-300">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button className="rounded-xl gradient-primary text-white hover:opacity-90">
            <Plus className="w-4 h-4 mr-2" />
            Create Invoice
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {billingStats.map((stat, index) => (
          <Card key={index} className="border-0 shadow-lg rounded-xl hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <span className={`text-sm font-medium ${
                      stat.changeType === 'increase' ? 'text-green-600' : 
                      stat.changeType === 'warning' ? 'text-yellow-600' : 'text-gray-600'
                    }`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 rounded-xl">
          <TabsTrigger value="overview" className="rounded-lg">Overview</TabsTrigger>
          <TabsTrigger value="subscriptions" className="rounded-lg">Subscriptions</TabsTrigger>
          <TabsTrigger value="overdue" className="rounded-lg">Overdue</TabsTrigger>
          <TabsTrigger value="settings" className="rounded-lg">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Transactions */}
            <Card className="border-0 shadow-lg rounded-xl">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">Recent Transactions</CardTitle>
                    <CardDescription className="text-gray-600">Latest payment activities</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" className="rounded-lg">
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentTransactions.slice(0, 5).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        transaction.status === 'completed' ? 'bg-green-50' :
                        transaction.status === 'pending' ? 'bg-yellow-50' : 'bg-red-50'
                      }`}>
                        {transaction.status === 'completed' ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : transaction.status === 'pending' ? (
                          <Clock className="w-5 h-5 text-yellow-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{transaction.memberName}</p>
                        <p className="text-sm text-gray-600">{transaction.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">${transaction.amount.toFixed(2)}</p>
                      <Badge 
                        variant={transaction.status === 'completed' ? 'default' : 
                                transaction.status === 'pending' ? 'secondary' : 'destructive'}
                        className="rounded-lg mt-1"
                      >
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card className="border-0 shadow-lg rounded-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900">Payment Methods</CardTitle>
                <CardDescription className="text-gray-600">Configure accepted payment methods</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">Credit/Debit Cards</p>
                      <p className="text-sm text-gray-600">Visa, Mastercard, Amex</p>
                    </div>
                  </div>
                  <Badge variant="default" className="rounded-lg">Active</Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900">Bank Transfer</p>
                      <p className="text-sm text-gray-600">Direct bank payments</p>
                    </div>
                  </div>
                  <Badge variant="default" className="rounded-lg">Active</Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-8 h-8 text-purple-600" />
                    <div>
                      <p className="font-medium text-gray-900">PayPal</p>
                      <p className="text-sm text-gray-600">Online payments</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="rounded-lg">Inactive</Badge>
                </div>
                
                <Button variant="outline" className="w-full rounded-xl border-gray-200 hover:border-gray-300">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Payment Method
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions" className="space-y-6">
          <Card className="border-0 shadow-lg rounded-xl">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">Subscription Plans</CardTitle>
                  <CardDescription className="text-gray-600">Manage your membership plans and pricing</CardDescription>
                </div>
                <Button className="rounded-xl gradient-primary text-white hover:opacity-90">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Plan
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {subscriptionPlans.map((plan) => (
                  <Card key={plan.id} className="border border-gray-200 rounded-xl">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-gray-900">{plan.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
                          </div>
                          <Button size="sm" variant="ghost" className="rounded-lg">
                            Edit
                          </Button>
                        </div>
                        
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-gray-900">${plan.price}</span>
                          <span className="text-gray-600">/{plan.frequency}</span>
                        </div>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{plan.members} active members</span>
                          </div>
                          <Badge variant="outline" className="rounded-lg">
                            Active
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Overdue Tab */}
        <TabsContent value="overdue" className="space-y-6">
          <Card className="border-0 shadow-lg rounded-xl">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">Overdue Payments</CardTitle>
                  <CardDescription className="text-gray-600">Members with outstanding payments</CardDescription>
                </div>
                <Button variant="outline" className="rounded-xl border-gray-200 hover:border-gray-300">
                  Send Reminders
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {overduePayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-4 border border-red-200 bg-red-50 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{payment.memberName}</h4>
                      <p className="text-sm text-gray-600">{payment.type} • Due: {payment.dueDate}</p>
                      <p className="text-sm text-red-600">{payment.daysOverdue} days overdue</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">${payment.amount.toFixed(2)}</p>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" variant="outline" className="rounded-lg">
                        Contact
                      </Button>
                      <Button size="sm" className="rounded-lg">
                        Send Invoice
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card className="border-0 shadow-lg rounded-xl">
            <CardHeader className="pb-6">
              <CardTitle className="text-xl font-semibold text-gray-900">Billing Settings</CardTitle>
              <CardDescription className="text-gray-600">Configure your billing preferences and automation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">Payment Settings</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="currency" className="text-sm font-medium text-gray-700">Currency</Label>
                    <Select defaultValue="usd">
                      <SelectTrigger className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="usd">USD - US Dollar</SelectItem>
                        <SelectItem value="eur">EUR - Euro</SelectItem>
                        <SelectItem value="gbp">GBP - British Pound</SelectItem>
                        <SelectItem value="cad">CAD - Canadian Dollar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="billingCycle" className="text-sm font-medium text-gray-700">Default Billing Cycle</Label>
                    <Select defaultValue="monthly">
                      <SelectTrigger className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="annually">Annually</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="paymentTerms" className="text-sm font-medium text-gray-700">Payment Terms (Days)</Label>
                    <Input 
                      id="paymentTerms" 
                      type="number" 
                      defaultValue="30"
                      className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lateFee" className="text-sm font-medium text-gray-700">Late Fee (%)</Label>
                    <Input 
                      id="lateFee" 
                      type="number" 
                      defaultValue="5"
                      className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">Automation & Reminders</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="reminderDays" className="text-sm font-medium text-gray-700">Send Reminder (Days Before Due)</Label>
                    <Input 
                      id="reminderDays" 
                      type="number" 
                      defaultValue="7"
                      className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="overdueReminder" className="text-sm font-medium text-gray-700">Overdue Reminder Frequency</Label>
                    <Select defaultValue="weekly">
                      <SelectTrigger className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="autoSuspend" className="text-sm font-medium text-gray-700">Auto-suspend After (Days)</Label>
                    <Input 
                      id="autoSuspend" 
                      type="number" 
                      defaultValue="30"
                      className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="invoicePrefix" className="text-sm font-medium text-gray-700">Invoice Number Prefix</Label>
                    <Input 
                      id="invoicePrefix" 
                      defaultValue="MU-INV-"
                      className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6 border-t border-gray-100">
                <Button className="rounded-xl gradient-primary text-white hover:opacity-90 px-8">
                  Save Settings
                </Button>
                <Button variant="outline" className="rounded-xl border-gray-200 hover:border-gray-300 px-8">
                  Reset to Default
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}