/**
 * Sign in
 * @param {string} anchor - anchor element
 * @returns {Promise<void>}
 */
const signin = async (anchor = '') => {
  $(`#${anchor}`).empty().append(`
  <h1>Sign in</h1>
  <form id="signin-form">
    <input
      id="signin-email"
      placeholder="Email"
      type="email"
    />
    <input
      id="signin-password"
      placeholder="Password"
      type="password"
    />
    <button type="submit">
      Submit
    </button>
    <button
      id="back"
      type="button"
    >
      Back
    </button>
    <div id="form-error"></div>
  </form>
  `);

  $('#back').on('click', () => window.location.reload());

  $('#signin-form').on('submit', async (event) => {
    try {
      event.preventDefault();
      const response = await $.ajax({
        data: {
          client: CLIENT_TYPE,
          email: $('#signin-email').val().trim(),
          password: $('#signin-password').val().trim(),
        },
        method: 'POST',
        url: `${BACKEND_ORIGIN}/api/auth/signin`,
      });
      
      const { data: { token = '', user = {} } = {} } = response;

      localStorage.setItem('token', token);
      return home(anchor, user);
    } catch (error) {
      $('#form-error').empty().append('Access deinied!');
      return console.log('signin error', error);
    }
  });
};
