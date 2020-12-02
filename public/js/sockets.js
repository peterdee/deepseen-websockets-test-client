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

    connection.on('connect', () => $(`#${anchor}`).empty().append(`
      <div>Sockets: connected!</div>
    `));

    setTimeout(() => connection.emit('message', 'hello'), 2000);

    connection.on('connect_error', (error) => {
      console.log(error.message); // not authorized
      console.log(error.data); // { content: "Please retry later" }
    });
  } catch (error) {
    console.log(error);
    return $(`#${anchor}`).empty().append(`
      <div>Sockets: connection error!</div>
    `);
  }
};
