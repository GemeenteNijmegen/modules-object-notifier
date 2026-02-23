interface personalisationMapping {
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

export interface mappingConfiguration {
  email_address: string;
  phone_number: string;
  personalisation: {
    /**
     * If the value is a string, we assume there's a direct mapping of the value
     * If an object is provided,
     */
    [key: string]: string | personalisationMapping;
  };
}


export function objectTransform(configuration: mappingConfiguration, object: any): mappingConfiguration {
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
    phone_number: getByPath(object, configuration.phone_number),
    personalisation: personalisation,
  };
}

function dateStringMappedObjectValue(configuration: personalisationMapping, object: any) {
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

/**
 * Convert a datetime string to
 * @param dateString string in the format 'YYYY-MM-DD HH:MM:SS'
 * @returns {Date}
 */
function stringToDate(dateString: string) {
  if (isNaN(Date.parse(dateString))) {
    throw Error('Value is not a date-like string');
  }
  const normalizedDate = dateString.split(' ').join('T')+ 'Z';
  return new Date(normalizedDate);
}

/**
 * Convert a periodenummer to date
 * @param periodeString string in the format 'YYYYMM'
 * @returns {Date}
 */
function periodeToDate(periodeString: string) {
  if (isNaN(Date.parse(periodeString))) {
    throw Error('Value is not a date-like string');
  }
  const year = Number(periodeString.slice(0, 'YYYY'.length));
  const month = Number(periodeString.slice(4, 'YYYYMM'.length))-1; // Months are zero-indexed
  const date = new Date (year, month, 1);
  return date;
}

function formatDatetime(date: Date, dateTimeFormat: Intl.DateTimeFormatOptions) {
  const dateTime = new Intl.DateTimeFormat('nl-NL', dateTimeFormat).format(date);
  return dateTime;
}

