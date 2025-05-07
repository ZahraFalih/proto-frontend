import React from 'react';
import '../../styles/Skeleton.css';

export function MetricsCardSkeleton() {
  return (
    <div className="skeleton-metrics-card">
      <div className="skeleton skeleton-metrics-header" />
      <div className="skeleton skeleton-metrics-gauge" />
      <div className="skeleton-metrics-values">
        <div className="skeleton skeleton-metrics-value" />
        <div className="skeleton skeleton-metrics-value" />
        <div className="skeleton skeleton-metrics-value" />
      </div>
    </div>
  );
}

export function UBASkeleton() {
  return (
    <div>
      <div className="skeleton skeleton-uba-formulation" />
      <div className="skeleton-uba-resources">
        {[1, 2, 3].map(i => (
          <div key={i} className="skeleton skeleton-uba-resource" />
        ))}
      </div>
    </div>
  );
}

export function UISkeleton() {
  return (
    <div>
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="skeleton skeleton-ui-category" />
      ))}
    </div>
  );
}

export function NavBarSkeleton() {
  return (
    <div className="tabs-container tabs-wrapper">
      {[1, 2, 3].map(i => (
        <div key={i} className="skeleton skeleton-tab" />
      ))}
    </div>
  );
} 