
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

interface ServiceRequestProcessorProps {
  serviceRequestId: string;
  onBack: () => void;
}

const ServiceRequestProcessor: React.FC<ServiceRequestProcessorProps> = ({ serviceRequestId, onBack }) => {
  const { token } = useAuth();
  const [serviceRequest, setServiceRequest] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listings, setListings] = useState<any[]>([]);

  useEffect(() => {
    const fetchServiceRequest = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`/api/service-requests/${serviceRequestId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setServiceRequest(response.data.serviceRequest);
      } catch (err: any) {
        const errorMessage = err?.response?.data?.error || err?.message || 'Failed to fetch service request.';
        setError(errorMessage);
      }
      setIsLoading(false);
    };

    if (token) {
      fetchServiceRequest();
    }
  }, [token, serviceRequestId]);

  const handleGenerateListings = async () => {
    if (!serviceRequest) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      serviceRequest.images.forEach((image: any) => {
        const byteCharacters = atob(image.data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: image.mimeType });
        formData.append('images', blob, image.originalName);
      });

      const response = await axios.post('/api/analyzeImages', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      setListings(response.data.data);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || err?.message || 'Failed to generate listings.';
      setError(errorMessage);
    }
    setIsLoading(false);
  };

  const handleListingChange = (index: number, field: string, value: any) => {
    const newListings = [...listings];
    newListings[index][field] = value;
    setListings(newListings);
  };

const handlePublish = async () => {
    for (const listing of listings) {
      if (!listing.seoTitle || !listing.suggestedPrice) {
        setError('All listings must have a title and a price.');
        return;
      }
    }

    setIsLoading(true);
    try {
      for (const marketplace of serviceRequest.serviceDetails.marketplaces) {
        if (marketplace === 'ebay') {
          await axios.post('/api/bulkUploadEbay', { listings }, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } else if (marketplace === 'facebook') {
          // TODO: Implement Facebook publishing
          await axios.post('/api/facebookMarketplaceWorkflow', { action: 'bulkCreate', data: { productAnalyses: listings, imageUrlsArray: [] } }, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } else if (marketplace === 'featured') {
          for (const listing of listings) {
            await axios.post('/api/featured-items', listing, {
              headers: { Authorization: `Bearer ${token}` }
            });
          }
        } else {
          throw new Error(`Marketplace ${marketplace} not supported yet.`);
        }
      }
      alert('Listings published successfully!');
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || err?.message || 'Failed to publish listings.';
      setError(errorMessage);
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!serviceRequest) {
    return <div>Service request not found.</div>;
  }

  return (
    <div className="service-request-processor">
      <button onClick={onBack}>← Back to List</button>
      <h2>Process Service Request: {serviceRequest.id}</h2>
      <div>
        <h3>Service Details</h3>
        <p><strong>User:</strong> {serviceRequest.userId}</p>
        <p><strong>Status:</strong> {serviceRequest.status}</p>
        <p><strong>Items:</strong> {serviceRequest.serviceDetails.itemCount}</p>
        <p><strong>Marketplaces:</strong> {serviceRequest.serviceDetails.marketplaces.join(', ')}</p>
      </div>
      <div>
        <h3>Images</h3>
        <div className="image-gallery">
          {serviceRequest.images.map((image: any) => (
            <img key={image.id} src={`data:${image.mimeType};base64,${image.data}`} alt={image.originalName} />
          ))}
        </div>
      </div>

      <button onClick={handleGenerateListings} disabled={isLoading || listings.length > 0}>
        {isLoading ? 'Generating...' : 'Generate Listings'}
      </button>

      {listings.length > 0 && (
        <div>
          <h3>Generated Listings</h3>
          {listings.map((listing, index) => (
            <div key={index} className="listing-editor">
              <input value={listing.seoTitle} onChange={e => handleListingChange(index, 'seoTitle', e.target.value)} />
              <textarea value={listing.keyFeatures} onChange={e => handleListingChange(index, 'keyFeatures', e.target.value)} />
              <input value={listing.suggestedPrice} onChange={e => handleListingChange(index, 'suggestedPrice', e.target.value)} />
            </div>
          ))}
          <button onClick={handlePublish} disabled={isLoading}>
            {isLoading ? 'Publishing...' : 'Publish Listings'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ServiceRequestProcessor;
