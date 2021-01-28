require('isomorphic-fetch');

const tsProjectId = process.env.TS_PROJECT_ID;
const tsApiKey = process.env.TS_API_KEY;
const shape = process.env.TS_SHAPE;
const origin = 'title';
const target = 'slug';

const endpoint = `https://api.takeshape.io/project/${tsProjectId}/graphql`

const slugify = async () => {
  const data = await getShapeList();
  const items = data[`get${shape}List`].items;

  console.log('items', items);

  if (items.length > 0) {
    let id;
    let slug;

    await Promise.all(items.map(async (property) => {
      id = property._id;
      slug = textToSlug(property[origin]);
      
      const result = await updateShape(id, slug);
      console.log('result', result);
      const update = result[`update${shape}`].result;
      console.log(`-> ${origin}: ${update[origin]} turned into ${target}: ${update[target]}`);
    }));
    
    await slugify();
  } else {
    console.log('done...');
  }
};

const getShapeList = async () => await tsFetch(`
  query {
    get${shape}List (where: {NOT: {${target}: {regexp: ".+"}}}) {
      items {
        _id
        ${origin}
      }
    }
  }`
);

const updateShape = async (id, slug) => await tsFetch(`
  mutation {
    update${shape}(input: {_id: "${id}", ${target}: "${slug}"}) {
      result {
        _id
        ${origin}
        ${target}
      }
    }
  }`
);

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