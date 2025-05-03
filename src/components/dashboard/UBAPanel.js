// components/dashboard/UBAPanel.js
import React, { useState } from 'react';
import Plot from 'react-plotly.js';
import '../../styles/UBAPanel.css';

export default function UBAPanel() {
  const [currentChart, setCurrentChart] = useState(0);
  
  // Define chart data
  const charts = [
    {
      title: 'Video Plays Across Sessions',
      data: [
        {
          type: 'bar',
          x: ['sess1', 'sess2', 'sess3', 'sess4', 'sess5', 'sess6'],
          y: [2, 1, 0, 0, 3, 1],
          name: 'Video Plays',
          marker: { color: '#0756A4' },
        },
      ],
      layout: {
        title: 'Video Plays Across Sessions',
        xaxis: { title: 'Session ID' },
        yaxis: { title: 'Number of Video Plays' },
        margin: { t: 40, r: 20, l: 50, b: 50 },
      }
    },
    {
      title: 'Clicks Over Sessions',
      data: [
        {
          type: 'scatter',
          mode: 'lines+markers',
          x: ['sess1', 'sess2', 'sess3', 'sess4', 'sess5', 'sess6'],
          y: [5, 3, 6, 2, 4, 7],
          name: 'Clicks per Session',
          marker: { color: '#2279D0' },
          line: { color: '#0756A4' },
        },
      ],
      layout: {
        title: 'Clicks Over Sessions',
        xaxis: { title: 'Session ID' },
        yaxis: { title: 'Click Count' },
        margin: { t: 40, r: 20, l: 50, b: 50 },
      }
    },
    {
      title: 'Session Duration',
      data: [
        {
          type: 'bar',
          x: ['sess1', 'sess2', 'sess3', 'sess4', 'sess5', 'sess6'],
          y: [3.2, 4.1, 2.8, 5.4, 3.9, 4.5],
          name: 'Minutes Spent',
          marker: { 
            color: '#0756A4',
            opacity: 0.8,
          },
        },
      ],
      layout: {
        title: 'Session Duration in Minutes',
        xaxis: { title: 'Session ID' },
        yaxis: { title: 'Duration (minutes)' },
        margin: { t: 40, r: 20, l: 50, b: 50 },
      }
    }
  ];

  const nextChart = () => {
    setCurrentChart((currentChart + 1) % charts.length);
  };

  const prevChart = () => {
    setCurrentChart((currentChart - 1 + charts.length) % charts.length);
  };

  return (
    <div className="panel-container">
      <div className="panel-header">User Behaviour Analytics Panel</div>
      <div className="uba-plot-wrapper">
        <div className="uba-info-container">
          <h3 className="uba-info-title">Understanding User Behavior</h3>
          <p className="uba-info-text">
            User Behavior Analytics (UBA) provides valuable insights into how visitors interact with your website, helping you identify patterns, pain points, and opportunities for improvement.
          </p>
          <p className="uba-info-text">
            By analyzing metrics like click patterns, session duration, and video engagement, you can optimize your user experience to increase conversions and customer satisfaction.
          </p>
          <p className="uba-info-text">
            Use these insights to:
            <br />• Identify and address user journey bottlenecks
            <br />• Optimize high-value interaction points
            <br />• Make data-driven UX improvement decisions
          </p>
        </div>

        <div className="uba-charts-container">
          <div className="uba-chart">
            <Plot
              data={charts[currentChart].data}
              layout={{
                ...charts[currentChart].layout,
                autosize: true,
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(0,0,0,0)',
                font: { family: 'Gill Sans, sans-serif' },
              }}
              style={{ width: '100%', height: '100%' }}
              useResizeHandler={true}
              config={{ responsive: true, displayModeBar: false }}
            />
          </div>

          <div className="uba-navigation">
            <button 
              className="uba-nav-button" 
              onClick={prevChart}
              aria-label="Previous chart"
            >
              ←
            </button>
            
            <div className="uba-nav-indicator">
              {charts.map((_, index) => (
                <div 
                  key={index} 
                  className={`uba-nav-dot ${index === currentChart ? 'active' : ''}`}
                  onClick={() => setCurrentChart(index)}
                />
              ))}
            </div>
            
            <button 
              className="uba-nav-button" 
              onClick={nextChart}
              aria-label="Next chart"
            >
              →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
