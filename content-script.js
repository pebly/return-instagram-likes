'use strict';

let cache = {};

async function ReturnInstagramLikes(id) {
  if (cache[id] !== undefined) {
    return cache[id];
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
    )}/likers/`,
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

  cache[id] = {
    count: body2.user_count || null,
    id,
    length: body2.users.length
  };

  return cache[id];
}

setInterval(async () => {
  const a = document.querySelectorAll('a[href$="/liked_by/"]');

  for (let i = 0; i < a.length; i++) {
    const id = a[i].href.split('/p/')[1].split('/')[0];

    if (document.getElementById(`ReturnInstagramLikes-${id}`)) {
      continue;
    }

    let section = a[i].closest('section');

    if (section === null) {
      continue;
    }

    if (
      section.previousElementSibling === null ||
      section.previousElementSibling.tagName === 'DIV'
    ) {
      section = section.parentElement;
    } else {
      section = section.previousElementSibling;
    }

    section.insertAdjacentHTML(
      'afterbegin',
      `
        <span id="ReturnInstagramLikes-${id}" style="align-items: center; background: linear-gradient(30deg, #f9ce34 0%, #ee2a7b 50%, #6228d7 100%); border-radius: 999px; color: #fff; cursor: pointer; display: flex; gap: 4px; font-size: 16px; font-weight: 400; height: fit-content; margin: 4px 16px 4px 0; min-height: 32px; padding: 0 8px; user-select: none; width: fit-content;">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-heart" width="20" height="20" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
            <path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572"></path>
          </svg>
          <span style="color: inherit; display: none; font-size: 14px; font-weight: 600;">
            0
          </span>
          <div style="color: inherit; display: flex; flex-direction: column; font-weight: 600; gap: 2px; text-transform: uppercase;">
            <b style="font-size: 10px; line-height: 100%;">
              click to load
            </b>
            <span style="display: none; font-size: 8px; font-style: italic; line-height: 100%;">
              not sure
            </span>
          </div>
        </span>
      `
    );

    const span = document.getElementById(`ReturnInstagramLikes-${id}`);

    const compute = async () => {
      try {
        span.removeEventListener('click', compute);
      } catch (_) {}

      span.style.cursor = '';

      const count = span.querySelector('span');

      const divB = span.querySelector('div > b');

      const divSpan = span.querySelector('div > span');

      divB.textContent = 'loading...';

      const likes = await ReturnInstagramLikes(id);

      if (likes.count === null) {
        divB.textContent = 'error';
      } else {
        divB.textContent = 'likes';

        count.style.display = 'flex';

        count.textContent = format(
          likes.count < likes.length ? likes.length : likes.count
        );

        if (likes.count < likes.length) {
          divSpan.style.display = 'flex';
        }
      }
    };

    const format = (number) =>
      number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    if (cache[id] === undefined) {
      span.addEventListener('click', compute);
    } else {
      await compute();
    }
  }
}, 500);
