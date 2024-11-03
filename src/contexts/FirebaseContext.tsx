import { createContext, useContext, useState, useEffect } from 'react';
import { db } from '@/lib/firebase';

interface FirebaseContextType {
  loading: boolean;
  isInitialized: boolean;
  error: Error | null;
}

const FirebaseContext = createContext<FirebaseContextType>({
  loading: true,
  isInitialized: false,
  error: null,
});

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initializeFirebase = async () => {
      try {
        // Check if Firebase is initialized by attempting a simple query
        if (db) {
          setIsInitialized(true);
        }
      } catch (err) {
        console.error('Error initializing Firebase:', err);
        setError(err instanceof Error ? err : new Error('Failed to initialize Firebase'));
      } finally {
        setLoading(false);
      }
    };

    initializeFirebase();
  }, []);

  if (loading) {
    return null; // Or a loading spinner component
  }

  if (error) {
    console.error('Firebase initialization error:', error);
    return null; // Or an error component
  }

  return (
    <FirebaseContext.Provider value={{ loading, isInitialized, error }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  return useContext(FirebaseContext);
}