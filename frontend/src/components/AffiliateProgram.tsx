import React, { useState, useEffect } from 'react';

const AffiliateProgram = () => {
  const [affiliateData, setAffiliateData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/getAffiliateData');
        const data = await response.json();
        setAffiliateData(data);
      } catch (error) {
        console.error('Error fetching affiliate data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!affiliateData) {
    return <div>Error loading affiliate data.</div>;
  }

  const { earnings, statistics } = affiliateData;

  return (
    <div>
      <h2>Affiliate Program</h2>
      <div className="grid">
        <div className="card">
          <h3>Affiliate Dashboard</h3>
          <p>Earnings: ${earnings}</p>
          <p>Referrals: {statistics.referrals}</p>
          <p>Conversion Rate: {statistics.conversionRate * 100}%</p>
        </div>
        <div className="card">
          <h3>Affiliate Registration</h3>
          <p>Register here to become an affiliate!</p>
        </div>
      </div>
    </div>
  );
};

export default AffiliateProgram;
