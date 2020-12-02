/**
 * Home
 * @param {string} anchor - anchor element
 * @returns {Promise<void>}
 */
const home = async (anchor = '') => {
  const socketsAnchor = 'sockets-anchor';
  const token = localStorage.getItem('token');

  $(`#${anchor}`).empty().append(`
    <h1>Home</h1>
    <div id="content">Loading...</div>
  `);

  try {
    const { data: { user = {} } = {} } = await $.ajax({
      headers: {
        Authorization: token,
      },
      method: 'GET',
      url: `${BACKEND_ORIGIN}/api/user`,
    });

    $(`#content`).empty().append(`
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
      });
      return window.location.reload();
    });

    sockets(socketsAnchor, token);
  } catch (error) {
    console.log(error);
    localStorage.removeItem('token');
    return window.location.reload();
  }
};
