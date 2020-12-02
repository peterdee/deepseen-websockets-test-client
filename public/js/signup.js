/**
 * Sign up
 * @param {string} anchor - anchor element
 * @returns {Promise<void>}
 */
const signup = async (anchor) => {
  $(`#${anchor}`).empty().append(`
    <h1>Sign up</h1>
    <form id="signup-form">
      <input
        id="signup-email"
        placeholder="Email"
        type="email"
      />
      <input
        id="signup-name"
        placeholder="Name"
        type="text"
      />
      <input
        id="signup-password"
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

  $('#signup-form').on('submit', async (event) => {
    try {
      event.preventDefault();
      const response = await $.ajax({
        data: {
          client: CLIENT_TYPE,
          email: $('#signup-email').val().trim(),
          name: $('#signup-name').val().trim(),
          password: $('#signup-password').val().trim(),
        },
        method: 'POST',
        url: `${BACKEND_ORIGIN}/api/auth/signup`,
      });
      return console.log('res', response);
    } catch (error) {
      console.log('signup error', error);
      return $('#form-error').empty().append('Access deinied!');
    }
  });
};
