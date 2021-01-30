require('isomorphic-fetch');
const slug = require('slugg');
const {default: PQueue} = require('p-queue');

const tsProjectId = process.env.TS_PROJECT_ID;
const tsApiKey = process.env.TS_API_KEY;
const shape = process.env.TS_SHAPE;
const origin = 'title';
const target = 'slug';
const batchSize = 10;
const concurrency = 10;

const endpoint = `https://api.takeshape.io/project/${tsProjectId}/graphql`
const queue = new PQueue({concurrency});

let from = 0;

const slugify = async () => {
  console.log('loading more records...');
  const items = await getShapeList();

  if (items.length > 0) {
    console.log('updating more records...');
    queue.add(async () => {
      const list = await updateShapes(items);
      list.forEach(update => {
        const result = update.result;
        console.log(`-> ${origin}: ${result[origin]} -> ${target}: ${result[target]}`);
      });
    });
    slugify();
  } else {
    console.log('done loading...');
  }
};

queue.on('idle', () => {
  console.log('done updating...');
});

const getShapeList = async () => {
  const data = await tsFetch(`
    query {
      get${shape}List (where: {NOT: {slug: {regexp: ".+"}}}, size: ${batchSize}, from: ${from},  sort: {field: "title", order: "asc"}) {
        items {
          _id
          ${origin}
        }
      }
    }`
  );

  if (!data) {
    console.log(`Could not get the Shape data. Make sure the ${target} field exist.`);
    return;
  }

  from += batchSize;
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