interface configuration {
  email_address: string;
  personalisation:{
    [key: string]: string | {
      path: string;
      type: 'date';
      inputFormat: 'yyyy-mm-dd hh:mm:ss' | 'YYYYMM';
      outputFormat: Intl.DateTimeFormatOptions;
    };
  };
}

// Idee voor nieuwe configuration interface
// interface configuration {
//   email_address: string;
//   personalisation:{
//     [key: string]: string | {
//       path: string,
//       type?: 'date',
//       inputFormat: 'yyyy-mm-dd hh:mm:ss' | 'YYYYMM',
//       outputFormat: Intl.DateTimeFormatOptions`
//     };
//   };
// }

export function objectTransform(configuration: configuration, object: any): configuration {
  let personalisation: { [key: string]: string } = {};
  for (let key in configuration.personalisation) {
    let objectValue;
    console.log(configuration.personalisation[key]);
    if (typeof configuration.personalisation[key] === 'string') {
      objectValue = getByPath(object, configuration.personalisation[key]);
    } else {
      if (configuration.personalisation[key].type === 'date') {
        let objectDate: Date;
        if (configuration.personalisation[key].inputFormat === 'yyyy-mm-dd hh:mm:ss') {
          objectDate = stringToDate(getByPath(object, configuration.personalisation[key].path));
        } else if (configuration.personalisation[key].inputFormat === 'YYYYMM') {
          objectDate = periodeToDate(getByPath(object, configuration.personalisation[key].path));
        } else {
          throw new Error('Invalid input format');
        }
        objectValue = formatDatetime(objectDate, configuration.personalisation[key].outputFormat);

      }
    }
    personalisation[key] = objectValue;
  }
  return {
    email_address: getByPath(object, configuration.email_address),
    personalisation: personalisation,
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
