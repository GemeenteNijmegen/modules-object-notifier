interface App {
  method: 'GET' | 'POST';
  headers: {
    'Content-Type': string;
  };
  body: object;
}


export class ApiClient {
  private authHeader: string;
  constructor(authHeader: string) {
    this.authHeader = authHeader;
    console.log(this.authHeader);
  }

  async apiConnect(app: App, url: string): Promise<any> {
    const response = await fetch(url, this.requestApi(app));
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  public requestApi(app: App) {
    return {
      method: app.method,
      headers: {
        Authorization: this.authHeader,
        ...app.headers,
      },
      body: JSON.stringify({
        // Your request body here
      }),
    };
  }
}
