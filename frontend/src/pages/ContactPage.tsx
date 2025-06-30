import React, { useState, useEffect } from 'react';
import { User, Mail, MessageSquare, Send, CheckCircle, MapPin, Phone, Clock, AlertCircle } from 'lucide-react';
import '../styles/contact.css';
import { useAppContext } from '../contexts/AppContext';
import { apiService } from '../services/api';

interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const ContactPage: React.FC = () => {
  const { user, isAuthLoading } = useAppContext();
  const [contactForm, setContactForm] = useState<ContactForm>({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Partial<ContactForm>>({});
  const [submitError, setSubmitError] = useState<string>('');

  // Populate form with user data when logged in
  useEffect(() => {
    if (user && !isAuthLoading) {
      setContactForm(prev => ({
        ...prev,
        // Don't auto-fill name - let user enter their full name
        email: user.email
      }));
    }
  }, [user, isAuthLoading]);

  const validateForm = () => {
    const newErrors: Partial<ContactForm> = {};
    
    if (!contactForm.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    // Only validate email if user is not logged in
    if (!user) {
      if (!contactForm.email.trim()) {
        newErrors.email = 'Email is required';
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(contactForm.email)) {
          newErrors.email = 'Please enter a valid email address';
        }
      }
    }
    
    if (!contactForm.message.trim()) {
      newErrors.message = 'Message is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError('');
    
    try {
      await apiService.submitContactForm({
        name: contactForm.name,
        email: user ? user.email : contactForm.email, // Use logged-in user's email if available
        subject: contactForm.subject,
        message: contactForm.message
      });
      
      setIsSubmitted(true);
      
      // Reset form after success message
      setTimeout(() => {
        setContactForm(prev => ({ 
          ...prev, 
          name: '', // Reset name field
          subject: '', 
          message: '' 
        }));
        setIsSubmitted(false);
        setErrors({});
      }, 3000);
    } catch (error) {
      console.error('Failed to submit contact form:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setContactForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof ContactForm]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const contactInfo = [
    {
      icon: Mail,
      title: 'Email Us',
      description: 'support@airesumechecker.com',
      subtext: 'We respond within 24 hours',
      color: 'contact-info-blue'
    },
    {
      icon: MessageSquare,
      title: 'Live Chat',
      description: 'Available 24/7',
      subtext: 'Instant support',
      color: 'contact-info-green'
    },
    {
      icon: Clock,
      title: 'Response Time',
      description: 'Within 24 hours',
      subtext: 'Usually much faster',
      color: 'contact-info-purple'
    }
  ];

  return (
    <div className="contact-page">
      {/* Hero Section */}
      <div className="contact-hero">
        <div className="contact-hero-content">
          <h1 className="contact-hero-title">Contact Us</h1>
          <p className="contact-hero-description">
            Have questions about AI Resume Checker? We'd love to hear from you. 
            Send us a message and we'll respond as soon as possible.
          </p>
        </div>
      </div>

      <div className="contact-content">
        <div className="contact-grid">
          {/* Contact Form */}
          <div className="contact-form-section">
            <div className="contact-form-card">
              <div className="contact-form-header">
                <h2 className="contact-form-title">Send us a Message</h2>
                <p className="contact-form-subtitle">
                  {user 
                    ? "We'll use your account email to respond to your message" 
                    : "Fill out the form below and we'll get back to you within 24 hours"
                  }
                </p>
                {!user && (
                  <div className="auth-notice">
                    <AlertCircle className="h-4 w-4" />
                    <span>For faster support, consider <a href="/login" className="auth-link">logging in</a> first</span>
                  </div>
                )}
              </div>

              {isSubmitted ? (
                <div className="contact-success">
                  <div className="contact-success-icon">
                    <CheckCircle className="h-10 w-10" />
                  </div>
                  <h3 className="contact-success-title">Message Sent Successfully!</h3>
                  <p className="contact-success-text">Thank you for reaching out. We'll get back to you soon.</p>
                </div>
              ) : (
                <div className="contact-form">
                  <div className="contact-form-row">
                    <div className="contact-input-group">
                      <label className="contact-label">
                        <User className="contact-label-icon" />
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={contactForm.name}
                        onChange={handleInputChange}
                        className={`contact-input ${errors.name ? 'contact-input-error' : ''}`}
                        placeholder="Enter your full name"
                      />
                      {errors.name && <p className="contact-error-text">{errors.name}</p>}
                    </div>

                    <div className="contact-input-group">
                      <label className="contact-label">
                        <Mail className="contact-label-icon" />
                        Email Address
                        {user && <span className="verified-badge">✓ Verified</span>}
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={contactForm.email}
                        onChange={handleInputChange}
                        disabled={!!user}
                        className={`contact-input ${errors.email ? 'contact-input-error' : ''} ${user ? 'contact-input-disabled' : ''}`}
                        placeholder={user ? "Using your account email" : "Enter your email address"}
                      />
                      {errors.email && <p className="contact-error-text">{errors.email}</p>}
                    </div>
                  </div>

                  <div className="contact-input-group">
                    <label className="contact-label">
                      <MessageSquare className="contact-label-icon" />
                      Subject
                    </label>
                    <input
                      type="text"
                      name="subject"
                      value={contactForm.subject}
                      onChange={handleInputChange}
                      className="contact-input"
                      placeholder="What's this about?"
                    />
                  </div>

                  <div className="contact-input-group">
                    <label className="contact-label">
                      Message
                    </label>
                    <textarea
                      name="message"
                      value={contactForm.message}
                      onChange={handleInputChange}
                      rows={6}
                      className={`contact-textarea ${errors.message ? 'contact-input-error' : ''}`}
                      placeholder="Tell us more about your inquiry..."
                    />
                    {errors.message && <p className="contact-error-text">{errors.message}</p>}
                  </div>

                  {submitError && (
                    <div className="contact-error-message">
                      <AlertCircle className="h-5 w-5" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="contact-submit-btn"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="contact-spinner"></div>
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5" />
                        <span>Send Message</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className="contact-info-section">
            <div className="contact-info-card">
              <h3 className="contact-info-title">Get in Touch</h3>
              <div className="contact-info-list">
                {contactInfo.map((info, index) => {
                  const Icon = info.icon;
                  return (
                    <div key={index} className="contact-info-item">
                      <div className={`contact-info-icon ${info.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="contact-info-content">
                        <h4 className="contact-info-item-title">{info.title}</h4>
                        <p className="contact-info-description">{info.description}</p>
                        <p className="contact-info-subtext">{info.subtext}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="contact-tips-card">
              <h3 className="contact-tips-title">Quick Tips</h3>
              <ul className="contact-tips-list">
                <li>• Be specific about your issue or question</li>
                <li>• Include relevant details to help us assist you better</li>
                <li>• Check your spam folder for our response</li>
                <li>• For urgent matters, mention "URGENT" in the subject</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;