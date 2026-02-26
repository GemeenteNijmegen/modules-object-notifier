import { FilterConfiguration } from './src/filter';
import { MappingConfiguration } from './src/objectTransform';
import Notifier from './src/index';
import 'dotenv/config';
import { ObjectPatchConfiguration } from './src/Notifier';
import testObject from './test/test-object.json';


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

const objectPatchConfiguration: ObjectPatchConfiguration = {
  record: {
    typeVersion: 7,
    data: {
      formtaak: {
        data: {
          reminder_verzonden: 'ja',
        },
      },
    },
    startAt: new Date().toISOString().substring(0, 'YYYY-MM-DD'.length),
  }
};


const fetchFn = (process.env.DEBUG!) ? async (url: string, _config: any) => {
  return new Promise((res, _rej) => {
    console.debug('would call ', url);
    res({
      ok: true,
      status: 200,
      json: () => {
        return {
          results: [testObject],
        };
      },
    });
  });
} : fetch;

(async () => {
  console.debug('running script');
  await new Notifier({
    objectFilter,
    objectMappings: [emailObjectMapping, phoneObjectMapping],
    objectPatchConfiguration,
    objectsToken: process.env.OBJECTS_TOKEN!,
    objectsBaseUrl: process.env.OBJECTS_BASEURL!,
    notifyBaseUrl: process.env.NOTIFY_BASEURL!,
    notifyToken: process.env.NOTIFY_TOKEN!,
    notifyIssuer: process.env.NOTIFY_ISS!,
    fetchFn,
  }).notify();
})();
