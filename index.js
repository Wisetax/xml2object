const xpath = require('xpath');
const dom = require('xmldom').DOMParser;
const fspath = require('path');

/**
 * Extract xml arccording to given mapping
 * @param  {String} xml xml as string
 * @param  {Object} mapping mapping define according to documentation
 */
function extract(xml, mapping) {
  const doc = new dom().parseFromString(xml);

  const object = {};

  for(const key in mapping) {
    object[key] =  extractKey(doc, mapping[key])
  }

  return object;

}
/**
 * Extract one single key given xpath and options
 * @param  {Element} doc doc element as returnes by xmldom
 * @param  {Object | String} options  options given according to documentation (if string is given the options is converted to  { path: options}
 * 
 * @return {Array | Object | String} return object designed by the path (could be a string, an array or object)
 */
function extractKey(doc, options) {

  if (typeof options === 'string')
    options = {path: options}
  
  if (options.isHtml)
    return _extractHtmlKey(doc, options.path);

  if (options.mapping)
    return _extracItemsKey(doc, options);

  if (options.path)
    return _extractPlainKey(doc, options.path);

  throw new Error('Path format not recognized');
}
/**
 * Find node given an xpath
 * @param  {Element} doc doc element as returnes by xmldom
 * @param  {String} path xpath
 * 
 * @returns {Array{Element}} array of elements
 */
function extractNodes(doc, path) {
  const nodes = xpath.select(path, doc);

  if (nodes.length === 0)
    throw new Error(`No element for this path: ${path}`);

  return nodes;
}
/**
 * Extract simple key (attr or text)
 * @param  {Element} doc
 * @param  {String} path xpath 
 * 
 * @return {Array<String> | String} returrn array of extracted texts 
 */
function _extractPlainKey(doc, path) {
  const nodes = extractNodes(doc, path);
  
  return _extractValue(nodes, (node) => node.nodeValue)
}
/**
 * Extract html content from key
 * @param  {Element} doc
 * @param  {String} path xpath
 * 
 * @return {Array<String> | String} return array of html content or single html content in a string
 */
function _extractHtmlKey(doc, path) {
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
/**
 * Extract nested objects (reccursive)
 * @param  {Element} doc
 * @param  {String} {path xpath
 * @param  {Object} mapping} mapping for nested objects (relative)
 * 
 * @return {Array | Object | String}
 */
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

/**
 * Apply function to one or multiple nodes
 * @param  {Array[Element]} nodes
 * @param  {Function} func function to apply to the node to retrive the value
 */
function _extractValue(nodes, func) {
  
  if (nodes.length === 1)
    return func(nodes[0])

  return nodes.map((node, index) => func(node, index));
}


module.exports = {
  extract,
};