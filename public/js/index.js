const ORIGIN = 'http://localhost:2111';

$(document).ready(() => {
  $('#root').append(`
<h1>DeepSeen Sockets Testing</h1>
<div id="auth"></div>
<div id="login-error"></div>
<div id="connection"></div>
<div id="controls"></div>
<div id="playlist"></div>
  `);

  const token = localStorage.getItem('token');
  if (!token) {
    $('#auth').empty().append(`
<button
  id="login"
  type="button"
>
  Log in
</button> 
    `);
  } else {
    $('#auth').empty().append(`
<button
  id="logout"
  type="button"
>
  Log out
</button> 
    `);
  }

  // handle Login button click
  $('#login').on('click', async () => {
    try {
      const response = await $.ajax({
        data: {
          email: 'test@test.com',
          origin: 'web',
          password: 'test',
        },
        method: 'POST',
        url: `${ORIGIN}/api/signin`,
      });
      const { data: { token = '' } = {} } = response;
      if (!token) {
        return $('#login-error').empty().append('Error!');
      }

      localStorage.setItem('token', token);
      return window.location.reload();
    } catch {
      return $('#login-error').empty().append('Error!');
    }
  });

  if (token) {
    // create connection
    const connection = io.connect('ws://localhost:2111', {
      query: {
        token, // token will always be passed with this connection
      },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });

    connection.on('connect', () => {
      $('#connection').empty().append('Connected');

      const token = localStorage.getItem('token');
      connection.emit('authenticate', token);

      connection.on('authenticate', ({ info = '', status = 200 }) => {
        if (!(info === 'OK' && status === 200)) {
          localStorage.removeItem('token');
          return connection.close();
        }

        $('#controls').empty().append(`
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
        `);

        // handle the next button
        $('#next').on('click', () => connection.emit('m-next'));

        // handle the previous button
        $('#previous').on('click', () => connection.emit('m-previous'));
      });
    });

    connection.on('disconnect', () => $('#connection').empty().append('Disconnected'));

    // handle logout button
    $('#logout').on('click', () => {
      localStorage.removeItem('token');
      connection.close();
      return window.location.reload();
    });
  }
});
