import { filterConfiguration } from './src/filter';
import { mappingConfiguration } from './src/object.transform';
import Notifier from './src/index';
import 'dotenv/config';

const objectFilter: filterConfiguration = {
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
};

const objectMapping: mappingConfiguration = {
  email_address: 'record.data.formtaak.data.email',
  phone_number: 'record.data.formtaak.data.telefoon',
  personalisation: {
    'formulier': 'record.data.formtaak.formulier.value',
    'taak.verloopdatum': {
      path: 'record.data.verloopdatum',
      type: 'date',
      inputFormat: 'yyyy-mm-dd hh:mm:ss',
      outputFormat: {
        dateStyle: 'long',
      },
    },
    'taak.periode': {
      path: 'record.data.formtaak.data.periodenummer',
      type: 'date',
      inputFormat: 'YYYYMM',
      outputFormat: {
        month: 'long',
        year: 'numeric',
      },
    },
  },
};

(async () => {
  console.debug('running script');
  await new Notifier({
  objectFilter,
  objectMapping,
  objectsToken: process.env.OBJECTS_TOKEN!,
  objectsBaseUrl: process.env.OBJECTS_BASEURL!,
  notifyBaseUrl: process.env.NOTIFY_BASEURL!,
  notifyToken: process.env.NOTIFY_TOKEN!
  }).notify();
})();
