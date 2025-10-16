import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { 
  DollarSign, 
  CreditCard, 
  Download, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  TrendingUp,
  FileText,
  Calendar
} from "lucide-react";

export function BillingPayments() {
  const billingStats = [
    {
      title: "Monthly Revenue",
      value: "$24,890",
      change: "+12.5%",
      icon: DollarSign,
      color: "text-green-600"
    },
    {
      title: "Outstanding Invoices",
      value: "$3,240",
      change: "-8.2%",
      icon: AlertCircle,
      color: "text-orange-600"
    },
    {
      title: "Active Subscriptions",
      value: "156",
      change: "+23",
      icon: CreditCard,
      color: "text-blue-600"
    },
    {
      title: "Payment Success Rate",
      value: "98.5%",
      change: "+1.2%",
      icon: CheckCircle,
      color: "text-green-600"
    }
  ];

  const recentTransactions = [
    {
      id: "TXN-001",
      club: "Manchester United Youth",
      amount: 89,
      type: "Monthly Subscription",
      status: "Completed",
      date: "2024-12-20",
      method: "Credit Card"
    },
    {
      id: "TXN-002",
      club: "Chelsea FC Academy",
      amount: 95,
      type: "Monthly Subscription",
      status: "Completed",
      date: "2024-12-20",
      method: "Bank Transfer"
    },
    {
      id: "TXN-003",
      club: "Liverpool FC Youth",
      amount: 85,
      type: "Monthly Subscription",
      status: "Pending",
      date: "2024-12-19",
      method: "Credit Card"
    },
    {
      id: "TXN-004",
      club: "Arsenal Academy",
      amount: 199,
      type: "Premium Upgrade",
      status: "Failed",
      date: "2024-12-18",
      method: "PayPal"
    },
    {
      id: "TXN-005",
      club: "Tottenham Youth",
      amount: 49,
      type: "Basic Plan",
      status: "Completed",
      date: "2024-12-18",
      method: "Credit Card"
    }
  ];

  const subscriptionPlans = [
    {
      name: "Basic",
      price: 49,
      subscribers: 45,
      features: ["Up to 50 members", "Basic analytics", "Email support"],
      color: "bg-blue-50 border-blue-200"
    },
    {
      name: "Standard",
      price: 99,
      subscribers: 78,
      features: ["Up to 150 members", "Advanced analytics", "Priority support", "Mobile app"],
      color: "bg-green-50 border-green-200"
    },
    {
      name: "Premium",
      price: 199,
      subscribers: 24,
      features: ["Unlimited members", "Custom branding", "API access", "24/7 support"],
      color: "bg-purple-50 border-purple-200"
    },
    {
      name: "Enterprise",
      price: 399,
      subscribers: 9,
      features: ["Multi-club management", "White-label solution", "Dedicated account manager"],
      color: "bg-orange-50 border-orange-200"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "text-green-600 bg-green-50";
      case "Pending":
        return "text-orange-600 bg-orange-50";
      case "Failed":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return <CheckCircle className="w-4 h-4" />;
      case "Pending":
        return <Clock className="w-4 h-4" />;
      case "Failed":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {billingStats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                <span className="text-green-600">{stat.change}</span> from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscription Plans</TabsTrigger>
          <TabsTrigger value="invoicing">Invoicing</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest payment transactions from football clubs</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Club</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">{transaction.id}</TableCell>
                      <TableCell>{transaction.club}</TableCell>
                      <TableCell>{transaction.type}</TableCell>
                      <TableCell>${transaction.amount}</TableCell>
                      <TableCell>{transaction.method}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary" 
                          className={`${getStatusColor(transaction.status)} flex items-center gap-1 w-fit`}
                        >
                          {getStatusIcon(transaction.status)}
                          {transaction.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{transaction.date}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline">
                          <Download className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Plan Overview</CardTitle>
              <CardDescription>Current subscription plans and their usage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {subscriptionPlans.map((plan, index) => (
                  <Card key={index} className={`${plan.color}`}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{plan.name}</span>
                        <Badge variant="secondary">{plan.subscribers} clubs</Badge>
                      </CardTitle>
                      <CardDescription>
                        <span className="text-2xl font-bold">${plan.price}</span>
                        <span className="text-muted-foreground">/month</span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Usage</span>
                            <span>{plan.subscribers}/200</span>
                          </div>
                          <Progress value={(plan.subscribers / 200) * 100} className="h-2" />
                        </div>
                        <ul className="space-y-1">
                          {plan.features.map((feature, featureIndex) => (
                            <li key={featureIndex} className="text-sm flex items-center gap-2">
                              <CheckCircle className="w-3 h-3 text-green-600" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoicing" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Invoice Management</CardTitle>
                  <CardDescription>Generate and manage invoices for clubs</CardDescription>
                </div>
                <Button>
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Invoice
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Paid Invoices</p>
                          <p className="text-2xl font-bold">142</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <Clock className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Pending Invoices</p>
                          <p className="text-2xl font-bold">23</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                          <AlertCircle className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Overdue Invoices</p>
                          <p className="text-2xl font-bold">8</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Recent Invoices</h4>
                  {[
                    { id: "INV-2024-001", club: "Manchester United Youth", amount: 89, status: "Paid", dueDate: "2024-12-15" },
                    { id: "INV-2024-002", club: "Chelsea FC Academy", amount: 95, status: "Pending", dueDate: "2024-12-25" },
                    { id: "INV-2024-003", club: "Liverpool FC Youth", amount: 85, status: "Overdue", dueDate: "2024-12-10" },
                  ].map((invoice, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div>
                              <h5 className="font-medium">{invoice.id}</h5>
                              <p className="text-sm text-muted-foreground">{invoice.club}</p>
                            </div>
                          </div>
                          <div className="text-center">
                            <p className="font-medium">${invoice.amount}</p>
                            <p className="text-sm text-muted-foreground">Due: {invoice.dueDate}</p>
                          </div>
                          <Badge 
                            variant="secondary" 
                            className={getStatusColor(invoice.status)}
                          >
                            {invoice.status}
                          </Badge>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Calendar className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}