import { Notifier } from '../src/Notifier';

describe('Notifier notify()', () => {

  /**
   * Regression test for a production incident: `notifyRequestPromise` used to
   * be a synchronous method that `throw`s when a mapped object has neither
   * `email_address` nor `phone_number`. Because that throw happened inside the
   * `for` loop in `addNotificationRequests`, it unwound `notify()` before
   * `promiseTracker.execute()` (the `Promise.allSettled` call) was ever
   * reached - abandoning any notify request already fired for an earlier
   * mapping in that same loop. Nothing ever attached a handler to that
   * dangling request, so when it eventually rejected (e.g. the notify API
   * responding 403), Node raised an unhandled promise rejection, which
   * crashed the whole Lambda process on a warm container - on whatever
   * invocation happened to be running at that moment, unrelated to the
   * mapping bug that caused it.
   *
   * `notifyRequestPromise` now returns a rejected `Promise` instead of
   * throwing synchronously, so a bad mapping is tracked as a normal failure
   * via `Promise.allSettled` and no longer abandons its siblings.
   */
  it('tracks an invalid mapping as a failure without abandoning other in-flight notify requests', async () => {
    const fetchFn = jest.fn();

    // Call 1: the objects API fetch (fetchObjects), returns a single object.
    fetchFn.mockImplementationOnce(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        count: 1,
        results: [{ uuid: 'abc', record: { data: { email: 'foo@example.com' } } }],
        next: null,
        previous: null,
      }),
    }));

    // Call 2: the notify request for the *valid* (email) mapping, succeeds.
    fetchFn.mockImplementationOnce(async () => ({
      ok: true,
      status: 200,
      json: async () => ({}),
    }));

    // Call 3: the object status PATCH, fired because at least one
    // notification for this object succeeded.
    fetchFn.mockImplementationOnce(async () => ({
      ok: true,
      status: 200,
      json: async () => ({}),
    }));

    const notifier = new Notifier({
      objectsToken: 'objects-token',
      notifyToken: 'notify-secret',
      notifyIssuer: 'notify-issuer',
      objectsBaseUrl: 'https://example.com/objects',
      notifyBaseUrl: 'https://example.com/notify',
      objectFilter: {},
      objectMappings: [
        { template_id: 'valid-mapping', personalisation: {}, email_address: 'record.data.email' },
        { template_id: 'invalid-mapping', personalisation: {} }, // maps to neither email_address nor phone_number
      ],
      objectPatchConfiguration: { record: { typeVersion: 1, data: {}, startAt: '' } },
      fetchFn,
    });

    // notify() no longer rejects: the invalid mapping becomes a tracked
    // failure alongside the valid mapping's tracked success.
    const analyzer = await notifier.notify();

    expect(analyzer!.totalCount).toBe(2);
    expect(analyzer!.successCount).toBe(1);
    expect(analyzer!.failureCount).toBe(1);
    expect(analyzer!.failures[0].reason.message).toBe('mapped object must have phone_number or email_address');

    // The valid mapping's notify request was fired and awaited (not
    // abandoned), and the object status update ran because that
    // notification succeeded.
    expect(fetchFn).toHaveBeenCalledTimes(3);
  });

});
