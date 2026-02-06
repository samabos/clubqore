/**
 * Payment Provider Factory
 *
 * Factory class for creating payment provider instances.
 * Provides a centralized way to instantiate and manage payment providers.
 *
 * Usage:
 *   const provider = PaymentProviderFactory.getProvider('gocardless', config);
 *   const customer = await provider.createCustomer(customerData);
 */

import { GoCardlessProvider } from '../providers/GoCardlessProvider.js';
import { getConfig } from '../../config/index.js';

// Registry of available payment providers
const providers = {
  gocardless: GoCardlessProvider,
  // Future providers:
  // stripe: StripeProvider,
  // paypal: PayPalProvider,
};

// Singleton instances (optional caching)
const instances = new Map();

export class PaymentProviderFactory {
  /**
   * Get a payment provider instance by name
   *
   * @param {string} providerName - The provider name ('gocardless', 'stripe', etc.)
   * @param {Object} config - Provider-specific configuration (optional, uses env config if not provided)
   * @param {boolean} cached - Whether to use cached instance (default: true)
   * @returns {PaymentProviderInterface} Provider instance
   */
  static getProvider(providerName, config = null, cached = true) {
    const normalizedName = providerName.toLowerCase();

    // Check if provider is registered
    const ProviderClass = providers[normalizedName];
    if (!ProviderClass) {
      const availableProviders = Object.keys(providers).join(', ');
      throw new Error(
        `Unknown payment provider: ${providerName}. Available providers: ${availableProviders}`
      );
    }

    // Use cached instance if available and caching is enabled
    if (cached && instances.has(normalizedName)) {
      return instances.get(normalizedName);
    }

    // Get configuration from environment if not provided
    const providerConfig = config || this._getProviderConfig(normalizedName);

    // Create new instance with error handling
    let instance;
    try {
      instance = new ProviderClass(providerConfig);
    } catch (error) {
      // Re-throw with statusCode for proper HTTP response
      const configError = new Error(error.message);
      configError.statusCode = 503;
      throw configError;
    }

    // Cache the instance
    if (cached) {
      instances.set(normalizedName, instance);
    }

    return instance;
  }

  /**
   * Get the default payment provider
   *
   * Uses the DEFAULT_PAYMENT_PROVIDER environment variable or falls back to GoCardless
   *
   * @param {Object} config - Provider configuration (optional)
   * @returns {PaymentProviderInterface} Default provider instance
   */
  static getDefaultProvider(config = null) {
    const appConfig = getConfig();
    const defaultProvider = appConfig.payment?.defaultProvider ||
                           process.env.DEFAULT_PAYMENT_PROVIDER ||
                           'gocardless';

    return this.getProvider(defaultProvider, config);
  }

  /**
   * Get configuration for a specific provider from environment
   *
   * @private
   * @param {string} providerName - The provider name
   * @returns {Object} Provider configuration
   */
  static _getProviderConfig(providerName) {
    const appConfig = getConfig();

    switch (providerName) {
      case 'gocardless':
        return {
          accessToken: appConfig.gocardless?.accessToken || process.env.GOCARDLESS_ACCESS_TOKEN,
          environment: appConfig.gocardless?.environment || process.env.GOCARDLESS_ENVIRONMENT || 'sandbox',
          webhookSecret: appConfig.gocardless?.webhookSecret || process.env.GOCARDLESS_WEBHOOK_SECRET
        };

      case 'stripe':
        return {
          secretKey: appConfig.stripe?.secretKey || process.env.STRIPE_SECRET_KEY,
          webhookSecret: appConfig.stripe?.webhookSecret || process.env.STRIPE_WEBHOOK_SECRET,
          environment: process.env.NODE_ENV === 'production' ? 'live' : 'test'
        };

      default:
        throw new Error(`No configuration found for provider: ${providerName}`);
    }
  }

  /**
   * Register a new payment provider
   *
   * Allows dynamic registration of custom payment providers at runtime.
   *
   * @param {string} name - The provider name
   * @param {class} ProviderClass - The provider class (must extend PaymentProviderInterface)
   */
  static registerProvider(name, ProviderClass) {
    const normalizedName = name.toLowerCase();

    if (providers[normalizedName]) {
      throw new Error(`Provider already registered: ${name}`);
    }

    providers[normalizedName] = ProviderClass;
  }

  /**
   * Check if a provider is available
   *
   * @param {string} providerName - The provider name
   * @returns {boolean} True if provider is registered
   */
  static isProviderAvailable(providerName) {
    return !!providers[providerName.toLowerCase()];
  }

  /**
   * Get list of available provider names
   *
   * @returns {string[]} List of provider names
   */
  static getAvailableProviders() {
    return Object.keys(providers);
  }

  /**
   * Clear cached provider instances
   *
   * Useful for testing or when configuration changes.
   *
   * @param {string} providerName - Optional provider name to clear specific instance
   */
  static clearCache(providerName = null) {
    if (providerName) {
      instances.delete(providerName.toLowerCase());
    } else {
      instances.clear();
    }
  }

  /**
   * Get a provider for a specific club
   *
   * In the future, this could support per-club provider configuration.
   *
   * @param {number} clubId - The club ID
   * @param {string} providerName - Optional provider name override
   * @returns {PaymentProviderInterface} Provider instance
   */
  static async getProviderForClub(clubId, providerName = null) {
    // For now, just return the default provider
    // In the future, this could look up club-specific settings
    if (providerName) {
      return this.getProvider(providerName);
    }
    return this.getDefaultProvider();
  }
}

export default PaymentProviderFactory;
