# xml2Obj

xml2obj is a utility that convert a xml document in an object in regard to a given mapping

It uses the [xpath](https://en.wikipedia.org/wiki/XPath) syntax. 
Here is a [helpfull cheatset](https://gist.github.com/LeCoupa/8c305ec8c713aad07b14)

```javascript
 const xml = "\
  <HEAD> \
    <TITLE>My title</TITLE> \
    <VERSION myattr='truc'> nothing </VERSION> \
  </HEAD>"

  const extractor = xml2Obj.extract(xml, {
    title: '/HEAD/TITLE/text()', // this will take the text content withing the tag TITLE
    attr: '/HEAD/VERSION/@myattr' // This will take the attribute "attr" attached to the VERSION tag,
  }

  // {title: 'My title', attr: 'truc'}
```


## Extract html
When html is embedded within the html you have to specify it 
```javascript
const extractor = xml2Obj.extract(xml, {
  content: {
    path: '/HEAD/TITLE' // this will capture every thing withing the Title Element stripping out the TITLE tag
    isHtml: true,
  },
  attr: '/HEAD/VERSION/@myattr',
}
```

## Extract nested  object
Sometime it is handy to create an array or a nested object from a group of keys
You can do that using the syntax below


```javascript
const xml = "\
  <HEAD> \
    <TITLE>My title</TITLE> \
    <VERSIONS> \
       <VERSION num='v1'> \
          <ELEM myattr='this is v1'>v1text</ELEM> \
      </VERSION> \
       <VERSION num='v2'> \
          <ELEM myattr='this is v2'>v2text</ELEM> \
      </VERSION> \
    </VERSIONS> \
  </HEAD>"

  const extractor = xml2Obj.extract(xml, {
    myarray: {
      path: '/HEAD/VERSIONS/VERSION',
      mapping: {
        num: '/@num', // the num attribute of every VERSION 
        text: '/ELEM/text()', //The inner Text within all the ELEM tag in the VERSIONS
        attr: '/ELEM/@myattr', //You get it... 
      }
    }
  })

  //returns   { myarray: [{num: 'v1', text: 'v1text', attr: 'this is v1'}, {num: 'v2', text: 'v2text', attr: 'this is v2'}]
```


Check the tests for more examples


# Strict Mode
By default all missing throws an error 
If you want to deactivate this beaviour you can call the extract function with an tolerance parameter
The missing keys wont appear in the resulting object

```javascript
 xml2Obj.extract(xml, {...mapping}, {tolerant: true})
```


# TEST
run test suite
