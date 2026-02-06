import { ApiClient, requestApi } from '../src/api';

describe('API should', () => {
  test('connect to API and get data', async () => {
    const requestData = await requestApi({
      url: 'https://api.notifynl.nl/v2/notifications/email',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer encoded_jwt_token',
      },
      body: { test: 'data' },
    });
    expect(requestData).toEqual({
      url: 'https://api.notifynl.nl/v2/notifications/email',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer encoded_jwt_token',
      },
      body: JSON.stringify({
      }),
    });
  });

  test('creating a class', async () => {
    const apiClient = new ApiClient('testkey');
    const apiClient2 = new ApiClient('mijnjwt');
    expect(apiClient).toBeTruthy();

    expect(apiClient.requestApi({
      body: {},
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      url: 'https://example.com',
    })).toEqual({
      body: '{}',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'testkey',
      },
      method: 'POST',
      url: 'https://example.com',
    });
    expect(apiClient2.requestApi({
      body: {},
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      url: 'https://example.com',
    })).toEqual({
      body: '{}',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'mijnjwt',
      },
      method: 'POST',
      url: 'https://example.com',
    });
  });

});
