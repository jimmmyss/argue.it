import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  BarChart3, 
  Users, 
  MessageSquare, 
  Flag, 
  Settings,
  Shield,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const location = useLocation();

  // Fetch admin stats
  const { data: statsData, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => apiService.getAdminStats(),
  });

  const stats = statsData?.stats;

  const navItems = [
    { path: '/admin', label: 'Overview', icon: BarChart3, exact: true },
    { path: '/admin/users', label: 'Users', icon: Users },
    { path: '/admin/posts', label: 'Posts', icon: MessageSquare },
    { path: '/admin/reports', label: 'Reports', icon: Flag },
    { path: '/admin/categories', label: 'Categories', icon: Settings },
  ];

  const isActivePath = (path: string, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading admin dashboard..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <Shield className="w-6 h-6 text-purple-600" />
              <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="text-sm text-gray-500">
              Platform Management
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <nav className="bg-white rounded-lg shadow-md p-4">
              <ul className="space-y-2">
                {navItems.map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActivePath(item.path, item.exact)
                          ? 'bg-purple-100 text-purple-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <Routes>
              <Route path="/" element={<AdminOverview stats={stats} />} />
              <Route path="/users" element={<AdminUsers />} />
              <Route path="/posts" element={<AdminPosts />} />
              <Route path="/reports" element={<AdminReports />} />
              <Route path="/categories" element={<AdminCategories />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
};

// Admin Overview Component
const AdminOverview: React.FC<{ stats: any }> = ({ stats }) => {
  if (!stats) {
    return <LoadingSpinner size="lg" text="Loading statistics..." />;
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totals.users,
      change: `+${stats.recent.newUsers} this week`,
      icon: Users,
      color: 'blue'
    },
    {
      title: 'Total Posts',
      value: stats.totals.posts,
      change: `+${stats.recent.newPosts} this week`,
      icon: MessageSquare,
      color: 'green'
    },
    {
      title: 'Total Votes',
      value: stats.totals.votes,
      change: `+${stats.recent.newVotes} this week`,
      icon: TrendingUp,
      color: 'purple'
    },
    {
      title: 'Pending Reports',
      value: stats.totals.pendingReports,
      change: 'Requires attention',
      icon: AlertTriangle,
      color: 'red'
    }
  ];

  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    red: 'bg-red-500'
  };

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.change}</p>
              </div>
              <div className={`w-12 h-12 rounded-lg ${colorClasses[stat.color as keyof typeof colorClasses]} flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Categories Overview */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.categories.map((category: any) => (
            <div key={category.id} className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900">{category.name}</h4>
              <p className="text-sm text-gray-600">{category.postCount} posts</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/admin/reports" className="btn-primary text-center">
            Review Reports
          </Link>
          <Link to="/admin/users" className="btn-secondary text-center">
            Manage Users
          </Link>
          <Link to="/admin/categories" className="btn-outline text-center">
            Edit Categories
          </Link>
        </div>
      </div>
    </div>
  );
};

// Placeholder components for other admin sections
const AdminUsers: React.FC = () => (
  <div className="bg-white rounded-lg shadow-md p-6">
    <h2 className="text-xl font-semibold text-gray-900 mb-4">User Management</h2>
    <p className="text-gray-600">User management interface coming soon...</p>
  </div>
);

const AdminPosts: React.FC = () => (
  <div className="bg-white rounded-lg shadow-md p-6">
    <h2 className="text-xl font-semibold text-gray-900 mb-4">Post Management</h2>
    <p className="text-gray-600">Post management interface coming soon...</p>
  </div>
);

const AdminReports: React.FC = () => (
  <div className="bg-white rounded-lg shadow-md p-6">
    <h2 className="text-xl font-semibold text-gray-900 mb-4">Reports Management</h2>
    <p className="text-gray-600">Reports management interface coming soon...</p>
  </div>
);

const AdminCategories: React.FC = () => (
  <div className="bg-white rounded-lg shadow-md p-6">
    <h2 className="text-xl font-semibold text-gray-900 mb-4">Category Management</h2>
    <p className="text-gray-600">Category management interface coming soon...</p>
  </div>
);

export default AdminDashboard;
