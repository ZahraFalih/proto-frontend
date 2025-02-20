// src/components/OnboardingPage.js

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
const OnboardingPage = () => {
  // State variables for each input field
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [businessObjectives, setBusinessObjectives] = useState('');
  const [kpis, setKpis] = useState('');
  const [dataSources, setDataSources] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [userRole, setUserRole] = useState('');

  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/datacollection');
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-2xl bg-white p-8 rounded shadow">
        <h1 className="text-3xl font-bold mb-6 text-center">
          Onboarding
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Company Name */}
          <div>
            <label htmlFor="companyName" className="block text-gray-700 text-sm font-semibold mb-1">
              Company Name
            </label>
            <input
              id="companyName"
              type="text"
              placeholder="Enter your company name"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>

          {/* Industry */}
          <div>
            <label htmlFor="industry" className="block text-gray-700 text-sm font-semibold mb-1">
              Industry
            </label>
            <input
              id="industry"
              type="text"
              placeholder="Enter your industry"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
            />
          </div>

          {/* Company Size / Employee Count */}
          <div>
            <label htmlFor="companySize" className="block text-gray-700 text-sm font-semibold mb-1">
              Company Size / Employee Count
            </label>
            <input
              id="companySize"
              type="text"
              placeholder="Enter company size or employee count"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
              value={companySize}
              onChange={(e) => setCompanySize(e.target.value)}
            />
          </div>

          {/* Primary Business Objectives */}
          <div>
            <label htmlFor="businessObjectives" className="block text-gray-700 text-sm font-semibold mb-1">
              Primary Business Objectives
            </label>
            <textarea
              id="businessObjectives"
              placeholder="Describe your primary business objectives"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
              value={businessObjectives}
              onChange={(e) => setBusinessObjectives(e.target.value)}
            ></textarea>
          </div>

          {/* Key Performance Indicators (KPIs) */}
          <div>
            <label htmlFor="kpis" className="block text-gray-700 text-sm font-semibold mb-1">
              Key Performance Indicators (KPIs)
            </label>
            <textarea
              id="kpis"
              placeholder="Enter your KPIs"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
              value={kpis}
              onChange={(e) => setKpis(e.target.value)}
            ></textarea>
          </div>

          {/* Data Sources / Integration Needs */}
          <div>
            <label htmlFor="dataSources" className="block text-gray-700 text-sm font-semibold mb-1">
              Data Sources / Integration Needs
            </label>
            <textarea
              id="dataSources"
              placeholder="Describe your data sources or integration needs"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
              value={dataSources}
              onChange={(e) => setDataSources(e.target.value)}
            ></textarea>
          </div>

          {/* Contact Information (Name & Email) */}
          <div>
            <label htmlFor="contactInfo" className="block text-gray-700 text-sm font-semibold mb-1">
              Contact Information (Name & Email)
            </label>
            <input
              id="contactInfo"
              type="text"
              placeholder="Enter your name and email"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
            />
          </div>

          {/* User Role / Job */}
          <div>
            <label htmlFor="userRole" className="block text-gray-700 text-sm font-semibold mb-1">
              User Role / Job
            </label>
            <input
              id="userRole"
              type="text"
              placeholder="Enter your job title or role"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
              value={userRole}
              onChange={(e) => setUserRole(e.target.value)}
            />
          </div>

          <div>
            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OnboardingPage;
