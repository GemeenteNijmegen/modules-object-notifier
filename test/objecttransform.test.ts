import testObject from './test-object.json';
import { objectTransform } from '../src/object.transform';

describe('object should', () => {

  test('transform object', async() => {
    const output = objectTransform({
      email_address: 'record.data.formtaak.data.email',
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
    }, testObject);
    expect(output).toEqual({
      email_address: 'test.test@nijmegen.nl',
      personalisation: {
        'formulier': 'https://formulier.accp.nijmegen.nl/statusformulier?initial_data_reference=23afc432-6d7e-4af4-9a1e-0447285e0384',
        'taak.verloopdatum': '1 november 2025',
        'taak.periode': 'januari 2026',
      },
    },
    );
  });

  // test('transform object', async() => {
  //   expect(objectTransform({
  //     email_address: 'record.data.formtaak.data.dossiernummer',
  //     personalisation: {
  //       'taak.verloopdatum': 'record.data.verloopdatum',
  //       'taak.periode': 'record.data.formtaak.data.periodenummer',
  //     },
  //   }, testObject),
  //   ).toEqual({
  //     email_address: '90196930',
  //     personalisation: {
  //       'taak.verloopdatum': '1 november 2025',
  //       'taak.periode': 'januari 2026',
  //     },
  //   },
  //   );
  // });
});