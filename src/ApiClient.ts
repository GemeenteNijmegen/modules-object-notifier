import * as jwt from 'jsonwebtoken';
interface RequestConfiguration {
  method: 'GET' | 'POST';
  headers?: {
    [key: string]: string;
  };
  body?: any;
}

interface PaginatedResponse<T = any> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export class ApiClient {
  constructor(private config: {
    authHeader: string;
    baseUrl?: string;
    fetchFn?: any;
  }) {
  }

  async request(config: RequestConfiguration, url: string): Promise<any> {
    let finalUrl = this.buildUrl(url);

    const firstResponse = await this.makeRequest(config, finalUrl);

    const isPaginated = this.isPaginatedResponse(firstResponse);
    const shouldFetchAll = isPaginated && config.method === 'GET';

    if (!shouldFetchAll) {
      return firstResponse;
    }

    // Collect all results
    let allResults = [...firstResponse.results];
    let nextUrl = firstResponse.next;

    while (nextUrl) {
      const response: PaginatedResponse = await this.makeRequest(config, nextUrl);
      allResults = allResults.concat(response.results);
      nextUrl = response.next;
    }

    // Return combined response with all results
    return allResults;
  }

  /**
   * Creates a full URL from provided URL and optional baseURL
   * if provided url is a complete URL string, returns that,
   * if not, and baseURL is set, returns combined URL as string.
   * If neither succeed, throws.
   *
   * @param url provided url, can be partial
   */
  private buildUrl(url: string) {
    let finalUrl = url;
    if (this.config.baseUrl
      && !URL.canParse(url) // only use baseURL if provided URL is not a full url
      && URL.canParse(url, this.config.baseUrl)) {
      const fullUrl = URL.parse(url, this.config.baseUrl);
      if (fullUrl) {
        finalUrl = fullUrl.toString();
        return finalUrl;
      } else {
        throw Error(`invalid URL provided, provided URL is ${url}, base URL ${this.config.baseUrl}`);
      }
    } else {
      if (URL.canParse(url)) {
        return url;
      } else {
        throw Error(`invalid URL provided: ${url}`);
      }
    }
  }

  public configureRequest(config: RequestConfiguration): RequestConfiguration {
    const request = {
      method: config.method,
      headers: {
        'Authorization': this.config.authHeader,
        'Content-Type': 'application/json',
        ...config?.headers,
      },
    } as RequestConfiguration;
    if (config.body) {
      request.body = JSON.stringify(config.body);
    }
    return request;
  }

  /**
   * Makes a single request to the API
   */
  private async makeRequest(config: RequestConfiguration, url: string): Promise<any> {
    const fetchFn = this.config.fetchFn ?? fetch;
    const response = await fetchFn(url, config);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Type guard to check if response is paginated
   */
  private isPaginatedResponse(response: any): response is PaginatedResponse {
    return (
      response &&
      typeof response === 'object' &&
      'results' in response &&
      Array.isArray(response.results) &&
      ('next' in response || 'previous' in response)
    );
  }
}

export function notifiyApiClientWithConfig(config: {
  issuer: string;
  secret: string;
  baseUrl?: string;
  fetchFn?: any;
}) {
  const baseUrl = config.baseUrl ?? 'https://api.notifynl.nl/v2/notifications/';
  return new ApiClient({
    baseUrl,
    authHeader: `Bearer ${createJwt(config.secret, config.issuer)}`,
    fetchFn: config.fetchFn,
  });
}

function createJwt(secret: string, iss: string) {
  return jwt.sign({
    iss,
    iat: Math.floor(Date.now() / 1000),
  }, secret);
}
