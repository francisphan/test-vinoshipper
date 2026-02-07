/**
 * Vinoshipper API Client
 *
 * A robust client for interacting with the Vinoshipper API.
 * Handles authentication, inventory management, and error handling.
 */

export interface VinoshipperProduct {
  sku: string;
  name: string;
  quantity: number;
  price?: number;
  category?: string;
  vintage?: string;
  bottleSize?: string;
  status?: 'active' | 'inactive' | 'sold_out';
  lastSync?: Date;
}

export interface VinoshipperApiProduct {
  sku?: string;
  product_code?: string;
  id?: string;
  name?: string;
  title?: string;
  description?: string;
  quantity?: number;
  stock?: number;
  inventory_count?: number;
  price?: number;
  retail_price?: number;
  category?: string;
  type?: string;
  vintage?: string;
  year?: string;
  bottle_size?: string;
  size?: string;
  status?: string;
  active?: boolean;
}

export interface CreateProductRequest {
  sku: string;
  name: string;
  quantity: number;
}

export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableStatusCodes: number[];
}

export class VinoshipperApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any,
    public isRetryable: boolean = false
  ) {
    super(message);
    this.name = 'VinoshipperApiError';
  }
}

export class VinoshipperClient {
  private baseUrl: string;
  private apiKey: string;
  private apiSecret: string;
  private retryConfig: RetryConfig;

  /**
   * Creates a new Vinoshipper API client
   * @param apiKey - The API key (can include secret as "key:secret")
   * @param baseUrl - Optional custom base URL (defaults to production)
   * @param retryConfig - Optional retry configuration
   */
  constructor(
    apiKey: string,
    baseUrl: string = 'https://www.vinoshipper.com/api',
    retryConfig?: Partial<RetryConfig>
  ) {
    this.baseUrl = baseUrl;

    // Handle both "key:secret" format and separate key
    if (apiKey.includes(':')) {
      const [key, secret] = apiKey.split(':');
      this.apiKey = key;
      this.apiSecret = secret;
    } else {
      this.apiKey = apiKey;
      this.apiSecret = '';
    }

    // Default retry configuration
    this.retryConfig = {
      maxRetries: 3,
      initialDelayMs: 1000,
      maxDelayMs: 10000,
      backoffMultiplier: 2,
      retryableStatusCodes: [429, 500, 502, 503, 504],
      ...retryConfig,
    };
  }

  /**
   * Generates the Basic Authentication header
   */
  private getAuthHeader(): string {
    const credentials = btoa(`${this.apiKey}:${this.apiSecret}`);
    return `Basic ${credentials}`;
  }

  /**
   * Determines if an error is retryable
   */
  private isRetryableError(error: VinoshipperApiError): boolean {
    // Network errors are retryable
    if (error.statusCode === 0) {
      return true;
    }

    // Check if status code is in the retryable list
    if (error.statusCode && this.retryConfig.retryableStatusCodes.includes(error.statusCode)) {
      return true;
    }

    return false;
  }

  /**
   * Calculates delay for exponential backoff with jitter
   */
  private calculateBackoffDelay(attemptNumber: number): number {
    const exponentialDelay = this.retryConfig.initialDelayMs * Math.pow(this.retryConfig.backoffMultiplier, attemptNumber);
    const cappedDelay = Math.min(exponentialDelay, this.retryConfig.maxDelayMs);

    // Add jitter (random 0-25% of delay) to prevent thundering herd
    const jitter = cappedDelay * 0.25 * Math.random();

    return Math.floor(cappedDelay + jitter);
  }

  /**
   * Sleeps for a specified number of milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Executes a single request attempt to the Vinoshipper API
   */
  private async executeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      // Handle non-OK responses
      if (!response.ok) {
        let errorMessage = `API request failed with status ${response.status}`;
        let errorData: any = null;

        try {
          errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          // If we can't parse JSON, try to get text
          try {
            const text = await response.text();
            if (text) {
              errorMessage = text;
            }
          } catch (textError) {
            // If all else fails, use the status text
            errorMessage = response.statusText || errorMessage;
          }
        }

        const isRetryable = this.retryConfig.retryableStatusCodes.includes(response.status);
        throw new VinoshipperApiError(
          errorMessage,
          response.status,
          errorData,
          isRetryable
        );
      }

      // Parse successful response
      const data = await response.json();
      return data as T;

    } catch (error) {
      // Re-throw VinoshipperApiError as-is
      if (error instanceof VinoshipperApiError) {
        throw error;
      }

      // Handle network errors and other exceptions
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new VinoshipperApiError(
          'Network error: Unable to reach Vinoshipper API. Please check your connection.',
          0,
          null,
          true // Network errors are retryable
        );
      }

      // Generic error handling
      throw new VinoshipperApiError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        0,
        null,
        false
      );
    }
  }

  /**
   * Makes an authenticated request to the Vinoshipper API with retry logic
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    let lastError: VinoshipperApiError | null = null;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        return await this.executeRequest<T>(endpoint, options);
      } catch (error) {
        if (!(error instanceof VinoshipperApiError)) {
          throw error;
        }

        lastError = error;

        // Don't retry if it's the last attempt or error is not retryable
        if (attempt === this.retryConfig.maxRetries || !this.isRetryableError(error)) {
          throw error;
        }

        // Calculate backoff delay
        const delay = this.calculateBackoffDelay(attempt);

        // Log retry attempt
        console.warn(
          `Vinoshipper API request failed (attempt ${attempt + 1}/${this.retryConfig.maxRetries + 1}): ${error.message}. ` +
          `Retrying in ${delay}ms...`
        );

        // Wait before retrying
        await this.sleep(delay);
      }
    }

    // This should never be reached, but TypeScript needs it
    throw lastError || new VinoshipperApiError('Request failed after all retries');
  }

  /**
   * Normalizes product data from various API response formats
   */
  private normalizeStatus(item: VinoshipperApiProduct): 'active' | 'inactive' | 'sold_out' | undefined {
    if (item.status) {
      const s = item.status.toLowerCase();
      if (s === 'active') return 'active';
      if (s === 'inactive') return 'inactive';
      if (s === 'sold_out' || s === 'sold out') return 'sold_out';
    }
    if (item.active === false) return 'inactive';
    if (item.active === true) return 'active';
    return undefined;
  }

  private normalizeProduct(item: VinoshipperApiProduct): VinoshipperProduct {
    return {
      sku: item.sku || item.product_code || item.id || 'UNKNOWN',
      name: item.name || item.title || item.description || 'Unnamed Product',
      quantity: item.quantity ?? item.stock ?? item.inventory_count ?? 0,
      price: item.price ?? item.retail_price,
      category: item.category || item.type,
      vintage: item.vintage || item.year,
      bottleSize: item.bottle_size || item.size,
      status: this.normalizeStatus(item),
      lastSync: new Date(),
    };
  }

  /**
   * Retrieves inventory/products from Vinoshipper
   * @returns Array of normalized product objects
   */
  async getInventory(): Promise<VinoshipperProduct[]> {
    try {
      const data = await this.makeRequest<{ products?: VinoshipperApiProduct[] }>(
        '/products',
        { method: 'GET' }
      );

      if (!data.products || !Array.isArray(data.products)) {
        console.warn('Vinoshipper API returned unexpected format:', data);
        return [];
      }

      return data.products.map(item => this.normalizeProduct(item));

    } catch (error) {
      console.error('Failed to get inventory:', error);
      throw error;
    }
  }

  /**
   * Updates the quantity of a specific product
   * @param sku - The product SKU to update
   * @param quantity - The new quantity value
   * @returns The updated product data
   */
  async updateInventory(sku: string, quantity: number): Promise<any> {
    if (!sku || sku.trim() === '') {
      throw new VinoshipperApiError('SKU is required for inventory update');
    }

    if (quantity < 0) {
      throw new VinoshipperApiError('Quantity cannot be negative');
    }

    try {
      const data = await this.makeRequest(
        `/products/${encodeURIComponent(sku)}`,
        {
          method: 'PUT',
          body: JSON.stringify({ quantity }),
        }
      );

      return data;

    } catch (error) {
      console.error(`Failed to update inventory for SKU ${sku}:`, error);
      throw error;
    }
  }

  /**
   * Creates a new product in Vinoshipper
   * @param product - The product data to create
   * @returns The created product data
   */
  async createProduct(product: CreateProductRequest): Promise<any> {
    if (!product.sku || product.sku.trim() === '') {
      throw new VinoshipperApiError('SKU is required to create a product');
    }

    if (!product.name || product.name.trim() === '') {
      throw new VinoshipperApiError('Product name is required');
    }

    if (product.quantity < 0) {
      throw new VinoshipperApiError('Quantity cannot be negative');
    }

    try {
      const data = await this.makeRequest(
        '/products',
        {
          method: 'POST',
          body: JSON.stringify({
            sku: product.sku,
            name: product.name,
            quantity: product.quantity,
          }),
        }
      );

      return data;

    } catch (error) {
      console.error(`Failed to create product ${product.sku}:`, error);
      throw error;
    }
  }

  /**
   * Batch update multiple products
   * @param updates - Array of {sku, quantity} pairs to update
   * @returns Array of results with success/failure status
   */
  async batchUpdateInventory(
    updates: Array<{ sku: string; quantity: number }>
  ): Promise<Array<{ sku: string; success: boolean; error?: string }>> {
    const results: Array<{ sku: string; success: boolean; error?: string }> = [];

    for (const update of updates) {
      try {
        await this.updateInventory(update.sku, update.quantity);
        results.push({ sku: update.sku, success: true });
      } catch (error) {
        results.push({
          sku: update.sku,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  /**
   * Gets a single product by SKU
   * @param sku - The product SKU to retrieve
   * @returns The product data if found
   */
  async getProduct(sku: string): Promise<VinoshipperProduct | null> {
    if (!sku || sku.trim() === '') {
      throw new VinoshipperApiError('SKU is required');
    }

    try {
      const data = await this.makeRequest<VinoshipperApiProduct>(
        `/products/${encodeURIComponent(sku)}`,
        { method: 'GET' }
      );

      return this.normalizeProduct(data);

    } catch (error) {
      // If it's a 404, return null instead of throwing
      if (error instanceof VinoshipperApiError && error.statusCode === 404) {
        return null;
      }

      console.error(`Failed to get product ${sku}:`, error);
      throw error;
    }
  }

  /**
   * Validates the API credentials by making a test request
   * @returns True if credentials are valid
   */
  async validateCredentials(): Promise<boolean> {
    try {
      await this.getInventory();
      return true;
    } catch (error) {
      if (error instanceof VinoshipperApiError &&
          (error.statusCode === 401 || error.statusCode === 403)) {
        return false;
      }
      // Other errors might not be auth-related
      throw error;
    }
  }

  /**
   * Updates the retry configuration
   * @param config - Partial retry configuration to merge with current config
   */
  updateRetryConfig(config: Partial<RetryConfig>): void {
    this.retryConfig = {
      ...this.retryConfig,
      ...config,
    };
  }

  /**
   * Gets the current retry configuration
   * @returns Current retry configuration
   */
  getRetryConfig(): RetryConfig {
    return { ...this.retryConfig };
  }
}

// Preset retry configurations
export const RetryPresets = {
  /**
   * Default retry configuration - balanced for most use cases
   */
  DEFAULT: {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
    retryableStatusCodes: [429, 500, 502, 503, 504],
  } as RetryConfig,

  /**
   * Aggressive retry - more attempts with shorter delays
   */
  AGGRESSIVE: {
    maxRetries: 5,
    initialDelayMs: 500,
    maxDelayMs: 8000,
    backoffMultiplier: 1.5,
    retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  } as RetryConfig,

  /**
   * Conservative retry - fewer attempts with longer delays
   */
  CONSERVATIVE: {
    maxRetries: 2,
    initialDelayMs: 2000,
    maxDelayMs: 15000,
    backoffMultiplier: 3,
    retryableStatusCodes: [500, 502, 503, 504],
  } as RetryConfig,

  /**
   * No retry - fail immediately on any error
   */
  NO_RETRY: {
    maxRetries: 0,
    initialDelayMs: 0,
    maxDelayMs: 0,
    backoffMultiplier: 1,
    retryableStatusCodes: [],
  } as RetryConfig,
};

// Export a factory function for convenience
export function createVinoshipperClient(
  apiKey: string,
  baseUrl?: string,
  retryConfig?: Partial<RetryConfig>
): VinoshipperClient {
  return new VinoshipperClient(apiKey, baseUrl, retryConfig);
}