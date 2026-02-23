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
  private notifyApiClient: ApiClient;
  private objectsApiClient: ApiClient;
  constructor(private config: configuration) { 
    this.objectsApiClient = new ApiClient({ authHeader: `Token ${config.objectsToken}` });
    this.notifyApiClient = new ApiClient({ authHeader: `Token ${config.notifyToken}` });
  }

  async notify() {
    // Get filter from filter
    const objectsFilter = filter(this.config.objectFilter);
    // Get objects to notify
    const objectResults = await this.getObjects({
      filter: objectsFilter,
      baseUrl: this.config.objectsBaseUrl,
    });

    for (let objectResult of objectResults) {
      // map object to notify input
      const fullMapping = objectTransform(this.config.objectMapping, objectResult);
      let { phone_number, ...emailMapping } = fullMapping;
      let { email_address, ...phoneMapping } = fullMapping;
      console.log(objectResult.uuid, phoneMapping, emailMapping);
      // TODO: Call notify
      const requestConfigMail = this.objectsApiClient.configureRequest({
        method: 'POST',
        body: JSON.stringify(emailMapping),
      });
      const requestConfigPhone = this.objectsApiClient.configureRequest({
        method: 'POST',
        body: JSON.stringify(phoneMapping),
      });
      const result = await Promise.all([
        this.notifyApiClient.request(requestConfigMail, `${this.config.notifyBaseUrl}email`),
        this.notifyApiClient.request(requestConfigPhone, `${this.config.notifyBaseUrl}sms`)
      ]);
      console.log(result);
      
      // TODO: Update object
    }
  }

  private async getObjects(config: {
    filter: string;
    baseUrl: string;
  }) {
    const requestConfig = this.objectsApiClient.configureRequest({
      method: 'GET',
    });
    const objectResults = await this.objectsApiClient.request(requestConfig, `${config.baseUrl}${config.filter}`);
    return objectResults;
  }
}
