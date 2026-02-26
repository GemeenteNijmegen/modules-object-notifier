# Object notifications for Open objecten

This module allows for sending notifications/messages based on specific criteria.
It is able to:
- Connect to 'Open objecten'
- Retrieve a list of objects based on specific criteria
- Connect to NotifyNL
- Send notifications using specific fields from the object (for email, sms) and
  personalisation.

## Configuration
When called, the module will use the provided configuration to retrieve one or 
more lists of objects and send notifications based on the provided criteria.

Example configuration (json):
```json
[{
  "objectType": "<someuuid>",
  "filters": [
    {
      "path": "some.object.path",
      "operator": "lte",
      "value": "somevalue"
    }
  ]
}]
```

### Special values
For the value key, you can use {{today}} as a value to use today's date. 

Example usage:

```ts
import { Notifier } from '@gemeentenijmegen/object-notifier';

const result = await Notifier.notify(config, dryrun: boolean);
// result = { succesful: 10, failed: 2 }
```

### Example
To run the example:
- Set .env (copy .env.example and add values)
- run example `npx ts-node example.ts`

### Sequence flow
This flow describes the happy path. Especially in the two external connections, error handling needs to be added. Most naïvely, this is called regularly (daily) so
many errors may resolve automatically. Some type of retry mechanism is probably required.

```mermaid
sequenceDiagram
    autonumber
    participant Notifier
    participant FilterConstructor as Filter Constructor
    participant ObjectsConnector as Objects-API Connector
    participant ObjectsAPI as External API 'objects'
    participant DataTransformer as Data Transformer
    participant Notifier
    participant NotifyNLConnector as NotifyNL Connector
    participant NotifyNL as External API 'notifyNL'

    Notifier->>FilterConstructor: request filter
    FilterConstructor-->>Notifier: URL filter
    
    Notifier->>ObjectsConnector: fetch objects
    ObjectsConnector->>ObjectsAPI: query with filter
    ObjectsAPI-->>ObjectsConnector: objects data
    ObjectsConnector-->>Notifier: raw objects
    
    Notifier->>DataTransformer: transform data
    DataTransformer-->>Notifier: transformed data
    
    Notifier->>Notifier: send notification
    Notifier->>NotifyNLConnector: notification payload
    NotifyNLConnector->>NotifyNL: send notification
    NotifyNL-->>NotifyNLConnector: success response
    NotifyNLConnector-->>Notifier: success
    Notifier-->>Notifier: success
    
    Notifier->>ObjectsConnector: update notified_at
    ObjectsConnector->>ObjectsAPI: update notified_at
    ObjectsAPI-->>ObjectsConnector: update confirmed
    ObjectsConnector-->>Notifier: update confirmed
```
