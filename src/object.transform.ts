interface configuration {
  email_address: string;
  personalisation:{
    // [key: string]: string;
    // 'klant.voornaam': string;
    // "klant.voorvoegselAchternaam": string,
    // "klant.achternaam": string,
    // "taak.heeft_verloopdatum": string,
    'taak.verloopdatum': string;
    'taak.periode': string;
  };
}

export function objectTransform(configuration: configuration, object: any): configuration {
  console.log(configuration);
  const date = stringToDate(getByPath(object, configuration.personalisation['taak.verloopdatum']));
  const periode = periodeToDate(getByPath(object, configuration.personalisation['taak.periode']));
  return {
    email_address: getByPath(object, configuration.email_address),
    personalisation: {
    //   'klant.voornaam': getByPath(object, configuration.personalisation['klant.voornaam']),
      // "klant.voorvoegselAchternaam": "van de",
      // "klant.achternaam": "Kamp",
    //   "taak.heeft_verloopdatum": getByPath(object, configuration.personalisation["taak.heeft_verloopdatum"]),
      'taak.verloopdatum': formatDatetime(date, {
        dateStyle: 'long',
      }),
      'taak.periode': formatDatetime(periode, {
        month: 'long',
        year: 'numeric',
      }),
    },
  };
}

function getByPath(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

function stringToDate(dateString:string) {
  const normalizedDate = dateString.split(' ').join('T')+ 'Z';
  return new Date(normalizedDate);
}

function formatDatetime(date: Date, dateTimeFormat: Intl.DateTimeFormatOptions) {
  const dateTime = new Intl.DateTimeFormat('nl-NL', dateTimeFormat).format(date);
  return dateTime;
}

function periodeToDate(periodeString:string) {
  const year = Number(periodeString.slice(0, 4));
  const month = Number(periodeString.slice(4, 6))-1;
  const date = new Date (year, month, 1);
  return date;
}