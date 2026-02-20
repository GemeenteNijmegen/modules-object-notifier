import { ApiClient } from './api';
import { filter, filterConfiguration } from './filter';
import { mappingConfiguration, objectTransform } from './object.transform';

interface configuration {
  objectsToken: string;
  notifyToken: string;
  objectsBaseUrl: string;
  notifyBaseUrl: string;
  objectFilter: filterConfiguration;
  objectMapping: mappingConfiguration;
}

export class Notifier {
  constructor(private config: configuration) { }

  async notify() {
    // Get filter from filter
    const objectsFilter = filter(this.config.objectFilter);
    // Get objects to notify
    const objectResults = await this.getObjects({
      filter: objectsFilter,
      baseUrl: this.config.objectsBaseUrl,
      token: this.config.objectsToken
    });

    for (let result of objectResults) {
      // map object to notify input
      const mapping = objectTransform(this.config.objectMapping, result);
      // TODO: Call notify
      console.log(mapping);
      // TODO: Update object
    }
  }

  private async getObjects(config: {
    filter: string,
    token: string,
    baseUrl: string
  }) {
    const objectsApi = new ApiClient({ authHeader: `Token ${config.token}` });
    const requestConfig = objectsApi.configureRequest({
      method: 'GET',
    });
    const objectResults = await objectsApi.request(requestConfig, `${config.baseUrl}${config.filter}`);
    return objectResults;
  }
}
