const EVENTS = {
  INCOMING: {
    clientTypeAlreadyOnline: 'CLIENT_TYPE_IS_ALREADY_ONLINE',
    connect: 'connect',
    internalServerError: 'INTERNAL_SERVER_ERROR',
  },
};

/**
 * Connect to the Websockets server
 * @param {string} anchor - anchor element
 * @param {string} token - token string
 * @returns {Promise<void>}
 */
const sockets = async (anchor = '', token = '') => {
  $(`#${anchor}`).empty().append(`
    <div>Sockets: connecting...</div>
  `);

  try {
    const connection = await io.connect(WS_ORIGIN, {
      query: {
        token,
      },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      withCredentials: true,
    });

    connection.on(EVENTS.INCOMING.connect, () => $(`#${anchor}`).empty().append(`
      <div>Sockets: connected!</div>
    `));

    connection.on(
      EVENTS.INCOMING.clientTypeAlreadyOnline,
      () => {
        $(`#${anchor}`).empty().append(`
          <div>Sockets: client type is already online!</div>
        `);
        return connection.disconnect();
      },
    );

    connection.on(
      EVENTS.INCOMING.internalServerError,
      () => {
        $(`#${anchor}`).empty().append(`
          <div>Sockets: something went wrong!</div>
        `);
        return connection.disconnect();
      },
    );

    setTimeout(() => connection.emit('message', 'hello'), 2000);

    connection.on('connect_error', (error) => {
      console.log(error.message); // error info
      console.log(error.data); // error data
    });
  } catch (error) {
    console.log(error);
    return $(`#${anchor}`).empty().append(`
      <div>Sockets: connection error!</div>
    `);
  }
};
