const fspath = require('path');
const libxmljs = require('libxmljs')


class Xlm2Object {
  constructor(xml, mapping, options={}) {
    if (options.html)
      this.parser = libxmljs.parseHtml(xml, {preserveWhitespace: false})
    else
      this.parser = libxmljs.parseXml(xml, { preserveWhitespace: false, noerror: true });
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
      if (extraction !== undefined)
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

    if (options.tree && options.apply)
      throw new Error('Apply cannot be used with tree')

    const nothing = (anything) => anything || options.default;

    const apply  = options.apply || nothing;

    let transform = (value) => {
      if (!options.array || Array.isArray(value))
        return apply(value);

      if (!value)
        return [];

      return [apply(value)];
    }
    
    if (options.isHtml)
      return transform(this._extractHtmlKey(options));
  
    if (options.mapping)
      return transform(this._extracItemsKey(options));

    if (options.path)
      return transform(this._extractPlainKey(options));
  
    throw new Error('Path format not recognized');
  }
  
  /**
  * Find node given an xpath
  * @param  {String} path xpath
  * 
  * @returns {Array{Element}} array of elements
  */
  extractNodes(path, tolerance=false) {
    const nodes = this.parser.find(path, this.options.namespaces)

    const isTolerant = this.options.tolerance || tolerance
    
    if (!isTolerant && nodes.length === 0)
      throw new Error(`No element for this path: ${path}`);
  
    return nodes;
  }

  /**
  * Extract simple key (attr or text)
  * @param  {String} path xpath 
  * 
  * @return {Array<String> | String} returrn array of extracted texts 
  */
  _extractPlainKey({path, array=false, tolerance=false}) {
    const nodes = this.extractNodes(path, tolerance);

    const value = this._extractValue(nodes, (node) => {
      if (node.type() ==  'attribute')
        return node.value();
      return node.text();
    })

    return value;
  }

  /**
  * Extract html content from key
  * @param  {String} path xpath
  * 
  * @return {Array<String> | String} return array of html content or single html content in a string
  */
  _extractHtmlKey({path, tolerance=false}) {
    const nodes = this.extractNodes(path, tolerance);
  
    return this._extractValue(nodes, (node) => {
      const stripTagStart = new RegExp(`^<${node.name()}[^>]*>`);
      const stripTagEnd = new RegExp(`</${node.name()}>$`);
  
      let innerHtml = node.toString();
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
  _extracItemsKey({path, mapping, tolerance=false, tree}) {
    const nodes = this.extractNodes(path, tolerance);
  
    
    return this._extractValue(nodes, (node, index) => {
      const object = {};
  
      const entries =  Object.entries(mapping);
      const nthchild = isNaN(index) ? '' : `[${index+1}]`;
      for(let i=0; i<entries.length; i++) {
  
        const options =  (typeof entries[i][1] === 'string') ? {path: entries[i][1]} : Object.assign({}, entries[i][1]);
  
  
        const key = entries[i][0];
  
        let globalPath = fspath.join(path + nthchild, options.path)

        // Keep relative path
        if (path.startsWith('//'))
          globalPath = `/${globalPath}`
  
        options.path = globalPath;

        object[key] = this.extractKey(options);


      }


      if (tree) {
        const reccursivePath = fspath.join(path + nthchild, tree)
        const _childrens = this._extracItemsKey({path: reccursivePath, mapping, tolerance: true, tree})


        if (_childrens)
          object._childrens = Array.isArray(_childrens) ? _childrens : [_childrens];
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