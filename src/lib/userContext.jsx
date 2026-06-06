import React, { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
      // Try to load user profile
      const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
      if (profiles.length > 0) {
        setUserProfile(profiles[0]);
      }
    } catch (e) {
      // Not logged in
    } finally {
      setLoading(false);
    }
  }

  const userRole = userProfile?.role || (currentUser?.role === 'admin' ? 'owner' : 'sales');

  return (
    <UserContext.Provider value={{ currentUser, userProfile, userRole, loading, refresh: loadUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}