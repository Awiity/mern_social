// Backend For Frontend (BFF)

const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      // Clear frontend storage
      accessToken = null;
      sessionStorage.removeItem('refreshToken');
      
      // Redirect to login
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };