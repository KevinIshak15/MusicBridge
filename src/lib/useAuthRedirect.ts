'use client';

import { useEffect, useState } from 'react';
// Remove useRouter import
// import { useRouter } from 'next/navigation';
import { auth } from './firebase';
import { User } from 'firebase/auth';

export function useAuthRedirect() {
  // Remove useRouter hook call
  // const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, loading };
}
