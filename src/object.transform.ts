interface configuration {
  email_address: string;
  personalisation:{
    [key: string]: string;
  };
}

export function objectTransform(configuration: configuration, object: any): configuration {
  return {
    email_address: getByPath(object, configuration.email_address),
    personalisation: {

    },
  };
}

function getByPath(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}