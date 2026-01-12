import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, Users, DollarSign, Activity, TrendingUp } from 'lucide-react';

interface PlatformMetrics {
  totalClubs: number;
  activeClubs: number;
  totalUsers: number;
  totalRevenue: number;
  activeSessions: number;
}

export function SuperAdminDashboard() {
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch platform metrics from API
    // For now, show placeholder
    setMetrics({
      totalClubs: 0,
      activeClubs: 0,
      totalUsers: 0,
      totalRevenue: 0,
      activeSessions: 0,
    });
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: "Total Clubs",
      value: metrics?.totalClubs || 0,
      subtitle: `${metrics?.activeClubs || 0} active`,
      icon: Building2,
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      title: "Total Users",
      value: metrics?.totalUsers || 0,
      subtitle: "Platform users",
      icon: Users,
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
    },
    {
      title: "Total Revenue",
      value: `$${metrics?.totalRevenue || 0}`,
      subtitle: "All time",
      icon: DollarSign,
      bgColor: "bg-orange-50",
      iconColor: "text-orange-600",
    },
    {
      title: "Active Sessions",
      value: metrics?.activeSessions || 0,
      subtitle: "Currently online",
      icon: Activity,
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Overview</h1>
        <p className="text-gray-600">Monitor your platform's performance and metrics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {stats.map((stat, index) => (
          <Card
            key={index}
            className="border-0 shadow-lg rounded-xl hover:shadow-xl transition-shadow"
          >
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {stat.title}
                  </p>
                  <p className="text-xl lg:text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                  <span className="text-sm text-gray-500">
                    {stat.subtitle}
                  </span>
                </div>
                <div className={`w-10 h-10 lg:w-12 lg:h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 lg:w-6 lg:h-6 ${stat.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Placeholder for future widgets */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <p className="text-gray-500">Activity feed coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}
