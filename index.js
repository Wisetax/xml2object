const xpath = require('xpath');
const dom = require('xmldom').DOMParser;
const Serializer = require('xmldom').XMLSerializer;


function extract(xml, mapping) {
  const doc = new dom().parseFromString(xml);

  // console.log(doc.getElementsByClassName('CONTENT'))

  const object = {};

  for(const key in mapping) {
    object[key] = extractKey(doc, mapping[key])
  }

  return object;

}

function extractKey(doc, path) {
  if (typeof path === 'string')
    return _extractPlainKey(doc, path);
  
  if (path.isHtml)
    return _extractHtmlKey(doc, path.path);

  throw new Error('Path format not recognized');
}

function _extractHtmlKey(doc, path) {
  const nodes = xpath.select(path, doc);

  return _extractValue(nodes, (node) => node.toString(true));
}

function _extractPlainKey(doc, path) {
  const nodes = xpath.select(path, doc)
  
  return _extractValue(nodes, (node) => node.nodeValue)
}

function _extractValue(nodes, func) {
  if (nodes.length === 0)
    throw new Error('path not found');

  if (nodes.length == 1)
    return func(nodes[0]) //.nodeValue;

  return nodes.map((node) => func(node));
}


module.exports = {
  extract,
};