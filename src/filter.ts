export interface FilterConfiguration {
  objectType?: string;
  filters?: {
    path: string;
    operator: string;
    value: string;
  }[];
}

/**
 * Filter takes a configuration object and returns
 * a querystring for the objects API. The returned
 * querystring always contains at least the ? (opening)
 *
 * @returns string urlquery
 */
export function filter(configuration: FilterConfiguration) {
  const params = new URLSearchParams();
  if (configuration.objectType != undefined) {
    params.append('type', configuration.objectType);
  }

  const filters = configuration.filters?.map(aFilter => {
    const path = aFilter.path.replaceAll('.', '__');
    return `${path}__${aFilter.operator}__${transformSpecialValue(aFilter.value)}`;
  });
  if (filters) {
    for (const aFilter of filters) {
      params.append('data_attr', aFilter);
    }
  }
  return '?' + params.toString();
}

function transformSpecialValue(value: string) {
  const transformedValue = value.match(/\{\{([^}]+)\}\}/)?.[1]?.trim();
  if (transformedValue) {
    if (transformedValue == 'today') {
      return new Date().toISOString().split('T')[0];
    }
  }
  return value;
}
