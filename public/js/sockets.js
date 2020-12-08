const EVENTS = {
  INCOMING: {
    clientTypeAlreadyOnline: 'CLIENT_TYPE_IS_ALREADY_ONLINE',
    connect: 'connect',
    internalServerError: 'INTERNAL_SERVER_ERROR',
  },
  OUTGOING: {
    PLAY_NEXT: 'PLAY_NEXT',
    PLAY_PAUSE: 'PLAY_PAUSE',
    PLAY_PREVIOUS: 'PLAY_PREVIOUS',
    STOP_PLAYBACK: 'STOP_PLAYBACK',
  },
  CLIENT_DISCONNECTED: 'CLIENT_DISCONNECTED',
  NEW_CLIENT_CONNECTED: 'NEW_CLIENT_CONNECTED',
  ROOM_STATUS: 'ROOM_STATUS',
  UPDATE_CURRENT_TRACK: 'UPDATE_CURRENT_TRACK',
  UPDATE_MUTE: 'UPDATE_MUTE',
  UPDATE_PLAYBACK_STATUS: 'UPDATE_PLAYBACK_STATUS',
  UPDATE_VOLUME: 'UPDATE_VOLUME',
};

let MUTED = false;

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

    connection.on(EVENTS.INCOMING.connect, () => {
      $(`#${anchor}`).empty().append(`
        <div>Sockets: connected!</div>
        <button
          id="previous"
          type="button"
        >
          Previous
        </button>
        <button
          id="stop"
          type="button"
        >
          Stop
        </button>
        <button
          id="play"
          type="button"
        >
          Play / Pause
        </button>
        <button
          id="next"
          type="button"
        >
          Next
        </button>
        <div id="desktop-status">
          Desktop app is not connected!
        </div>
        <div id="web-status">
          Web app is not connected!
        </div>
        <div id="track"></div>
        <div>
          <input
            id="volume"
            max="100"
            min="0"
            type="range"
          />
          <button
            id="mute"
            type="button"
          >
            ${MUTED ? 'Unmute' : 'Mute'}
          </button>
        </div>
        <div id="progress"></div>
      `);

      desktopStatus = $('#desktop-status');
      webStatus = $('#web-status');

      $('#next').on('click', () => connection.emit(EVENTS.OUTGOING.PLAY_NEXT));
      $('#play').on('click', () => connection.emit(EVENTS.OUTGOING.PLAY_PAUSE));
      $('#previous').on('click', () => connection.emit(EVENTS.OUTGOING.PLAY_PREVIOUS));
      $('#stop').on('click', () => connection.emit(EVENTS.OUTGOING.STOP_PLAYBACK));
      
      $('#mute').on('click', () => connection.emit(
        EVENTS.UPDATE_MUTE,
        {
          isMuted: !MUTED,
        },
      ));
      $('#volume').on('change', (event) => {
        MUTED = !MUTED;
        return connection.emit(
          EVENTS.UPDATE_VOLUME,
          { 
            volume: event.target.value,
          },
        );
      });
    });

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
          <div>Sockets: something went wrong! Disconnecting...</div>
        `);
        return connection.disconnect();
      },
    );

    connection.on(
      EVENTS.NEW_CLIENT_CONNECTED,
      (data) => {
        const { client = '' } = data;
        $('#notifications').empty().append(`
          <div>${client.toUpperCase()} connected!</div>
        `);

        if (client === 'desktop') {
          $('#desktop-status').empty().append(`
            <div>Desktop app is connected!</div>
          `);
        }
        return setTimeout(() => $(`#notifications`).empty(), 5000);
      },
    );

    connection.on(
      EVENTS.CLIENT_DISCONNECTED,
      (data) => {
        const { client = '' } = data;
        $('#notifications').empty().append(`
          <div>${data.client.toUpperCase()} disconnected!</div>
        `);

        if (client === 'desktop') {
          $('#desktop-status').empty().append(`
            <div>Desktop app is not connected!</div>
          `);
        }
        return setTimeout(() => $(`#notifications`).empty(), 5000);
      },
    );

    connection.on(
      EVENTS.ROOM_STATUS,
      (data) => {
        const { room = [] } = data;
        if (Array.isArray(room) && room.length > 0) {
          const filtered = room.filter(({ client = '' }) => client === 'desktop');
          if (filtered.length > 0) {
            $('#desktop-status').empty().append(`
              <div>Desktop app is connected!</div>
            `);
          }
        }
      },
    );

    // on track change
    connection.on(
      EVENTS.UPDATE_CURRENT_TRACK,
      (data) => {
        const { track = {} } = data;
        $('#track').empty().append(`
          <div>${track.name} (${track.duration})</div>
        `);
      },
    );

    // on volume update
    connection.on(
      EVENTS.UPDATE_VOLUME,
      (data) => $(`#volume`).val(String(data.volume * 100)),
    );

    // on mute update
    connection.on(
      EVENTS.UPDATE_MUTE,
      (data) => {
        const { isMuted = false } = data;
        MUTED = isMuted;
      },
    );

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
