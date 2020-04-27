const xpath = require('xpath');
const dom = require('xmldom').DOMParser;
const fspath = require('path');


function extract(xml, mapping) {
  const doc = new dom().parseFromString(xml);

  const object = {};

  for(const key in mapping) {
    object[key] =  extractKey(doc, mapping[key])
  }

  return object;

}

function extractKey(doc, path) {

  if (typeof path === 'string')
    return _extractPlainKey(doc, path);
  
  if (path.isHtml)
    return _extractHtmlKey(doc, path.path);

  if (path.mapping)
    return _extracItemsKey(doc, path);

  if (path.path)
    return _extractPlainKey(doc, path.path);

  throw new Error('Path format not recognized');
}

function extractNodes(doc, path) {
  const nodes = xpath.select(path, doc);

  if (nodes.length === 0)
    throw new Error(`No element for this path: ${path}`);

  return nodes;

}

function _extracItemsKey(doc, {path, mapping}) {
  const nodes = extractNodes(doc, path);

  
  return _extractValue(nodes, (node, index) => {
    const object = {};

    const entries =  Object.entries(mapping);
    for(let i=0; i<entries.length; i++) {

      const options =  (typeof entries[i][1] === 'string') ? {path: entries[i][1]} : Object.assign({}, entries[i][1]);


      const nthchild = isNaN(index) ? '' : `[${index+1}]`;
      const key = entries[i][0];

      const globalPath = fspath.join(path + nthchild, options.path)

      options.path = globalPath;

      object[key] = extractKey(node, options);
    }

    return object;
  })
}

function _extractHtmlKey(doc, path) {
  // path = fspath.join(path, '*');
  const nodes = extractNodes(doc, path);

  return _extractValue(nodes, (node) => {
    const stripTagStart = new RegExp(`^<${node.tagName}[^>]*>`);
    const stripTagEnd = new RegExp(`</${node.tagName}>$`);

    let innerHtml = node.toString(true);
    innerHtml = innerHtml.replace(stripTagStart, '')
    innerHtml = innerHtml.replace(stripTagEnd, '')
    
    return innerHtml;
  });
}

function _extractPlainKey(doc, path) {
  const nodes = extractNodes(doc, path);
  
  return _extractValue(nodes, (node) => node.nodeValue)
}

function _extractValue(nodes, func) {
  
  if (nodes.length === 1)
    return func(nodes[0])

  return nodes.map((node, index) => func(node, index));
}


module.exports = {
  extract,
};