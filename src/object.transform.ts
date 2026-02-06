interface mappingConfiguration {
  /**
   * The path (dot-separated, e.g. `path.to.my.key`) to the key to map
   */
  path: string;
  /**
   * The type of key. We only support date for now
   */
  type: 'date';
  /**
   * The input format. Two supported formats for now.
   */
  inputFormat: 'yyyy-mm-dd hh:mm:ss' | 'YYYYMM';
  /**
   * The date output format, a string value with this format will be mapped.
   */
  outputFormat: Intl.DateTimeFormatOptions;
}

interface configuration {
  email_address: string;
  personalisation: {
    /**
     * If the value is a string, we assume there's a direct mapping of the value
     * If an object is provided,
     */
    [key: string]: string | mappingConfiguration;
  };
}


export function objectTransform(configuration: configuration, object: any): configuration {
  let personalisation: { [key: string]: string } = {};
  for (let key in configuration.personalisation) {
    let objectValue;
    if (typeof configuration.personalisation[key] === 'string') {
      objectValue = getByPath(object, configuration.personalisation[key]);
    } else {
      objectValue = dateStringMappedObjectValue(configuration.personalisation[key], object);
    }
    personalisation[key] = objectValue;
  }
  return {
    email_address: getByPath(object, configuration.email_address),
    personalisation: personalisation,
  };
}

function dateStringMappedObjectValue(configuration: mappingConfiguration, object: any) {
  if (configuration.type === 'date') {
    let objectDate: Date;
    if (configuration.inputFormat === 'yyyy-mm-dd hh:mm:ss') {
      objectDate = stringToDate(getByPath(object, configuration.path));
    } else if (configuration.inputFormat === 'YYYYMM') {
      objectDate = periodeToDate(getByPath(object, configuration.path));
    } else {
      throw new Error('Invalid input format');
    }
    return formatDatetime(objectDate, configuration.outputFormat);
  } else {
    throw new Error('Invalid input type');
  }
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
