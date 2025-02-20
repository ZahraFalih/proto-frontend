// src/components/MyData.js

import React from 'react';

const MyData = () => {
  // Dummy data for demonstration; later, you can replace this with real user data.
  const userData = {
    name: "Jane Doe",
    companyType: "Marketing",
    lastAnalyticsEntry: "2025-02-19",
    analyticsToolsUsed: "Google Analytics, SEMrush",
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <h1 className="text-3xl font-bold mb-8">Your Data</h1>
      <div className="w-full max-w-md space-y-6">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Name</h2>
          <p className="text-gray-700">{userData.name}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Company Type</h2>
          <p className="text-gray-700">{userData.companyType}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Last Analytics Entry</h2>
          <p className="text-gray-700">{userData.lastAnalyticsEntry}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Analytics Tools Used</h2>
          <p className="text-gray-700">{userData.analyticsToolsUsed}</p>
        </div>
      </div>
    </div>
  );
};

export default MyData;
