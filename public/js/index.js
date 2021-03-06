// const BACKEND_ORIGIN = 'http://localhost:1337';
// const WS_ORIGIN = 'ws://localhost:9500';

const BACKEND_ORIGIN = 'https://deepseen-backend.herokuapp.com';
const WS_ORIGIN = 'https://deepseen-ws.herokuapp.com';

const CLIENTS = {
  desktop: 'desktop',
  mobile: 'mobile',
  web: 'web',
};

const CLIENT_TYPE = CLIENTS.web;

$(document).ready(async () => {
  $('#root').empty().append(`
    <button
      id="signin"
      type="button"
    >
      Sign in
    </button>
    <button
      id="signup"
      type="button"
    >
      Sign up
    </button>
  `);

  $('#signin').on('click', () => signin('root'));
  $('#signup').on('click', () => signup('root'));

  const token = localStorage.getItem('token');
  if (token) {
    return home('root', { name: 'User' });
  }
});
