'use strict';

let ReturnInstagramLikes__Cache = {};
let ReturnInstagramLikes__Pathname = null;

async function ReturnInstagramLikes(id) {
  if (ReturnInstagramLikes__Cache[id] !== undefined) {
    return ReturnInstagramLikes__Cache[id];
  }

  const response1 = await fetch(`https://www.instagram.com/p/${id}`, {
    headers: {
      accept: '*/*'
    }
  });

  const body1 = await response1.text();

  const match = (regex, value) => {
    return (
      (value.match(regex) || []).map((group) =>
        group.replace(regex, '$1')
      )[0] || null
    );
  };

  const response2 = await fetch(
    `https://www.instagram.com/api/v1/media/${match(
      /"media_id":"(.*?)"/g,
      body1
    )}/likers`,
    {
      credentials: 'include',
      headers: {
        accept: '*/*',
        'x-csrftoken': match(/\{"csrf_token":"(.*?)"/g, body1),
        'x-ig-app-id': match(/"APP_ID":"(.*?)"/g, body1)
      },
      method: 'GET',
      mode: 'cors'
    }
  );

  let body2 = {};

  try {
    body2 = await response2.json();
  } catch (_) {}

  ReturnInstagramLikes__Cache[id] = {
    count: body2.user_count || null,
    id
  };

  return ReturnInstagramLikes__Cache[id];
}

setInterval(async () => {
  if (location.pathname === ReturnInstagramLikes__Pathname) {
    return;
  }

  if (location.pathname.startsWith('/p/') === false) {
    ReturnInstagramLikes__Pathname = null;

    return;
  }

  ReturnInstagramLikes__Pathname = location.pathname;

  const id = ReturnInstagramLikes__Pathname.split('/')[2];

  let section;

  try {
    section = document
      .querySelector(`a[href="/p/${id}/liked_by/"]`)
      .closest('section');
  } catch (_) {
    return;
  }

  section.insertAdjacentHTML(
    'afterbegin',
    `
      <span id="ReturnInstagramLikes" style="align-items: center; background: linear-gradient(30deg, #f9ce34 0%, #ee2a7b 50%,#6228d7 100%); border-radius: 999px; color: #fff; display: flex; gap: 4px; font-size: 16px; font-weight: 400; height: fit-content; margin: 8px 0; min-height: 32px; padding: 0 8px; user-select: none; width: fit-content;">
        <span>
          🤍
        </span>
        <span style="color: inherit; display: none; font-size: 14px; font-weight: 600;">
          0
        </span>
        <b style="color: inherit; font-size: 10px; font-weight: 600; text-transform: uppercase;">
          LOADING...
        </b>
      </span>
    `
  );

  const likes = await ReturnInstagramLikes(id);

  if (ReturnInstagramLikes__Pathname.includes(likes.id)) {
    const b = document.querySelector('#ReturnInstagramLikes > b');

    if (likes.count === null) {
      b.textContent = 'error';

      const emote = document.querySelector(
        '#ReturnInstagramLikes > span:first-child'
      );

      emote.textContent = '😥';
    } else {
      b.textContent = 'likes';

      const count = document.querySelector(
        '#ReturnInstagramLikes > span:nth-child(2)'
      );

      count.style.display = 'flex';

      count.textContent = likes.count;
    }
  }
}, 500);
