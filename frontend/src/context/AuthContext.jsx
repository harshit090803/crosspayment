import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [merchantId, setMerchantId] = useState(localStorage.getItem('merchantId') || 'merchant_demo');
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchDemoToken = async () => {
      try {
        if (!token) {
          const res = await axios.post(`${API_URL}/api/auth/demo-login`, { merchantId });
          if (res.data.success) {
            setToken(res.data.token);
            setMerchantId(res.data.merchantId);
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('merchantId', res.data.merchantId);
            // Setup Axios Interceptor
            axios.interceptors.request.use(config => {
              config.headers.Authorization = `Bearer ${res.data.token}`;
              return config;
            });
          }
        } else {
            axios.interceptors.request.use(config => {
                config.headers.Authorization = `Bearer ${token}`;
                return config;
            });
        }
      } catch (err) {
        console.error('Auth failed', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDemoToken();
  }, [token, merchantId, API_URL]);

  const switchMerchant = async (newId) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/demo-login`, { merchantId: newId });
      if (res.data.success) {
        setToken(res.data.token);
        setMerchantId(res.data.merchantId);
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('merchantId', res.data.merchantId);
      }
    } catch (err) {
      console.error('Failed to switch merchant', err);
    }
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ token, merchantId, switchMerchant, loading, API_URL }}>
      {children}
    </AuthContext.Provider>
  );
};
