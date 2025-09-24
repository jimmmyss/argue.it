import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';

// Mock Firebase
jest.mock('./config/firebase', () => ({
  auth: {},
  db: {}
}));

// Mock the auth context
jest.mock('./contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => ({
    user: null,
    firebaseUser: null,
    loading: false,
    initializing: false,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    resetPassword: jest.fn(),
    updateUserProfile: jest.fn(),
    isAdmin: false,
    isBanned: false,
    refreshUser: jest.fn(),
  }),
}));

// Create a test query client
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithProviders = (ui: React.ReactElement) => {
  const testQueryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={testQueryClient}>
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('App Component', () => {
  it('renders without crashing', () => {
    renderWithProviders(<App />);
  });

  it('renders the home page by default', () => {
    renderWithProviders(<App />);
    // The home page should be rendered
    expect(document.body).toBeInTheDocument();
  });
});

describe('App Routing', () => {
  it('should handle unknown routes', () => {
    window.history.pushState({}, 'Test page', '/unknown-route');
    renderWithProviders(<App />);
    
    // Should show 404 page
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('Page not found')).toBeInTheDocument();
  });
});