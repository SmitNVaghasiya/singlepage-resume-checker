import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Search, ArrowLeft } from 'lucide-react';
import '../styles/pages/NotFoundPage.css';

const NotFoundPage: React.FC = () => {
  return (
    <div className="not-found-page">
      <div className="not-found-container">
        <div className="not-found-content">
          <div className="error-code">404</div>
          <h1 className="error-title">Page Not Found</h1>
          <p className="error-description">
            Sorry, we couldn't find the page you're looking for. The URL might be incorrect or the page may have been moved.
          </p>
        </div>

        <div className="not-found-actions">
          <Link to="/" className="btn-primary">
            <Home className="btn-icon" />
            <span>Go to Homepage</span>
          </Link>
          
          <Link to="/dashboard" className="btn-secondary">
            <Search className="btn-icon" />
            <span>View Dashboard</span>
          </Link>
        </div>

        <div className="not-found-help">
          <p>Need help? <Link to="/contact" className="help-link">Contact us</Link></p>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage; 