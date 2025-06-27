import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Mail, Phone, MapPin, Github, Linkedin, Twitter, ExternalLink } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { name: 'Resume Analysis', path: '/' },
      { name: 'Dashboard', path: '/dashboard' },
      { name: 'Contact', path: '/contact' },
    ],
    company: [
      { name: 'About Us', path: '/about' },
      { name: 'Privacy Policy', path: '/privacy' },
      { name: 'Terms of Service', path: '/terms' },
    ],
    resources: [
      { name: 'Blog', path: '/blog' },
      { name: 'Help Center', path: '/help' },
      { name: 'Career Tips', path: '/tips' },
    ]
  };

  const socialLinks = [
    { icon: Github, href: 'https://github.com', label: 'GitHub' },
    { icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
    { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
  ];

  return (
    <footer className="footer">
      <div className="container footer-container">
        {/* Main Footer Content */}
        <div className="footer-main">
          {/* Brand Section */}
          <div>
            <Link to="/" className="footer-brand">
              <div className="footer-brand-icon">
                <Briefcase />
              </div>
              <span className="footer-brand-text">AI Resume Checker</span>
            </Link>
            <p className="footer-description">
              Perfect your resume with AI-powered analysis. Get instant feedback, job matching, 
              and actionable improvement suggestions to land your dream job.
            </p>
            <div className="footer-social">
              {socialLinks.map((social, index) => {
                const Icon = social.icon;
                return (
                  <a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="footer-social-link"
                    aria-label={social.label}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="footer-section-title">Product</h3>
            <ul className="footer-links">
              {footerLinks.product.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.path}
                    className="footer-link group"
                  >
                    <span>{link.name}</span>
                    <ExternalLink className="footer-link-icon" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="footer-section-title">Company</h3>
            <ul className="footer-links">
              {footerLinks.company.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.path}
                    className="footer-link group"
                  >
                    <span>{link.name}</span>
                    <ExternalLink className="footer-link-icon" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="footer-section-title">Contact Us</h3>
            <div className="space-y-4">
              <div className="footer-contact-item">
                <Mail className="footer-contact-icon blue" />
                <a href="mailto:support@airesumechecker.com" className="footer-contact-link">
                  support@airesumechecker.com
                </a>
              </div>
              <div className="footer-contact-item">
                <Phone className="footer-contact-icon green" />
                <a href="tel:+1234567890" className="footer-contact-link">
                  +1 (234) 567-8900
                </a>
              </div>
              <div className="footer-contact-item">
                <MapPin className="footer-contact-icon red" />
                <span>San Francisco, CA</span>
              </div>
            </div>
            
            {/* Newsletter Signup */}
            <div className="footer-newsletter">
              <h4 className="footer-newsletter-title">Stay Updated</h4>
              <div className="footer-newsletter-form">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="footer-newsletter-input"
                />
                <button className="footer-newsletter-btn">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Features Highlight */}
        <div className="footer-features">
          <div className="footer-features-grid">
            <div className="footer-feature-card">
              <div className="footer-feature-icon blue">
                ⚡
              </div>
              <h4 className="footer-feature-title">Instant Analysis</h4>
              <p className="footer-feature-desc">Get comprehensive resume feedback in seconds</p>
            </div>
            <div className="footer-feature-card">
              <div className="footer-feature-icon green">
                🎯
              </div>
              <h4 className="footer-feature-title">Job Matching</h4>
              <p className="footer-feature-desc">Match your skills against job requirements</p>
            </div>
            <div className="footer-feature-card">
              <div className="footer-feature-icon purple">
                💡
              </div>
              <h4 className="footer-feature-title">Smart Suggestions</h4>
              <p className="footer-feature-desc">Get actionable improvement recommendations</p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <div className="footer-copyright">
            © {currentYear} AI Resume Checker. All rights reserved.
          </div>
          <div className="footer-bottom-links">
            <Link to="/privacy" className="footer-bottom-link">
              Privacy Policy
            </Link>
            <Link to="/terms" className="footer-bottom-link">
              Terms of Service
            </Link>
            <Link to="/cookies" className="footer-bottom-link">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;