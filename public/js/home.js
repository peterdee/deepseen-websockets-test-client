/**
 * Home
 * @param {string} anchor - anchor element
 * @param {*} user - user data
 * @returns {Promise<void>}
 */
const home = async (anchor = '', user = {}) => {
  const socketsAnchor = 'sockets-anchor';
  const token = localStorage.getItem('token');

  $(`#${anchor}`).empty().append(`
    <h1>Home</h1>
    <div>Hi, ${user.name}!</div>
    <button
      id="logout"
      type="button"
    >
      Logout
    </button>
    <button
      id="complete-logout"
      type="button"
    >
      Complete logout
    </button>
    <div id="${socketsAnchor}"></div>
  `);

  $('#logout').on('click', () => {
    localStorage.removeItem('token');
    return window.location.reload();
  });

  $('#complete-logout').on('click', async () => {
    await $.ajax({
      headers: {
        Authorization: token,
      },
      method: 'GET',
      url: `${BACKEND_ORIGIN}/api/auth/signout/complete`,
    })
    return window.location.reload();
  });

  sockets(socketsAnchor, token);
};
