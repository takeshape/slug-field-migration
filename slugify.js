require('isomorphic-fetch');

const tsProjectId = process.env.TS_PROJECT_ID;
const tsApiKey = process.env.TS_API_KEY;
const shape = process.env.TS_SHAPE;
const origin = 'title';
const target = 'slug';

const endpoint = `https://api.takeshape.io/project/${tsProjectId}/graphql`

const slugify = async () => {
  console.log('loading...');
  const data = await getShapeList();
  const items = data[`get${shape}List`].items;

  if (items.length > 0) {
    console.log('updating...');
    const data = await updateShapes(items);
    const list = Object.values(data);
    list.forEach(update => {
      const result = update.result;
      console.log(`-> ${origin}: ${result[origin]} -> ${target}: ${result[target]}`);
    });
    
    await slugify();
  } else {
    console.log('done...');
  }
};

const getShapeList = async () => await tsFetch(`
  query {
    get${shape}List (where: {NOT: {${target}: {regexp: ".+"}}}, size: 10) {
      items {
        _id
        ${origin}
      }
    }
  }`
);

const updateShapes = async (items) => {
  let id;
  let slug;
  let update = '';
  items.forEach((property, i) => {
    id = property._id;
    slug = textToSlug(property[origin]);
    update += `
      update${i}: update${shape}(input: {_id: "${id}", ${target}: "${slug}"}) {
        result {
          _id
          ${origin}
          ${target}
        }
      }
    `
  });

  return await tsFetch(`
    mutation {
      ${update}
    }
  `);
};

const textToSlug = text => text
  .toString()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim()
  .replace(/\s+/g, '-')
  .replace(/[^\w-]+/g, '')
  .replace(/--+/g, '-');

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