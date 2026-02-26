import { ApiClient } from '../src/ApiClient';

describe('API should', () => {

  test('create succesfully', async () => {
    const apiClient = new ApiClient({ authHeader: 'testkey' });
    const apiClient2 = new ApiClient({ authHeader: 'mijnjwt' });
    expect(apiClient).toBeTruthy();

    expect(apiClient.configureRequest({
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })).toEqual({
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'testkey',
      },
      method: 'POST',
    });

    expect(apiClient2.configureRequest({
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })).toEqual({
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'mijnjwt',
      },
      method: 'POST',
    });
  });

  test('use default headers in request', async () => {
    const apiClient = new ApiClient({
      authHeader: 'testkey',
      defaultHeaders: {
        myHeader: 'myvalue',
        someHeader: 'anothervalue',
      },
    });
    expect(apiClient.configureRequest({ method: 'GET' }).headers).toEqual(
      {
        'Authorization': 'testkey',
        'Content-Type': 'application/json',
        'myHeader': 'myvalue',
        'someHeader': 'anothervalue',
      },
    );
  });

  test('override default headers in request', async () => {
    const apiClient = new ApiClient({
      authHeader: 'testkey',
      defaultHeaders: {
        myHeader: 'myvalue',
        someHeader: 'anothervalue',
      },
    });
    expect(apiClient.configureRequest({
      method: 'GET',
      headers: {
        someHeader: 'differentvalue',
      },
    }).headers).toEqual(
      {
        'Authorization': 'testkey',
        'Content-Type': 'application/json',
        'myHeader': 'myvalue',
        'someHeader': 'differentvalue',
      },
    );
  });
});

describe('API fetches results', () => {
  const fetchFn = async (url: string, config: any) => {
    return new Promise((res, rej) => {
      res({
        ok: true,
        status: 200,
        json: () => { test: 'somevalue '; },
      });
    });
  };
  it('should return ok', async () => {
    const apiClient = new ApiClient({
      authHeader: 'testkey',
      fetchFn,
    });
    const config = apiClient.configureRequest({
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });

    expect(async () => { await apiClient.request(config, 'https://example.com'); }).not.toThrow();
  });
});


describe('API pagination', () => {
  const fetchFn = async (url: string, config: any) => {
    return new Promise((res, rej) => {
      res({
        ok: true,
        status: 200,
        json: () => {
          return {
            count: 10,
            results: [...Array(10).keys()],
            previous: null,
            next: url !== 'https://example.com/page2' ? 'https://example.com/page2' : null,
          };
        },
      });
    });
  };
  it('should merge results', async () => {
    const apiClient = new ApiClient({
      authHeader: 'testkey',
      fetchFn,
    });
    const config = apiClient.configureRequest({
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'GET',
    });
    const result = await apiClient.request(config, 'https://example.com');
    expect(result.results.length).toBe(20);
  });
});


describe('partial URLs', () => {
  const fetchFn = jest.fn(async (url: string, config: any) => {
    return new Promise((res, rej) => {
      res({
        ok: true,
        status: 200,
        json: () => {
          return {
            count: 10,
            results: [...Array(10).keys()],
            previous: null,
            next: null,
          };
        },
      });
    });
  });

  it.each([
    {
      baseUrl: 'https://example.com',
      url: 'test',
      expected: 'https://example.com/test',
      description: 'should combine base + partial URL',
    },
    {
      baseUrl: 'https://example.com',
      url: 'https://localhost/test',
      expected: 'https://localhost/test',
      description: 'should prioritize full provided url',
    },
    {
      baseUrl: undefined,
      url: 'https://example.com',
      expected: 'https://example.com',
      description: 'should allow baseUrl not to be defined',
    },
  ])(
    '$description (baseurl: $baseUrl, url: $url, expected: $expected)',
    async ({ baseUrl, url, expected }) => {
      const apiClient = new ApiClient({
        authHeader: 'testkey',
        baseUrl,
        fetchFn,
      });
      const config = apiClient.configureRequest({
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'GET',
      });
      await apiClient.request(config, url);
      expect(fetchFn).toHaveBeenCalledWith(expected, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'testkey',
        },
        method: 'GET',
      });
    });
  it('should throw on invalid url', async() => {
    const apiClient = new ApiClient({
      authHeader: 'testkey',
      fetchFn,
    });
    const apiClientWithBase = new ApiClient({
      authHeader: 'testkey',
      baseUrl: 'invalidURl',
      fetchFn,
    });
    const config = apiClient.configureRequest({
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'GET',
    });
    await expect(async() => { await apiClient.request(config, 'test'); }).rejects.toThrow();
    await expect(async() => { await apiClient.request(config, 'http://localhost'); }).resolves.not.toThrow();
    await expect(async() => { await apiClientWithBase.request(config, 'test'); }).rejects.toThrow();
  });
});
