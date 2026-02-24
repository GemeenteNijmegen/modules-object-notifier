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
    fetchFn?: any;
  }) {
  }

  async request(config: RequestConfiguration, url: string): Promise<any> {
    const firstResponse = await this.makeRequest(config, url);

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
