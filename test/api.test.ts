import { ApiClient, requestApi } from '../src/api';

describe('API should', () => {

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
    })).toEqual({
      body: '{}',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'testkey',
      },
      method: 'POST',
    });

    expect(apiClient2.requestApi({
      body: {},
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })).toEqual({
      body: '{}',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'mijnjwt',
      },
      method: 'POST',
    });
  });

});
