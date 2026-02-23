import { ApiClient } from '../src/api';

describe('API should', () => {

  test('creating a class', async () => {
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
});

describe('API fetches results', () => {
  const fetchFn = async(url: string, config: any) => {
    return new Promise((res, rej) => {
      res({
        ok: true,
        status: 200,
        json: () => { test: 'somevalue ';},
      });
    });
  };
  it('should return ok', async() => {
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
  const fetchFn = async(url: string, config: any) => {
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
  it('should merge results', async() => {
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
    expect(result.length).toBe(20);
  });
});
