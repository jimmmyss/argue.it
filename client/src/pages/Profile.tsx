import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { User, Mail, Calendar, BarChart3, MessageSquare, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNoScroll } from '../hooks/useNoScroll';

const Profile: React.FC = () => {
  const { user, updateUserProfile, logout } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    displayName: user?.displayName || '',
    avatarURL: user?.avatarURL || ''
  });

  // Disable scrolling on this page
  useNoScroll();

  // Update editData when user data changes
  useEffect(() => {
    if (user) {
      setEditData({
        displayName: user.displayName || '',
        avatarURL: user.avatarURL || ''
      });
    }
  }, [user]);

  // Fetch user profile with stats
  const { data: profileData, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => apiService.getProfile(),
    enabled: !!user,
  });

  const handleSave = async () => {
    try {
      // Filter out empty values and unchanged values
      const updateData: { displayName?: string; avatarURL?: string } = {};
      
      if (editData.displayName && editData.displayName.trim() && editData.displayName !== user?.displayName) {
        updateData.displayName = editData.displayName.trim();
      }
      
      if (editData.avatarURL && editData.avatarURL.trim() && editData.avatarURL !== user?.avatarURL) {
        updateData.avatarURL = editData.avatarURL.trim();
      }
      
      // Only update if there are changes
      if (Object.keys(updateData).length === 0) {
        toast.error('No changes to save');
        setIsEditing(false);
        return;
      }
      
      await updateUserProfile(updateData);
      
      // Invalidate and refetch profile query to get fresh data
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      
      setIsEditing(false);
    } catch (error) {
      // Error handled by auth context
    }
  };

  const handleCancel = () => {
    setEditData({
      displayName: user?.displayName || '',
      avatarURL: user?.avatarURL || ''
    });
    setIsEditing(false);
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    const confirmText = window.prompt('Type "DELETE" to confirm account deletion:');
    if (confirmText !== 'DELETE') {
      toast.error('Account deletion cancelled');
      return;
    }

    try {
      await apiService.deleteAccount();
      await logout();
      toast.success('Account deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete account');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading profile..." />
      </div>
    );
  }

  // Prioritize user from AuthContext (most up-to-date) over profileData
  const profile = user || profileData?.user;

  return (
    <div className="h-screen bg-dot-pattern overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full">
        <div className="post-surface h-full overflow-y-auto">

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Profile Info */}
              <div className="lg:col-span-2">
                <div className="space-y-6">
                  {/* Avatar and basic info */}
                  <div className="flex items-start space-x-4">
                    <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
                      {profile?.avatarURL ? (
                        <img 
                          src={profile.avatarURL} 
                          alt="Avatar" 
                          className="w-20 h-20 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl font-bold text-primary-600">
                          {profile?.displayName?.[0]?.toUpperCase() || profile?.email[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      {isEditing ? (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Display Name
                            </label>
                            <input
                              type="text"
                              value={editData.displayName}
                              onChange={(e) => setEditData(prev => ({ ...prev, displayName: e.target.value }))}
                              className="input"
                              placeholder="Enter your display name"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Avatar URL (Optional)
                            </label>
                            <input
                              type="url"
                              value={editData.avatarURL}
                              onChange={(e) => setEditData(prev => ({ ...prev, avatarURL: e.target.value }))}
                              className="input"
                              placeholder="https://example.com/avatar.jpg"
                            />
                          </div>
                          
                          <div className="flex space-x-2">
                            <button onClick={handleSave} className="btn-primary">
                              Save Changes
                            </button>
                            <button onClick={handleCancel} className="btn-outline">
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-xl font-semibold text-gray-900">
                              {profile?.displayName || 'Anonymous User'}
                            </h2>
                            <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                              profile?.role === 'admin'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-sky-100 text-sky-800'
                            }`}>
                              {profile?.role === 'admin' ? 'Administrator' : 'User'}
                            </span>
                          </div>
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center text-sm text-gray-600">
                              <Mail className="w-4 h-4 mr-2" />
                              {profile?.email}
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <Calendar className="w-4 h-4 mr-2" />
                              Joined {new Date(profile?.createdAt || '').toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Account Status */}
                  {profile?.isBanned && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-red-600 font-bold">!</span>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-red-800">Account Suspended</h3>
                          <p className="text-sm text-red-600">Your account has been suspended. Contact support for more information.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Stats</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <MessageSquare className="w-5 h-5 text-gray-600 mr-2" />
                        <span className="text-sm font-medium text-gray-700">Posts Created</span>
                      </div>
                      <span className="text-lg font-bold text-gray-900">
                        {profile?.postCount || 0}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <BarChart3 className="w-5 h-5 text-gray-600 mr-2" />
                        <span className="text-sm font-medium text-gray-700">Votes Cast</span>
                      </div>
                      <span className="text-lg font-bold text-gray-900">
                        {profile?.voteCount || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Account Management */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Management</h3>
                  <div className="space-y-2">
                    {!isEditing && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="btn-outline w-full"
                      >
                        <Settings className="w-4 h-4 mr-2 inline" />
                        Edit Profile
                      </button>
                    )}
                    <button
                      onClick={handleDeleteAccount}
                      className="w-full px-4 py-2 rounded-lg font-medium border-2 border-red-700 text-red-700 hover:bg-red-50 transition-colors"
                    >
                      Delete Account
                    </button>
                    {profile?.role === 'admin' && (
                      <a href="/admin" className="block w-full btn-secondary text-center">
                        Admin Dashboard
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
