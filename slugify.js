require('isomorphic-fetch');
const slug = require('slugg');

const tsProjectId = process.env.TS_PROJECT_ID;
const tsApiKey = process.env.TS_API_KEY;
const shape = process.env.TS_SHAPE;
const origin = 'title';
const target = 'slug';

const endpoint = `https://api.takeshape.io/project/${tsProjectId}/graphql`

const slugify = async () => {
  console.log('loading...');
  const items = await getShapeList();

  if (items.length > 0) {
    console.log('updating...');
    const list = await updateShapes(items);
    list.forEach(update => {
      const result = update.result;
      console.log(`-> ${origin}: ${result[origin]} -> ${target}: ${result[target]}`);
    });
    
    await slugify();
  } else {
    console.log('done...');
  }
};

const getShapeList = async () => {
  const data = await tsFetch(`
    query {
      get${shape}List (where: {NOT: {${target}: {regexp: ".+"}}}, size: 10) {
        items {
          _id
          ${origin}
        }
      }
    }`
  );

  if (!data) {
    console.log('Could not get the Shape data. Make sure the Slug field exist.');
    return;
  }

  const items = data[`get${shape}List`].items;
  return items;
};

const updateShapes = async (items) => {
  let update = '';
  items.forEach((property, i) => {
    const id = property._id;
    const slug_text = slug(property[origin]);
    update += `
      update${i}: update${shape}(input: {_id: "${id}", ${target}: "${slug_text}"}) {
        result {
          _id
          ${origin}
          ${target}
        }
      }
    `
  });

  const data = await tsFetch(`
    mutation {
      ${update}
    }
  `);
  const list = Object.values(data);
  return list;
};

const tsFetch = async (query) => {
  response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tsApiKey}` },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    const message = `An error has occurred: ${response.status}`;
    throw new Error(message);
  }

  const list = await response.json();
  return list.data;
};

slugify();