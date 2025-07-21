import * as React from 'react';

export function useUserData(userId: number) {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  const fetchUser = async function() {
    try {
      const response = await fetch(`/api/user/${userId}`);
      const data = await response.json();
      setUser(data);
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchUser();
  }, [userId]);

  return { user, loading, refetchUser: fetchUser };
}
