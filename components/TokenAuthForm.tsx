'use client'

import { useEffect, useState } from 'react';
import { authenticateWithToken } from '@/lib/authActions';

interface TokenAuthFormProps {
  token: string;
  fid: string;
}

export function TokenAuthForm({ token, fid }: TokenAuthFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async () => {
    setLoading(true);
    
    const formData = new FormData();
    formData.append('token', token);
    formData.append('fid', fid);
    
    const result = await authenticateWithToken(formData);
    
    if (result?.error) {
      setError(result.error);
    }
    setLoading(false);
  };

  // Auto-submit on component mount
  useEffect(() => {
    handleSubmit();
  }, []);
  
  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error: {error}
        <button 
          onClick={handleSubmit} 
          className="ml-2 px-3 py-1 bg-blue-500 text-white rounded"
          disabled={loading}
        >
          Retry
        </button>
      </div>
    );
  }
  
  return (
    <div className="p-4">
      <p>Authenticating...</p>
      {loading && <div className="animate-pulse">Please wait...</div>}
    </div>
  );
}