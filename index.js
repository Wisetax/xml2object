const xpath = require('xpath');
const dom = require('xmldom').DOMParser;
const fspath = require('path');

class Xlm2Object {
  constructor(xml, mapping, options={}) {
    this.doc = new dom().parseFromString(xml);
    this.mapping = mapping;
    this.options = options;
  }

  
  /**
   * Extract object from xml given a mapping
   * @param  {String} xml as string
   * @param  {Object} mapping  mapping defined as specified in documentation
   * @param  {Object} options={}
   */
  static extract(xml, mapping, options={}) {
    const extractor = new Xlm2Object(xml, mapping, options);

    return extractor.extract();
  }
  

  /**
  * Extract xml arccording to given mapping
  * @param  {String} xml xml as string
  * @param  {Object} mapping mapping define according to documentation
  */
  extract() {
    const object = {};
  
    for(const key in this.mapping) {
      const extraction = this.extractKey(this.mapping[key])
      if (extraction)
        object[key] = extraction;
    }
  
    return object;
  }

  /**
  * Extract one single key given xpath and options
  * @param  {Object | String} options  options given according to documentation (if string is given the options is converted to  { path: options}
  * 
  * @return {Array | Object | String} return object designed by the path (could be a string, an array or object)
  */
  extractKey(options) {
  
    if (typeof options === 'string')
      options = {path: options}
    
    if (options.isHtml)
      return this._extractHtmlKey(options.path);
  
    if (options.mapping)
      return this._extracItemsKey(options);
  
    if (options.path)
      return this._extractPlainKey(options.path);
  
      throw new Error('Path format not recognized');
  }
  
  /**
  * Find node given an xpath
  * @param  {String} path xpath
  * 
  * @returns {Array{Element}} array of elements
  */
  extractNodes(path) {
    const select = xpath.useNamespaces(this.options.namespaces);
    const nodes = select(path, this.doc);
  
    if (nodes.length === 0 && !this.options.tolerance)
      throw new Error(`No element for this path: ${path}`);
  
    return nodes;
  }

  /**
  * Extract simple key (attr or text)
  * @param  {String} path xpath 
  * 
  * @return {Array<String> | String} returrn array of extracted texts 
  */
  _extractPlainKey(path) {
    const nodes = this.extractNodes(path);
    
    return this._extractValue(nodes, (node) => node.nodeValue)
  }

  /**
  * Extract html content from key
  * @param  {String} path xpath
  * 
  * @return {Array<String> | String} return array of html content or single html content in a string
  */
  _extractHtmlKey(path) {
    const nodes = this.extractNodes(path);
  
    return this._extractValue(nodes, (node) => {
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
  * @param  {String} {path xpath
  * @param  {Object} mapping} mapping for nested objects (relative)
  * 
  * @return {Array | Object | String}
  */
  _extracItemsKey({path, mapping}) {
    const nodes = this.extractNodes(path);
  
    
    return this._extractValue(nodes, (node, index) => {
      const object = {};
  
      const entries =  Object.entries(mapping);
      for(let i=0; i<entries.length; i++) {
  
        const options =  (typeof entries[i][1] === 'string') ? {path: entries[i][1]} : Object.assign({}, entries[i][1]);
  
  
        const nthchild = isNaN(index) ? '' : `[${index+1}]`;
        const key = entries[i][0];
  
        const globalPath = fspath.join(path + nthchild, options.path)
  
        options.path = globalPath;
  
        object[key] = this.extractKey(options);
      }
  
      return object;
    })
  }
  
  /**
  * Apply function to one or multiple nodes
  * @param  {Array[Element]} nodes
  * @param  {Function} func function to apply to the node to retrive the value
  */
  _extractValue(nodes, func) {

    if (nodes.length === 0)
      return
    
    if (nodes.length === 1)
      return func(nodes[0])
  
    return nodes.map((node, index) => func(node, index));
  }
}



module.exports = Xlm2Object;