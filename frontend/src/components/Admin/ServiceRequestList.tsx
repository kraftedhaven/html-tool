
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

import ServiceRequestProcessor from './ServiceRequestProcessor';

const ServiceRequestList: React.FC = () => {
  const { token } = useAuth();
  const [serviceRequests, setServiceRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  useEffect(() => {
    const fetchServiceRequests = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get('/api/service-requests/admin', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setServiceRequests(response.data.serviceRequests);
      } catch (err) {
        setError('Failed to fetch service requests.');
      }
      setIsLoading(false);
    };

    if (token && !selectedRequestId) {
      fetchServiceRequests();
    }
  }, [token, selectedRequestId]);

  if (selectedRequestId) {
    return <ServiceRequestProcessor serviceRequestId={selectedRequestId} onBack={() => setSelectedRequestId(null)} />;
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="service-request-list">
      <h2>All Service Requests</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>User ID</th>
            <th>Status</th>
            <th>Items</th>
            <th>Marketplaces</th>
            <th>Total</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {serviceRequests.map(req => (
            <tr key={req.id}>
              <td>{req.id}</td>
              <td>{req.userId}</td>
              <td>{req.status}</td>
              <td>{req.serviceDetails.itemCount}</td>
              <td>{req.serviceDetails.marketplaces.join(', ')}</td>
              <td>${req.serviceDetails.pricing.total}</td>
              <td>{new Date(req.createdAt).toLocaleString()}</td>
              <td>
                <button onClick={() => setSelectedRequestId(req.id)}>Process</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ServiceRequestList;
