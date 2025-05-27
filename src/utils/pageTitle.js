// Utility function to set page title
export const setPageTitle = (title) => {
  document.title = `${title} | Proto`;
};

// Default titles for each route
export const PAGE_TITLES = {
  welcome: 'Welcome',
  auth: {
    login: 'Sign In',
    signup: 'Sign Up'
  },
  onboarding: 'Onboarding',
  dashboard: 'Dashboard',
  datacollection: 'Data Collection',
  showFile: 'File View'
}; 