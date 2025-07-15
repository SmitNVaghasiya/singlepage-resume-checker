import dns from 'dns';
import { promisify } from 'util';

const resolveMx = promisify(dns.resolveMx);

// List of known disposable/temporary email domains
const disposableEmailDomains = [
  'tempmail.com',
  '10minutemail.com',
  'guerrillamail.com',
  'mailinator.com',
  'yopmail.com',
  'maildrop.cc',
  'dispostable.com',
  'trashmail.com',
  'getnada.com',
  'tempmailo.com',
  'throwawaymail.com',
  'mailnesia.com',
  'sharklasers.com',
  'burnermail.io',
  'emailondeck.com',
  'tempinbox.com',
  'fakeinbox.com',
  'disposablemail.com',
  '33mail.com',
  'anonymail.com',
  'bearsarefuzzy.com',
  'deadaddress.com',
  'discard.email',
  'dropmail.me',
  'fakemailgenerator.com',
  'getairmail.com',
  'guerillamail.biz',
  'guerillamail.de',
  'guerillamail.net',
  'guerillamail.org',
  'inboxbear.com',
  'mailcatch.com',
  'mailforspam.com',
  'mailmetrash.com',
  'mintemail.com',
  'mohmal.com',
  'spambox.me',
  'tempail.com',
  'tempmail.eu',
  'tempmail.us',
  'temporary-email.com',
  'throwam.com',
  'zohomail.com',
  // Additional domains from community sources
  '1secmail.com',
  '20minutemail.com',
  'byom.de',
  'chacuo.net',
  'crazymailing.com',
  'disposableinbox.com',
  'email-fake.com',
  'emailfake.com',
  'emailtemporario.com.br',
  'fake-mail.net',
  'grr.la',
  'hmamail.com',
  'inboxproxy.com',
  'jetable.org',
  'mail-temp.com',
  'mailtothis.com',
  'moakt.com',
  'mytemp.email',
  'pp.ua',
  'spam4.me',
  'temp-mail.ru',
  'tempmail.de',
  'tempmail.net',
  'temporary-mail.net',
  'trash-mail.de',
  'yopmail.fr',
  'yopmail.net',
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
        message: 'Please provide a valid email address format'
      };
    }

    // Check if it's a disposable email
    if (this.isDisposableEmail(email)) {
      return {
        isValid: false,
        isDisposable: true,
        domainExists: false,
        message: 'Temporary or disposable email addresses are not allowed. Please use a valid email address.'
      };
    }

    // Check if domain exists and can receive emails
    const domainExists = await this.checkDomainExists(email);
    if (!domainExists) {
      return {
        isValid: false,
        isDisposable: false,
        domainExists: false,
        message: 'Email domain does not exist or cannot receive emails. Please use a valid email address.'
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