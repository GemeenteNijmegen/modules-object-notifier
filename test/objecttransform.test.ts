import testObject from './test-object.json';
import { objectTransform } from '../src/object.transform';

describe('object should', () => {

  test('transform object', async() => {
    const output = objectTransform({
      email_address: 'record.data.formtaak.data.email',
      personalisation: {
        'taak.verloopdatum': 'record.data.verloopdatum',
        'taak.periode': 'record.data.formtaak.data.periodenummer',
      },
    }, testObject);
    expect(output).toEqual({
      email_address: 'w.kremer@nijmegen.nl',
      personalisation: {
        'taak.verloopdatum': '1 november 2025',
        'taak.periode': 'januari 2026',
      },
    },
    );
  });

  test('transform object', async() => {
    expect(objectTransform({
      email_address: 'record.data.formtaak.data.dossiernummer',
      personalisation: {
        'taak.verloopdatum': 'record.data.verloopdatum',
        'taak.periode': 'record.data.formtaak.data.periodenummer',
      },
    }, testObject),
    ).toEqual({
      email_address: '90196930',
      personalisation: {
        'taak.verloopdatum': '1 november 2025',
        'taak.periode': 'januari 2026',
      },
    },
    );
  });
});