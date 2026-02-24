import { FilterConfiguration } from './src/filter';
import { MappingConfiguration } from './src/objectTransform';
import Notifier from './src/index';
import 'dotenv/config';

const objectFilter: FilterConfiguration = {
  objectType: process.env.OBJECT_TYPE!,
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

const emailObjectMapping: MappingConfiguration = {
  template_id: process.env.EMAIL_TEMPLATE_ID!,
  email_address: 'record.data.formtaak.data.email',
  personalisation: {
    'formulier': 'record.data.formtaak.formulier.value',
    'klant.voornaam': 'record.data.formtaak.data.voorletter',
    'klant.voorvoegselAchternaam': 'record.data.formtaak.data.voorvoegsel',
    'klant.achternaam': 'record.data.formtaak.data.achternaam',
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

const phoneObjectMapping: MappingConfiguration = {
  template_id: process.env.PHONE_TEMPLATE_ID!,
  phone_number: 'record.data.formtaak.data.telefoon',
  personalisation: {
    'formulier': 'record.data.formtaak.formulier.value',
    'klant.voornaam': 'record.data.formtaak.data.voorletter',
    'klant.voorvoegselAchternaam': 'record.data.formtaak.data.voorvoegsel',
    'klant.achternaam': 'record.data.formtaak.data.achternaam',
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
  objectMappings: [emailObjectMapping, phoneObjectMapping],
  objectsToken: process.env.OBJECTS_TOKEN!,
  objectsBaseUrl: process.env.OBJECTS_BASEURL!,
  notifyBaseUrl: process.env.NOTIFY_BASEURL!,
  notifyToken: process.env.NOTIFY_TOKEN!,
  notifyIssuer: process.env.NOTIFY_ISS!,
  }).notify();
})();
