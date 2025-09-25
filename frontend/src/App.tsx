import { useState, useCallback } from 'react'
import './App.css'
import { config } from './config/environment'

interface ProductAnalysis {
  seoTitle: string;
  brand: string;
  productType: string;
  size: string;
  color: { primary: string; secondary: string };
  condition: string;
  keyFeatures: string;
  estimatedYear: number | string;
  countryOfManufacture: string;
  material: string;
  fabricType: string;
  theme: string;
  suggestedPrice: number;
  confidence: number;
  categoryId?: string;
  categoryName?: string;
}

interface UploadedFile {
  file: File;
  preview: string;
  status: 'idle' | 'processing' | 'complete' | 'error';
  analysis?: ProductAnalysis;
}

function App() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ProductAnalysis[]>([]);

  const apiBaseUrl = config.apiBaseUrl;

  const handleFileUpload = useCallback((files: FileList) => {
    const newFiles: UploadedFile[] = Array.from(files)
      .filter(file => file.type.startsWith('image/'))
      .map(file => ({
        file,
        preview: URL.createObjectURL(file),
        status: 'idle' as const
      }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
  }, []);

  const analyzeImages = async () => {
    if (uploadedFiles.length === 0 || isProcessing) return;

    setIsProcessing(true);
    
    // Update status to processing
    setUploadedFiles(prev => 
      prev.map(item => ({ ...item, status: 'processing' as const }))
    );

    try {
      const formData = new FormData();
      uploadedFiles.forEach(item => {
        formData.append('images', item.file);
      });

      const response = await fetch(`${apiBaseUrl}/analyzeImages`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        setResults(data.data);
        
        // Update status to complete
        setUploadedFiles(prev => 
          prev.map((item, index) => ({
            ...item,
            status: 'complete' as const,
            analysis: data.data[index]
          }))
        );
      } else {
        throw new Error(data.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      
      // Update status to error
      setUploadedFiles(prev => 
        prev.map(item => ({ ...item, status: 'error' as const }))
      );
      
      alert(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const clearAll = () => {
    uploadedFiles.forEach(item => URL.revokeObjectURL(item.preview));
    setUploadedFiles([]);
    setResults([]);
  };

  const exportCSV = () => {
    if (results.length === 0) return;

    const headers = [
      'Title', 'Brand', 'Product Type', 'Size', 'Color', 'Condition',
      'Key Features', 'Estimated Year', 'Country', 'Material', 'Fabric Type',
      'Theme', 'Suggested Price', 'Confidence', 'Category', 'Category ID'
    ];

    const csvContent = [
      headers.join(','),
      ...results.map(item => [
        `"${item.seoTitle || ''}"`,
        `"${item.brand || ''}"`,
        `"${item.productType || ''}"`,
        `"${item.size || ''}"`,
        `"${typeof item.color === 'object' ? `${item.color.primary}, ${item.color.secondary}` : item.color || ''}"`,
        `"${item.condition || ''}"`,
        `"${item.keyFeatures || ''}"`,
        `"${item.estimatedYear || ''}"`,
        `"${item.countryOfManufacture || ''}"`,
        `"${item.material || ''}"`,
        `"${item.fabricType || ''}"`,
        `"${item.theme || ''}"`,
        `"${item.suggestedPrice || ''}"`,
        `"${item.confidence || ''}"`,
        `"${item.categoryName || ''}"`,
        `"${item.categoryId || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neural-listing-analysis-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="neural-app">
      <div className="grid-bg"></div>
      
      <div className="container">
        <div className="header">
          <h1>Neural Listing Engine</h1>
          <div className="subtitle">Autonomous Product Analysis System</div>
          <p>Advanced neural networks process product imagery to generate comprehensive marketplace data with quantum precision</p>
        </div>
        
        <div 
          className="upload-zone"
          onClick={() => document.getElementById('fileInput')?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.classList.add('dragover');
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove('dragover');
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove('dragover');
            if (e.dataTransfer.files) {
              handleFileUpload(e.dataTransfer.files);
            }
          }}
        >
          <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <div className="upload-text">Initialize Data Upload</div>
          <div className="upload-subtext">Drop image files or click to browse • JPG/PNG • 5-10 units recommended</div>
          <input 
            type="file" 
            id="fileInput" 
            multiple 
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
          />
        </div>

        {uploadedFiles.length > 0 && (
          <div className="neural-grid">
            {uploadedFiles.map((item, index) => (
              <div key={index} className="neural-item">
                <img src={item.preview} alt={item.file.name} />
                <div className="neural-info">
                  <div className="neural-filename">{item.file.name}</div>
                  <span className={`neural-status status-${item.status}`}>
                    {item.status === 'idle' && 'Standby'}
                    {item.status === 'processing' && 'Processing'}
                    {item.status === 'complete' && 'Complete'}
                    {item.status === 'error' && 'Error'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="control-panel">
          <button 
            className="neural-btn btn-secondary" 
            onClick={clearAll}
            disabled={uploadedFiles.length === 0}
          >
            Reset System
          </button>
          <button 
            className="neural-btn btn-primary" 
            onClick={analyzeImages}
            disabled={uploadedFiles.length === 0 || isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Execute Analysis'}
          </button>
          <button 
            className="neural-btn btn-secondary" 
            onClick={exportCSV}
            disabled={results.length === 0}
          >
            Export CSV
          </button>
        </div>
        
        {results.length > 0 && (
          <div className="output-terminal">
            <div className="scan-line"></div>
            
            <div className="terminal-header">
              <h2 className="terminal-title">Analysis Complete</h2>
            </div>
            
            <div className="metrics-grid">
              <div className="metric-node">
                <div className="metric-value">{results.length.toString().padStart(2, '0')}</div>
                <div className="metric-label">Units Processed</div>
              </div>
              <div className="metric-node">
                <div className="metric-value">
                  {Math.round(results.reduce((acc, item) => acc + (item.confidence || 0), 0) / results.length)}%
                </div>
                <div className="metric-label">Avg Confidence</div>
              </div>
              <div className="metric-node">
                <div className="metric-value">
                  ${Math.round(results.reduce((acc, item) => acc + (item.suggestedPrice || 0), 0))}
                </div>
                <div className="metric-label">Total Value</div>
              </div>
            </div>
            
            <div className="data-display">
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #303030' }}>
                      <th style={{ padding: '8px', textAlign: 'left', color: '#606060' }}>Title</th>
                      <th style={{ padding: '8px', textAlign: 'left', color: '#606060' }}>Brand</th>
                      <th style={{ padding: '8px', textAlign: 'left', color: '#606060' }}>Price</th>
                      <th style={{ padding: '8px', textAlign: 'left', color: '#606060' }}>Category</th>
                      <th style={{ padding: '8px', textAlign: 'left', color: '#606060' }}>Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((item, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #1a1a1a' }}>
                        <td style={{ padding: '8px', color: '#a0a0a0' }}>{item.seoTitle}</td>
                        <td style={{ padding: '8px', color: '#a0a0a0' }}>{item.brand}</td>
                        <td style={{ padding: '8px', color: '#a0a0a0' }}>${item.suggestedPrice}</td>
                        <td style={{ padding: '8px', color: '#a0a0a0' }}>{item.categoryName}</td>
                        <td style={{ padding: '8px', color: '#a0a0a0' }}>{item.confidence}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
