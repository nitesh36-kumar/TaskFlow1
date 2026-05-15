import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { onSnapshot, doc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { userService, invitationService } from '../services/firebaseService';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      try {
        setUser(user);
        
        if (unsubscribeProfile) {
          unsubscribeProfile();
          unsubscribeProfile = null;
        }

        if (user) {
          // First check if profile exists, if not create it
          try {
            const snap = await userService.getUserProfile(user.uid);
            if (!snap) {
              await userService.createUserProfile(user);
            }
          } catch (profileErr) {
            console.error("Error ensuring user profile:", profileErr);
            // Even if profile creation fails, we should still try to listen to it
            // or at least stop the loading state
          }

          // Listen for real-time updates to the profile
          const profilePath = `users/${user.uid}`;
          unsubscribeProfile = onSnapshot(doc(db, profilePath), (docSnap) => {
            if (docSnap.exists()) {
              const profileData = docSnap.data();
              setProfile(profileData);
            } else {
              setProfile(null);
            }
            setLoading(false);
          }, (error) => {
            console.error("Profile snapshot error:", error);
            setLoading(false);
          });

          // Automatically join projects where invited
          invitationService.checkAndClaimInvitations().catch(console.error);
        } else {
          setProfile(null);
          setLoading(false);
        }
      } catch (err) {
        console.error("Auth state change error:", err);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
