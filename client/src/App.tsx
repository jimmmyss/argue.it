import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import AuthProvider from './contexts/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import CreatePost from './pages/CreatePost';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
          <Router>
          <div className="App">
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#22c55e',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 5000,
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
            
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Routes with layout */}
              <Route path="/*" element={
                <Layout>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    
                    {/* Protected routes */}
                    <Route path="/create" element={
                      <ProtectedRoute>
                        <CreatePost />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/profile" element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    } />
                    
                    {/* Admin routes */}
                    <Route path="/admin/*" element={
                      <ProtectedRoute requireAdmin>
                        <AdminDashboard />
                      </ProtectedRoute>
                    } />
                    
                    {/* 404 page */}
                    <Route path="*" element={
                      <div className="min-h-screen flex items-center justify-center bg-gray-50">
                        <div className="text-center">
                          <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                          <p className="text-gray-600 mb-8">Page not found</p>
                          <a href="/" className="btn-primary">
                            Go Home
                          </a>
                        </div>
                      </div>
                    } />
                  </Routes>
                </Layout>
              } />
            </Routes>
          </div>
          </Router>
        </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
