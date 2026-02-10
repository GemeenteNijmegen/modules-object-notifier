import { describeIntegration } from './describeIntegration';
import { ApiClient } from '../src/api';
import { filter } from '../src/filter';

describeIntegration('API integration test', () => {

  test('Connection to Objects API succeeds', async () => {
    const apiClient = new ApiClient('Token d0547cd50b5e358e367d402f374bd7ea1edbd5e1');
    const request = apiClient.configureRequest({
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await apiClient.request(request, 'https://mijn-services.accp.nijmegen.nl/objects/api/v2/objects/f4437704-f2e3-4968-8b40-4aa01784f49b');
    // expect(result).toHaveProperty('url');
  });

  test('combination of filter and Object API', async () => {
    const objectFilter = filter({
      objectType: 'https://mijn-services.accp.nijmegen.nl/objecttypes/api/v2/objecttypes/6df21057-e07c-4909-8933-d70b79cfd15e',
      filters: [
        {
          path: 'formtaak.data.reminder_verzonden',
          operator: 'exact',
          value: 'nee',
        },
        {
          path: 'status',
          operator: 'exact',
          value: 'open',
        },
      ],
    });
    expect (`https://mijn-services.accp.nijmegen.nl/objects/api/v2/objects${objectFilter}`).toBe('https://mijn-services.accp.nijmegen.nl/objects/api/v2/objects?type=https%3A%2F%2Fmijn-services.accp.nijmegen.nl%2Fobjecttypes%2Fapi%2Fv2%2Fobjecttypes%2F6df21057-e07c-4909-8933-d70b79cfd15e&data_attr=formtaak__data__reminder_verzonden__exact__nee&data_attr=status__exact__open');

    const apiClient = new ApiClient('Token d0547cd50b5e358e367d402f374bd7ea1edbd5e1');
    const request = apiClient.configureRequest({
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await apiClient.request(request, `https://mijn-services.accp.nijmegen.nl/objects/api/v2/objects${objectFilter}`);
    expect(result).toHaveProperty('count');
    console.debug(result);
  });

});