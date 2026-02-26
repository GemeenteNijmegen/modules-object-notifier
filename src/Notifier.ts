import { ApiClient, notifiyApiClientWithConfig, objectsApiClientWithConfig } from './ApiClient';
import { filter, FilterConfiguration } from './filter';
import { MappingConfiguration, objectTransform } from './objectTransform';
import { PromiseMetadata, PromiseTracker, TrackedResultsAnalyzer } from './PromiseTracker';
import testObject from '../test/test-object.json';

interface Configuration {
  objectsToken: string;
  notifyToken: string;
  notifyIssuer: string;
  objectsBaseUrl: string;
  notifyBaseUrl: string;
  objectFilter: FilterConfiguration;
  objectMappings: MappingConfiguration[];
}

interface NotificationMetadata extends PromiseMetadata {
  objectId: string;
}

const fetchFn = (process.env.DEBUG!) ? async (url: string, _config: any) => {
  return new Promise((res, _rej) => {
    console.debug('would call ', url);
    res({
      ok: true,
      status: 200,
      json: () => {
        return {
          results: [testObject],
        };
      },
    });
  });
} : fetch;

export class Notifier {
  private notifyApiClient: ApiClient;
  private objectsApiClient: ApiClient;
  constructor(private config: Configuration) {
    this.objectsApiClient = objectsApiClientWithConfig({ token: config.objectsToken, fetchFn });
    this.notifyApiClient = notifiyApiClientWithConfig({ issuer: config.notifyIssuer, secret: config.notifyToken, fetchFn });
  }

  async notify() {
    const objectResults = await this.getObjectsWithFilter(this.config.objectFilter);
    const promises = new PromiseTracker<NotificationMetadata>();
    if (!objectResults) {
      console.log('No objects found, returning');
      return;
    }
    for (let objectResult of objectResults) {
      // map object to notify input
      this.addNotificationRequests(objectResult, promises);
    }
    const result = await promises.execute();
    const analyzer = new TrackedResultsAnalyzer(result);
    console.log(analyzer.summary());
    const groupedById = analyzer.groupBy('id');
    for (let objectId of groupedById.keys()) {
      const resultForId = groupedById.get(objectId)!;
      const success = resultForId.filter(val => val.success);
      console.log(`Notifications for ${objectId} sent.`);
      if (success.length >= 1) {
        // At least one notification succeeded for this object, mark as notified
        await this.updateObjectStatus(objectId);
        if (success.length < resultForId.length) {
          console.warn(`Some notifications for ${objectId} failed. Marked as notified because at least one succeeded.`);
        } else {
          console.log(`All notifications for ${objectId} succeeded. Marked as notified.`);
        }
      }
      if (success.length == 0) {
        console.warn(`All notifications for ${objectId} failed. Not marked as notified.`);
      }
    }
  }

  async updateObjectStatus(objectId: string) {
    const requestConfig = this.objectsApiClient.configureRequest({
      method: 'PATCH',
      body: {
        record: {
          typeVersion: 7,
          data: {
            formtaak: {
              data: {
                reminder_verzonden: 'ja',
              },
            },
          },
          startAt: '2026-02-24',
        },
      },
    });
    await this.objectsApiClient.request(requestConfig, `${this.config.objectsBaseUrl}/${objectId}`);
  }

  private addNotificationRequests(objectResult: any, promises: PromiseTracker) {
    for (let mapping of this.config.objectMappings) {
      const mappedObject = objectTransform(mapping, objectResult);
      promises.add(this.notifyRequestPromise(mappedObject), { id: objectResult.uuid });
    }
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
