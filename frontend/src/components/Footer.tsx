import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Mail, Phone, MapPin, Github, Linkedin, Twitter, ExternalLink } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { name: 'Resume Analysis', path: '/resumechecker' },
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
              Perfect your resume with AI-powered analysis. Get instant feedback and actionable insights.
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
                    <Icon className="w-4 h-4" />
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
                  <Link to={link.path} className="footer-link">
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
                  <Link to={link.path} className="footer-link">
                    <span>{link.name}</span>
                    <ExternalLink className="footer-link-icon" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="footer-section-title">Resources</h3>
            <ul className="footer-links">
              {footerLinks.resources.map((link, index) => (
                <li key={index}>
                  <Link to={link.path} className="footer-link">
                    <span>{link.name}</span>
                    <ExternalLink className="footer-link-icon" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="footer-section-title">Contact</h3>
            <div className="footer-contact-list">
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