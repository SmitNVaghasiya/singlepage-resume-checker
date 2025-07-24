import dns from 'dns';
import { promisify } from 'util';

const resolveMx = promisify(dns.resolveMx);

// List of known disposable/temporary email domains
const disposableEmailDomains = [
  // Popular temporary email services
  '10minutemail.com',
  '1secmail.com',
  '20minutemail.com',
  '33mail.com',
  'anonymail.com',
  'bearsarefuzzy.com',
  'burnermail.io',
  'byom.de',
  'chacuo.net',
  'crazymailing.com',
  'deadaddress.com',
  'discard.email',
  'disposableinbox.com',
  'disposablemail.com',
  'dispostable.com',
  'dropmail.me',
  'email-fake.com',
  'emailfake.com',
  'emailondeck.com',
  'emailtemporario.com.br',
  'fakemailgenerator.com',
  'fake-mail.net',
  'fakeinbox.com',
  'getairmail.com',
  'getnada.com',
  'grr.la',
  'guerillamail.biz',
  'guerillamail.de',
  'guerillamail.net',
  'guerillamail.org',
  'guerrillamail.com',
  'hmamail.com',
  'inboxbear.com',
  'inboxproxy.com',
  'jetable.org',
  'mail-temp.com',
  'mailcatch.com',
  'maildrop.cc',
  'mailforspam.com',
  'mailinator.com',
  'mailmetrash.com',
  'mailnesia.com',
  'mailtothis.com',
  'mintemail.com',
  'mohmal.com',
  'moakt.com',
  'mytemp.email',
  'pp.ua',
  'sharklasers.com',
  'spam4.me',
  'spambox.me',
  'temp-mail.io',
  'temp-mail.org',
  'temp-mail.ru',
  'tempail.com',
  'tempinbox.com',
  'tempmail.com',
  'tempmail.de',
  'tempmail.eu',
  'tempmail.net',
  'tempmail.us',
  'tempmailo.com',
  'tempr.email',
  'temporary-email.com',
  'temporary-mail.net',
  'throwam.com',
  'throwawaymail.com',
  'trash-mail.de',
  'trashmail.com',
  'trashmail.net',
  'yopmail.com',
  'yopmail.fr',
  'yopmail.net',
  'zohomail.com',
  // Add more domains as needed
];

export interface EmailValidationResult {
  isValid: boolean;
  isDisposable: boolean;
  domainExists: boolean;
  message: string;
}

class EmailValidationService {
  private disposableDomainsSet: Set<string>;

  constructor() {
    // Convert array to Set for O(1) lookup performance
    this.disposableDomainsSet = new Set(
      disposableEmailDomains.map(domain => domain.toLowerCase())
    );
  }

  /**
   * Basic email format validation
   */
  private isValidEmailFormat(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  /**
   * Check if email domain is in disposable list
   */
  private isDisposableEmail(email: string): boolean {
    const domain = email.split('@')[1]?.toLowerCase();
    return domain ? this.disposableDomainsSet.has(domain) : false;
  }

  /**
   * Check if email domain has valid MX records (can receive emails)
   */
  private async checkDomainExists(email: string): Promise<boolean> {
    try {
      const domain = email.split('@')[1];
      if (!domain) return false;

      const mxRecords = await resolveMx(domain);
      return mxRecords.length > 0;
    } catch (error) {
      // Domain doesn't exist or has no MX records
      return false;
    }
  }

  /**
   * Comprehensive email validation
   */
  async validateEmail(email: string): Promise<EmailValidationResult> {
    // Basic format check
    if (!this.isValidEmailFormat(email)) {
      return {
        isValid: false,
        isDisposable: false,
        domainExists: false,
        message: '❌ Please enter a valid email address (e.g., john@example.com)'
      };
    }

    // Check if it's a disposable email
    if (this.isDisposableEmail(email)) {
      return {
        isValid: false,
        isDisposable: true,
        domainExists: false,
        message: this.getDisposableEmailError(email)
      };
    }

    // Check if domain exists and can receive emails
    const domainExists = await this.checkDomainExists(email);
    if (!domainExists) {
      return {
        isValid: false,
        isDisposable: false,
        domainExists: false,
        message: '❌ This email domain does not exist or cannot receive emails. Please use a valid email address from providers like Gmail, Outlook, Yahoo, etc.'
      };
    }

    return {
      isValid: true,
      isDisposable: false,
      domainExists: true,
      message: 'Email is valid'
    };
  }

  /**
   * Quick validation for disposable emails only (without DNS check)
   */
  validateDisposableEmail(email: string): boolean {
    return this.isDisposableEmail(email);
  }

  /**
   * Get detailed error message for disposable email
   */
  getDisposableEmailError(email: string): string {
    const domain = email.split('@')[1]?.toLowerCase();
    return `❌ The email domain "${domain}" is a temporary/disposable email service. Please use your real email address (Gmail, Outlook, Yahoo, etc.) to create your account. This helps us verify your identity and send you important updates about your resume analysis.`;
  }

  /**
   * Add a new disposable domain to the list
   */
  addDisposableDomain(domain: string): void {
    this.disposableDomainsSet.add(domain.toLowerCase());
  }

  /**
   * Remove a domain from disposable list
   */
  removeDisposableDomain(domain: string): void {
    this.disposableDomainsSet.delete(domain.toLowerCase());
  }

  /**
   * Get all disposable domains (for admin purposes)
   */
  getDisposableDomains(): string[] {
    return Array.from(this.disposableDomainsSet);
  }
}

// Export singleton instance
export const emailValidationService = new EmailValidationService(); 