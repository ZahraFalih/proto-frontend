import React, { useEffect } from 'react';
import DashboardHeaderPanel from '../components/dashboard/DashboardHeaderPanel';

export default function Dashboard() {
  useEffect(() => {
    const tabs     = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.tab-content');
    tabs.forEach(tab =>
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        tabs.forEach(t => t.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(target).classList.add('active');
      })
    );
  }, []);

  return (
    <>
      <DashboardHeaderPanel />
      <main className="dashboard-body">
        <div className="tabs-container">
          <button className="tab active" data-tab="example1">Example 1</button>
          <button className="tab"        data-tab="example2">Example 2</button>
          <button className="tab"        data-tab="example3">Example 3</button>
        </div>
        <div id="content-placeholder">
          <div id="example1" className="tab-content active">
            Content for Example 1
          </div>
          <div id="example2" className="tab-content">
            Content for Example 2
          </div>
          <div id="example3" className="tab-content">
            Content for Example 3
          </div>
        </div>
      </main>
    </>
  );
}
