import React from "react";
import { Link } from "react-router-dom";
import {
  Briefcase,
  Mail,
  Phone,
  MapPin,
  Github,
  Linkedin,
  Twitter,
  ExternalLink,
} from "lucide-react";

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { name: "Resume Analysis", path: "/resumechecker", disabled: false },
      { name: "Dashboard", path: "/dashboard", disabled: false },
      { name: "Contact", path: "/contact", disabled: false },
    ],
    company: [
      { name: "About Us", path: "/about", disabled: true },
      { name: "Privacy Policy", path: "/privacy", disabled: true },
      { name: "Terms of Service", path: "/terms", disabled: true },
    ],
    resources: [
      { name: "Blog", path: "/blog", disabled: true },
      { name: "Help Center", path: "/help", disabled: true },
      { name: "Career Tips", path: "/tips", disabled: true },
    ],
  };

  const socialLinks = [
    {
      icon: Github,
      href: "https://github.com/SmitNVaghasiya",
      label: "GitHub",
    },
    {
      icon: Linkedin,
      href: "https://www.linkedin.com/in/smit-vaghasiya2004/",
      label: "LinkedIn",
    },
    { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
  ];

  const renderFooterLink = (
    link: { name: string; path: string; disabled: boolean },
    index: number
  ) => {
    if (link.disabled) {
      return (
        <li key={index}>
          <span className="footer-link disabled">
            <span>{link.name}</span>
          </span>
        </li>
      );
    }

    return (
      <li key={index}>
        <Link to={link.path} className="footer-link">
          <span>{link.name}</span>
          <ExternalLink className="footer-link-icon" />
        </Link>
      </li>
    );
  };

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
              Perfect your resume with AI-powered analysis. Get instant feedback
              and actionable insights.
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
              {footerLinks.product.map(renderFooterLink)}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="footer-section-title">Company</h3>
            <ul className="footer-links">
              {footerLinks.company.map(renderFooterLink)}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="footer-section-title">Resources</h3>
            <ul className="footer-links">
              {footerLinks.resources.map(renderFooterLink)}
            </ul>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="footer-section-title">Contact</h3>
            <div className="footer-contact-list">
              <div className="footer-contact-item">
                <Mail className="footer-contact-icon blue" />
                <a
                  href="mailto:smitvaghasiya11280@gmail.com"
                  className="footer-contact-link"
                >
                  smitvaghasiya11280@gmail.com
                </a>
              </div>
              <div className="footer-contact-item">
                <Phone className="footer-contact-icon green" />
                <a href="tel:+9193130230990" className="footer-contact-link">
                  +91 93130230990
                </a>
              </div>
              <div className="footer-contact-item">
                <MapPin className="footer-contact-icon red" />
                <span>Surat, Gujarat</span>
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
            <span className="footer-bottom-link disabled">Privacy Policy</span>
            <span className="footer-bottom-link disabled">
              Terms of Service
            </span>
            <span className="footer-bottom-link disabled">Cookie Policy</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
