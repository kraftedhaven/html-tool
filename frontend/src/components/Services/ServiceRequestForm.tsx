
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

const CheckoutForm: React.FC<{ clientSecret: string }> = ({ clientSecret }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!stripe || !elements) {
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      return;
    }

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
      },
    });

    if (error) {
      setError(error.message || 'An unexpected error occurred.');
    } else if (paymentIntent?.status === 'succeeded') {
      setSuccess('Payment successful!');
    } else {
      setError('Payment failed.');
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button type="submit" disabled={!stripe || isLoading}>
        {isLoading ? 'Processing...' : 'Pay'}
      </button>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
    </form>
  );
};

const ServiceRequestForm: React.FC = () => {
  const { token } = useAuth();
  const [itemCount, setItemCount] = useState(1);
  const [complexity, setComplexity] = useState('standard');
  const [marketplaces, setMarketplaces] = useState(['ebay']);
  const [rushOrder, setRushOrder] = useState(false);
  const [additionalServices, setAdditionalServices] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [pricing, setPricing] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prevFiles => [...prevFiles, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleMarketplaceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    if (checked) {
      setMarketplaces(prev => [...prev, value]);
    } else {
      setMarketplaces(prev => prev.filter(m => m !== value));
    }
  };

  const handleAdditionalServiceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    if (checked) {
      setAdditionalServices(prev => [...prev, value]);
    } else {
      setAdditionalServices(prev => prev.filter(s => s !== value));
    }
  };

  const getPricing = async () => {
    try {
      const response = await axios.post('/api/service-requests/calculate-pricing', {
        itemCount,
        complexity,
        marketplaces,
        rushOrder,
        additionalServices
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPricing(response.data.pricing);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || err?.message || 'Failed to calculate pricing.';
      setError(errorMessage);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    const serviceDetails = {
      itemCount,
      complexity,
      marketplaces,
      rushOrder,
      additionalServices
    };
    formData.append('serviceDetails', JSON.stringify(serviceDetails));
    files.forEach(file => {
      formData.append('images', file);
    });

    try {
      const response = await axios.post('/api/service-requests', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      setSuccess('Service request submitted successfully! Please complete payment.');
      setClientSecret(response.data.paymentIntent.clientSecret);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || err?.message || 'Failed to submit service request.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="service-request-form">
      <h2>"Done-For-You" Listing Service</h2>
      {!clientSecret ? (
        <form onSubmit={handleSubmit}>
          <div>
            <label>Number of Items:</label>
            <input type="number" value={itemCount} onChange={e => setItemCount(parseInt(e.target.value))} min="1" />
          </div>
          <div>
            <label>Complexity:</label>
            <select value={complexity} onChange={e => setComplexity(e.target.value)}>
              <option value="simple">Simple</option>
              <option value="standard">Standard</option>
              <option value="complex">Complex</option>
              <option value="premium">Premium</option>
            </select>
          </div>
          <div>
            <label>Marketplaces:</label>
            <label><input type="checkbox" value="ebay" checked={marketplaces.includes('ebay')} onChange={handleMarketplaceChange} /> eBay</label>
            <label><input type="checkbox" value="facebook" checked={marketplaces.includes('facebook')} onChange={handleMarketplaceChange} /> Facebook</label>
            <label><input type="checkbox" value="etsy" checked={marketplaces.includes('etsy')} onChange={handleMarketplaceChange} /> Etsy</label>
            <label><input type="checkbox" value="featured" checked={marketplaces.includes('featured')} onChange={handleMarketplaceChange} /> Feature on Website</label>
          </div>
          <div>
            <label>Additional Services:</label>
            <label><input type="checkbox" value="seo_optimization" checked={additionalServices.includes('seo_optimization')} onChange={handleAdditionalServiceChange} /> SEO Optimization</label>
            <label><input type="checkbox" value="competitor_research" checked={additionalServices.includes('competitor_research')} onChange={handleAdditionalServiceChange} /> Competitor Research</label>
          </div>
          <div>
            <label><input type="checkbox" checked={rushOrder} onChange={e => setRushOrder(e.target.checked)} /> Rush Order (50% surcharge)</label>
          </div>

          <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
            <input {...getInputProps()} />
            <p>Drag 'n' drop some files here, or click to select files</p>
          </div>
          <ul>
            {files.map((file, i) => (
              <li key={i}>{file.name}</li>
            ))}
          </ul>

          <button type="button" onClick={getPricing}>Calculate Price</button>

          {pricing && (
            <div className="pricing-details">
              <h3>Estimated Price:</h3>
              <p>Subtotal: ${pricing.subtotal}</p>
              <p>Tax: ${pricing.tax}</p>
              <p>Total: ${pricing.total}</p>
            </div>
          )}

          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Submitting...' : 'Submit Request'}
          </button>

          {error && <p className="error">{error}</p>}
          {success && <p className="success">{success}</p>}
        </form>
      ) : (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm clientSecret={clientSecret} />
        </Elements>
      )}
    </div>
  );
};

export default ServiceRequestForm;
