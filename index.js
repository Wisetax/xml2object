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

      const nthchild = isNaN(index) ? '' : `[${index+1}]`;
      const localpath = fspath.join(path + nthchild, entries[i][1])

      object[entries[i][0]] = extractKey(node, localpath)
    }

    return object;
  })
}

function _extractHtmlKey(doc, path) {
  const nodes = extractNodes(doc, path);

  return _extractValue(nodes, (node) => node.toString(true));
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