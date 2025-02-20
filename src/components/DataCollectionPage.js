// src/components/DataCollectionPage.js

import React, { useState } from 'react';

const DataCollectionPage = () => {
  const [needInfo, setNeedInfo] = useState('');
  const [csvFile, setCsvFile] = useState(null);

  // Handle CSV file upload
  const handleFileUpload = (e) => {
    setCsvFile(e.target.files[0]);
  };

  // Handle form submission (for now, just log the input values)
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Business Need Information:", needInfo);
    console.log("CSV File:", csvFile);
    // Add additional logic to process or send the data here
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-2xl bg-white p-8 rounded shadow">
        <h1 className="text-3xl font-bold mb-6 text-center">Data Collection</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Text Area for Business Needs and Information */}
          <div>
            <label htmlFor="needInfo" className="block text-gray-700 text-sm font-semibold mb-1">
              Business Needs & Information
            </label>
            <textarea
              id="needInfo"
              placeholder="Enter your business needs and any information about your business"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
              value={needInfo}
              onChange={(e) => setNeedInfo(e.target.value)}
            ></textarea>
          </div>

          {/* CSV File Upload */}
          <div>
            <label htmlFor="csvFile" className="block text-gray-700 text-sm font-semibold mb-1">
              Upload CSV File
            </label>
            <input
              id="csvFile"
              type="file"
              accept=".csv"
              className="w-full"
              onChange={handleFileUpload}
            />
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Submit Data
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DataCollectionPage;
