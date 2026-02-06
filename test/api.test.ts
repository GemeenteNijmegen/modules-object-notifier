import { requestApi } from '../src/api';

describe('API should', () => {
  test('connect to API and get data', async() => {
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
});