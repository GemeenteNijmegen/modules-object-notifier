import testObject from './test-object.json';
import { objectTransform } from '../src/object.transform';

describe('object should', () => {

  test('transform object', async() => {
    expect(objectTransform({
      email_address: 'record.data.formtaak.data.email',
      personalisation: { test: 'bla' },
    }, testObject),
    ).toEqual({
      email_address: 'w.kremer@nijmegen.nl',
      personalisation: {

      },
    },
    );
  });

  test('transform object', async() => {
    expect(objectTransform({
      email_address: 'record.data.formtaak.data.dossiernummer',
      personalisation: { test: 'bla' },
    }, testObject),
    ).toEqual({
      email_address: '90196930',
      personalisation: {

      },
    },
    );
  });
});