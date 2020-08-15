# xml2Obj
![Test](https://github.com/stanBienaives/xml2object/workflows/Test/badge.svg)

xml2obj is a utility that convert a xml document in an object in regard to a given mapping

It uses the [xpath](https://en.wikipedia.org/wiki/XPath) syntax. 
Here is a [helpfull cheatsheet](https://gist.github.com/LeCoupa/8c305ec8c713aad07b14)

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


## Strict Mode
By default all missing throws an error 
If you want to deactivate this beaviour you can call the extract function with an tolerance parameter
The missing keys wont appear in the resulting object

```javascript
 xml2Obj.extract(xml, {...mapping}, {tolerant: true})
```

You can also set the tolerance at key level:
```javascript
  const extractor = xml2Obj.extract(xml, {
    firstVersion: {
      path: '/HEAD/VERSIONS/VERSION[1]/@doesnotexists',
      tolerance: true,
    },
  }, { tolerance: false })
```
NOTE: if tolerance is set to true at the global level. Tolerance at key level has no effect.

## Namespaces
Whenever namespaces are used in the document you should specify the name space useds and their ids in the options
The namespaces and id are specified in the xmls document
```javascript
  const xml = "\
  <HEAD> \
    <NS1:TITLE xmlns:NS1='NS1ID'> \
      <NS1:SUBTITLE>My Sub Title</NS1:SUBTITLE> \
    </NS1:TITLE> \
    <NS2:TITLE xmlns:NS2='NS2ID'> \
      <NS2:SUBTITLE>My Sub Title 2</NS2:SUBTITLE> \
    </NS2:TITLE> \
    <CONTENT> Content </CONTENT> \
  </HEAD>"

  const extractor = xml2Obj.extract(xml, {
    subtitle: '/HEAD/NS1:TITLE/NS1:SUBTITLE/text()',
    subtitle2: '/HEAD/NS2:TITLE/NS2:SUBTITLE/text()',
    content: '/HEAD/CONTENT/text()',
  }, {namespaces: {
      'NS1': 'NS1ID',
      'NS2': 'NS2ID',
    }})

  // returns { subtitle: 'My Sub Title, subtitle2: My Sub title 2 , content: 'Content'}
```

## Apply function to results 

It is possible to apply a function to the result a the key level using the function `apply`

```javascript
  const xml = "\
  <HEAD> \
    <TITLE>My title; garbage</TITLE> \
    <VERSION myattr='truc'> nothing </VERSION> \
  </HEAD>"

  const extractor = xml2Obj.extract(xml, {
    title: {
      path: '/HEAD/TITLE/text()',
      apply: (title) => title.split(';')[0],
    },
    attr: '/HEAD/VERSION/@myattr',
  })
```

## Set default to key
You can set a default value to keys using the syntax below:
```javascript
  const extractor = xml2Obj.extract(xml, {
    title: {
      path: '/HEAD/TITLE/text()',
      default: 'value if missing',
    },
  }, {tolerance: true})
```

## Extract trees
Tree extraction can be done specifiying the name of the recursive node
the _childrens key will be added when any child is found: 

NOTE: The apply function cannot be used along with tree

```javascript
  const xml = "<HEAD> \
    <TITLE>My title</TITLE> \
    <NAV> \
      <ITEM num='1' name='parent'> \
        <ITEM num='11' name='child'> \
          <ITEM num='111' name='child'> </ITEM> \
        </ITEM> \
      </ITEM> \
      <ITEM num='2' name='parent'> \
        <ITEM num='21' name='child'> </ITEM> \
        <ITEM num='22' name='child'> </ITEM> \
      </ITEM> \
    </NAV> \
  </HEAD>"

  const extractor = xml2Obj.extract(xml, {
    docs: {
      path: "//HEAD/NAV/ITEM",
      tree: 'ITEM',
      tolerance: true,
      mapping: {
        num: '/@num',
        name: '/@name',
      }
    }
  }
```




# TEST
run test suite
