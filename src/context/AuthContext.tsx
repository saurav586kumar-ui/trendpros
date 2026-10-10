import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../config/firebase';
import { UserProfile } from '../types';

// Configured owner/admin email
export const OWNER_EMAIL = 'saurav586kumar@gmail.com';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin =
    Boolean(currentUser?.email && currentUser.email.toLowerCase() === OWNER_EMAIL.toLowerCase()) ||
    userProfile?.role === 'admin';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        try {
          const docSnap = await getDoc(userDocRef);
          const custId = 'CUST-' + user.uid.slice(-6).toUpperCase();
          const isUserAdmin = Boolean(user.email && user.email.toLowerCase() === OWNER_EMAIL.toLowerCase());
          if (isUserAdmin) {
            try {
              await setDoc(
                doc(db, 'admins', user.uid),
                {
                  uid: user.uid,
                  email: user.email,
                  role: 'admin',
                  updatedAt: new Date().toISOString(),
                },
                { merge: true }
              );
            } catch (e) {
              console.warn('Admin doc sync notice:', e);
            }
          }

          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            const updates: Partial<UserProfile> = {};
            if (!data.customerId) {
              data.customerId = custId;
              updates.customerId = custId;
            }
            if (isUserAdmin && data.role !== 'admin') {
              data.role = 'admin';
              updates.role = 'admin';
            }
            if (Object.keys(updates).length > 0) {
              await updateDoc(userDocRef, updates);
            }
            setUserProfile(data);
          } else {
            // New user registration in Firestore
            const newProfile: UserProfile = {
              id: user.uid,
              customerId: custId,
              email: user.email || '',
              displayName: user.displayName || 'TrendPro Shopper',
              photoURL: user.photoURL || '',
              phone: '',
              role: isUserAdmin ? 'admin' : 'customer',
              walletBalance: 500, // Starter wallet promotional credits for new customer
              createdAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, newProfile);
            setUserProfile(newProfile);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
        }

        // Realtime listener for balance & profile updates
        const unsubProfile = onSnapshot(
          userDocRef,
          (snapshot) => {
            if (snapshot.exists()) {
              setUserProfile(snapshot.data() as UserProfile);
            }
          },
          (error) => {
            handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
          }
        );

        setLoading(false);
        return () => unsubProfile();
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await fbSignOut(auth);
      setUserProfile(null);
      setCurrentUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!currentUser) return;
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      // Disallow self-escalation to admin
      const safeData = { ...data };
      if (currentUser.email?.toLowerCase() !== OWNER_EMAIL.toLowerCase()) {
        delete safeData.role;
      }
      safeData.updatedAt = new Date().toISOString();
      await updateDoc(userDocRef, safeData);
      setUserProfile((prev) => (prev ? { ...prev, ...safeData } : null));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        isAdmin,
        loading,
        signInWithGoogle,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
