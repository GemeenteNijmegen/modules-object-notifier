interface App {
  method: 'GET' | 'POST';
  headers: {
    'Content-Type': string;
  };
  body?: string;
}


export class ApiClient {
  private authHeader: string;
  constructor(authHeader: string) {
    this.authHeader = authHeader;
  }

  async request(app: App, url: string): Promise<any> {
    const response = await fetch(url, this.configureRequest(app));
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  public configureRequest(app: App): App {
    const request = {
      method: app.method,
      headers: {
        Authorization: this.authHeader,
        ...app.headers,
      },
    } as App;
    if (app.body) {
      request.body = JSON.stringify(app.body);
    }
    return request;
  }
}
