import { filter } from '../src/filter';

describe('filters should', () => {

  test('return empty querystring with empty config', async () => {
    expect(filter({})).toBe('?');
  });
  test('Return correct value with a single filter', async () => {
    expect(filter({
      objectType: '7D365829-D0A2-4541-9621-228125BDAF6C',
      filters: [
        {
          path: 'some.object.path',
          operator: 'lte',
          value: 'somevalue',
        },
      ],
    })).toBe('?type=7D365829-D0A2-4541-9621-228125BDAF6C&data_attr=some__object__path__lte__somevalue');
  });
  test('return correct value with multiple filters', async () => {
    expect(filter({
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
    })).toBe('?type=https%3A%2F%2Fmijn-services.accp.nijmegen.nl%2Fobjecttypes%2Fapi%2Fv2%2Fobjecttypes%2F6df21057-e07c-4909-8933-d70b79cfd15e&data_attr=formtaak__data__reminder_verzonden__exact__nee&data_attr=status__exact__open');

    expect(filter({
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
    })).toBe('?data_attr=formtaak__data__reminder_verzonden__exact__nee&data_attr=status__exact__open');

    expect(filter({
      objectType: '6df21057-e07c-4909-8933-d70b79cfd15e',
    })).toBe('?type=6df21057-e07c-4909-8933-d70b79cfd15e');
  });
});
