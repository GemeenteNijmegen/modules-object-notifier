interface App {
  url: string;
  method: 'GET' | 'POST';
  headers: {
    'Content-Type': string;
    'Authorization': string;
  };
  body: object;
}

async function apiConnect(app: App): Promise<any> {
  const response = await fetch(requestApi(app));
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export function requestApi(app: App): any {
  return {
    url: app.url,
    method: app.method,
    headers: {
      ...app.headers,
    },
    body: JSON.stringify({
      // Your request body here
    }),
  };
}