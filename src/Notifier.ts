import { ApiClient, notifiyApiClientWithConfig } from './ApiClient';
import { filter, FilterConfiguration } from './filter';
import { MappingConfiguration, objectTransform } from './objectTransform';

interface Configuration {
  objectsToken: string;
  notifyToken: string;
  notifyIssuer: string;
  objectsBaseUrl: string;
  notifyBaseUrl: string;
  objectFilter: FilterConfiguration;
  objectMappings: MappingConfiguration[];
}

export class Notifier {
  private notifyApiClient: ApiClient;
  private objectsApiClient: ApiClient;
  constructor(private config: Configuration) {
    this.objectsApiClient = new ApiClient({ authHeader: `Token ${config.objectsToken}` });
    this.notifyApiClient = notifiyApiClientWithConfig({ issuer: config.notifyIssuer, secret: config.notifyToken });
  }

  async notify() {
    const objectResults = await this.getObjectsWithFilter(this.config.objectFilter);

    for (let objectResult of objectResults) {
      // map object to notify input
      await this.sendNotifications(objectResult);
      // TODO: Update object if successful, log if failed
    }
  }

  private async sendNotifications(objectResult: any) {
    let promises: Promise<any>[] = [];
    for (let mapping of this.config.objectMappings) {
      const mappedObject = objectTransform(mapping, objectResult);
      promises.push(this.notifyRequestPromise(mappedObject));
    }
    const result = await Promise.all(promises);
    return result;
  }

  private notifyRequestPromise(mappedObject: MappingConfiguration) {
    const requestConfig = this.notifyApiClient.configureRequest({
      method: 'POST',
      body: mappedObject,
    });
    if (mappedObject.email_address) {
      return this.notifyApiClient.request(requestConfig, 'email');
    } else if (mappedObject.phone_number) {
      return this.notifyApiClient.request(requestConfig, 'sms');
    } else { throw Error('mapped object must have phone_number or email_address'); }
  }

  private async getObjectsWithFilter(objectFilter: FilterConfiguration) {
    // Get filter from filter
    const objectsFilter = filter(objectFilter);
    // Get objects to notify
    const objectResults = await this.fetchObjects({
      filter: objectsFilter,
      baseUrl: this.config.objectsBaseUrl,
    });
    return objectResults;
  }

  private async fetchObjects(config: {
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
