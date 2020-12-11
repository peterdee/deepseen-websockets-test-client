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
  },
  CLIENT_DISCONNECTED: 'CLIENT_DISCONNECTED',
  CONNECT_ERROR: 'connect_error',
  DESKTOP_INIT: 'DESKTOP_INIT',
  NEW_CLIENT_CONNECTED: 'NEW_CLIENT_CONNECTED',
  ROOM_STATUS: 'ROOM_STATUS',
  STOP_PLAYBACK: 'STOP_PLAYBACK',
  UPDATE_CURRENT_TRACK: 'UPDATE_CURRENT_TRACK',
  UPDATE_MUTE: 'UPDATE_MUTE',
  UPDATE_PLAYBACK_STATE: 'UPDATE_PLAYBACK_STATE',
  UPDATE_PROGRESS: 'UPDATE_PROGRESS',
  UPDATE_VOLUME: 'UPDATE_VOLUME',
};

let MUTED = false;
let PAUSED = true;
let TIMER = null;
let TRACK = {};

const options = {
  elapsed: 0,
  muted: false,
  paused: true,
  timer: null,
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
          Volume:
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
            Mute
          </button>
        </div>
        <div>
          Progress:
          <input
            id="progress"
            max="200"
            min="0"
            step="1"
            style="width: 300px;"
            type="range"
          />
        </div>
      `);

      desktopStatus = $('#desktop-status');
      webStatus = $('#web-status');

      $('#next').on('click', () => connection.emit(EVENTS.OUTGOING.PLAY_NEXT));
      $('#play').on('click', () => connection.emit(EVENTS.OUTGOING.PLAY_PAUSE));
      $('#previous').on('click', () => connection.emit(EVENTS.OUTGOING.PLAY_PREVIOUS));
      $('#stop').on('click', () => connection.emit(EVENTS.STOP_PLAYBACK));
      
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
      $('#progress').on('change', (event) => {
        const { value = 0 } = event.target;
        options.elapsed = (TRACK.duration / 200) * value;
        connection.emit(
          EVENTS.UPDATE_PROGRESS,
          { 
            progress: value,
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

    // get initial desktop state
    connection.on(
      EVENTS.DESKTOP_INIT,
      (data) => {
        const {
          elapsed = 0,
          isMuted = false,
          isPlaying = false,
          progress = 0,
          track = {},
          volume = 0,
        } = data;
        options.elapsed = elapsed;
        options.muted = isMuted;
        options.paused = !isPlaying;
        TRACK = track;
        console.log(data)
        $(`#progress`).val(String(progress));
        $('#track').empty().append(`
          <div>${TRACK.name} (${TRACK.duration})</div>
        `);
        $(`#volume`).val(String(volume * 100));
      },
    );

    // get room status
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
        TRACK = track;
        $('#progress').val(0);
        $('#track').empty().append(`
          <div>${track.name} (${track.duration})</div>
        `);

        options.elapsed = 0;
        options.timer = setInterval(() => {
          if (options.elapsed >= TRACK.duration) {
            return clearInterval(options.timer);
          }

          options.elapsed += 0.25;
          $('#progress').val(options.elapsed / (TRACK.duration / 200));
        }, 250);
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

    // on progress update
    connection.on(
      EVENTS.UPDATE_PROGRESS,
      (data) => {
        const { progress = 0 } = data;
        options.elapsed = (TRACK.duration / 200) * progress;
        return $('#progress').val(progress);
      },
    );

    // on stop click
    connection.on(
      EVENTS.STOP_PLAYBACK,
      () => {
        options.elapsed = 0;
        options.paused = true;
        clearInterval(options.timer);
        return $('#progress').val(0);
      },
    );

    // on play / pause click
    connection.on(
      EVENTS.UPDATE_PLAYBACK_STATE,
      (data) => {
        const { isPaused = true } = data;
        options.paused = isPaused;
        if (isPaused) {
          return clearInterval(options.timer);
        }

        options.timer = setInterval(() => {
          if (options.elapsed >= TRACK.duration) {
            return clearInterval(options.timer);
          }
          console.log('tick', options.elapsed);
          options.elapsed += 0.25;
          $('#progress').val(options.elapsed / (TRACK.duration / 200));
        }, 250);
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
