import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Plus, 
  User, 
  Settings, 
  LogOut, 
  Shield, 
  Menu,
  X,
  ChevronDown
} from 'lucide-react';
import { clsx } from 'clsx';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };


  const isActivePath = (path: string) => {
    return location.pathname === path;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const navItems = [
    ...(user ? [{ path: '/create', label: 'Create Post', icon: Plus }] : []),
    ...(isAdmin ? [{ path: '/admin', label: 'Admin', icon: Shield }] : []),
  ];

  return (
    <div className="min-h-screen bg-dot-pattern">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo (text only) */}
            <Link 
              to="/" 
              className="text-xl font-bold text-gray-900 hover:text-primary-700 transition-colors"
            >
              argue.it
            </Link>


            {/* Desktop Navigation (hidden on auth pages) */}
            {isAuthPage ? (
              <div />
            ) : (
            <nav className="hidden md:flex items-center space-x-4">
              {navItems.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  className={clsx(
                    'flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActivePath(path)
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </Link>
              ))}

              {user ? (
                <div ref={dropdownRef} className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100"
                  >
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 font-medium text-sm">
                        {user.displayName?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm text-gray-700 max-w-32 truncate">
                      {user.displayName || user.email}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>
                  
                  {/* Dropdown Menu */}
                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                      <Link
                        to="/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <User className="w-4 h-4" />
                        <span>Profile</span>
                      </Link>
                      
                      <hr className="my-1 border-gray-200" />
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          handleLogout();
                        }}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link
                    to="/login"
                    className="btn-outline text-sm"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-3 py-2 rounded-md text-sm font-medium border-2 border-sky-300 bg-sky-100 text-sky-800 hover:bg-sky-200 transition-colors"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </nav>
            )}

            {/* Mobile menu button (hidden on auth pages) */}
            {!isAuthPage && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Menu (disabled on auth pages) */}
        {!isAuthPage && mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-3 space-y-3">

              {/* Mobile Navigation */}
              <nav className="space-y-1">
                {navItems.map(({ path, label, icon: Icon }) => (
                  <Link
                    key={path}
                    to={path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={clsx(
                      'flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium',
                      isActivePath(path)
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{label}</span>
                  </Link>
                ))}
              </nav>

              {/* Mobile User Section */}
              {user ? (
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center space-x-3 px-3 py-2">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 font-medium">
                        {user.displayName?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.displayName || user.email}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-left text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                  >
                    <User className="w-5 h-5" />
                    <span>Profile</span>
                  </Link>
                  
                  
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-left text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <div className="pt-3 border-t border-gray-200 space-y-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-center py-2 px-4 border border-gray-300 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-center px-4 py-2 rounded-md font-medium border-2 border-sky-300 bg-sky-100 text-sky-800 hover:bg-sky-200 transition-colors"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

    </div>
  );
};

export default Layout;
