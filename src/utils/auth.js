// Authentication utility functions

export const getToken = () => localStorage.getItem('access_token');

export const setToken = (token) => {
  if (token) {
    localStorage.setItem('access_token', token);
  } else {
    localStorage.removeItem('access_token');
  }
};

export const clearToken = () => {
  localStorage.removeItem('access_token');
};

export const isAuthenticated = () => !!getToken(); 