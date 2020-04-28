const test = require('ava');
const xml2Obj = require('../index.js');


test('Simple xpath shoud extract value', (t) => {

  const xml = "\
  <HEAD> \
    <TITLE>My title</TITLE> \
    <VERSION myattr='truc'> nothing </VERSION> \
  </HEAD>"

  const extractor = xml2Obj.extract(xml, {
    title: '/HEAD/TITLE/text()',
    attr: '/HEAD/VERSION/@myattr',
  })

  t.is(extractor.title, 'My title')
  t.is(extractor.attr, 'truc')
})

test('Missing key should fail', (t) => {

  const xml = "\
  <HEAD> \
    <TITLE>My title</TITLE> \
    <VERSION myattr='truc'> nothing </VERSION> \
  </HEAD>"

  t.throws(() => {
    return xml2Obj.extract(xml, {
      title: '/HEAD/TITLMISSINGE/text()',
      attr: '/HEAD/VERSION/@myattr',
    })
  });

  t.notThrows(() => {
    return xml2Obj.extract(xml, {
      title: '/HEAD/TITLMISSINGE/text()',
      attr: '/HEAD/VERSION/@myattr',
    }, {tolerance: true})
  })

  const extractor = xml2Obj.extract(xml, {
      title: '/HEAD/TITLMISSINGE/text()',
      attr: '/HEAD/VERSION/@myattr',
    }, {tolerance: true})

  t.is(extractor.title, undefined)
  

})



test('Should extract one specified values from array', (t) => {

  const xml = "\
  <HEAD> \
    <TITLE>My title</TITLE> \
    <VERSIONS> \
       <VERSION num='v1'>v1text</VERSION> \
       <VERSION num='v2'>v2text</VERSION> \
    </VERSIONS> \
  </HEAD>"

  const extractor = xml2Obj.extract(xml, {
    firstVersion: '/HEAD/VERSIONS/VERSION[1]/@num',
    lastVersion: '/HEAD/VERSIONS/VERSION[2]/text()',
  })

  t.is(extractor.firstVersion, 'v1')
  t.is(extractor.lastVersion, 'v2text')
})


test('Should extract arrays of values', (t) => {
  const xml = "\
  <HEAD> \
    <TITLE>My title</TITLE> \
    <VERSIONS> \
       <VERSION num='v1'>v1text</VERSION> \
       <VERSION num='v2'>v2text</VERSION> \
    </VERSIONS> \
  </HEAD>"

  const extractor = xml2Obj.extract(xml, {
    versions: '/HEAD/VERSIONS/VERSION//text()',
    versionsNums: '/HEAD/VERSIONS/VERSION//@num',
  })

  t.deepEqual(extractor.versions, ['v1text', 'v2text'])
  t.deepEqual(extractor.versionsNums, ['v1', 'v2'])

});

test('Should extract arrays of values in intricated balise', (t) => {
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
    versions: '/HEAD/VERSIONS/VERSION//ELEM/text()',
    versionsNums: '/HEAD/VERSIONS/VERSION//ELEM/@myattr',
  })

  t.deepEqual(extractor.versions, ['v1text', 'v2text'])
  t.deepEqual(extractor.versionsNums, ['this is v1', 'this is v2'])

});

test('Should extract raw html (/xml) from one element', (t) => {
  const xml = "\
    <TITRE> \
        <CONTENT>  \
          <html> <div attr='attr'> My content <br/> other </div> </html> \
        </CONTENT>\
    </TITRE>"

  const extractor = xml2Obj.extract(xml, {
    content: {path: '/TITRE/CONTENT', isHtml: true},
  })

  t.is(extractor.content.trim(), '<html> <div attr="attr"> My content <br/> other </div> </html>');
})

test('Should extract bare html (/xml) from one element', (t) => {
  const xml = "\
    <TITRE> \
        <CONTENT>  \
            somme content outside tag\
            <div attr='attr'> My content <br/> other </div> </html>\
        </CONTENT>\
    </TITRE>"

  const extractor = xml2Obj.extract(xml, {
    content: {path: '/TITRE/CONTENT', isHtml: true},
  })

  t.is(extractor.content.trim(), 'somme content outside tag            <div attr="attr"> My content <br/> other </div>');
})

test('should extract nested objects', (t) => {
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
        num: '/@num',
        text: '/ELEM/text()',
        attr: '/ELEM/@myattr',
      }
    }
  })


  t.deepEqual(extractor.myarray, [
    {num: 'v1', text: 'v1text', attr: 'this is v1'},
    {num: 'v2', text: 'v2text', attr: 'this is v2'},
  ])

})


test('should extract single nested objects', (t) => {
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

  const xml2 = "\
  <HEAD> \
    <TITLE>My title</TITLE> \
    <VERSIONS> \
       <VERSION num='v1'> \
          <ELEM myattr='this is v1'>v1text</ELEM> \
      </VERSION> \
    </VERSIONS> \
  </HEAD>"

  const extractor = xml2Obj.extract(xml, {
    myobj: {
      path: '/HEAD/VERSIONS/VERSION[1]',
      mapping: {
        num: '/@num',
        text: '/ELEM/text()',
        attr: '/ELEM/@myattr',
      }
    }
  })

  const extractor2 = xml2Obj.extract(xml2, {
    myobj: {
      path: '/HEAD/VERSIONS/VERSION',
      mapping: {
        num: '/@num',
        text: '/ELEM/text()',
        attr: '/ELEM/@myattr',
      }
    }
  })
  


  t.deepEqual(extractor.myobj, {num: 'v1', text: 'v1text', attr: 'this is v1'});
  t.deepEqual(extractor2.myobj, {num: 'v1', text: 'v1text', attr: 'this is v1'});

})



test('should extract complex nested objects', (t) => {
  const xml = "\
  <HEAD> \
    <TITLE>My title</TITLE> \
    <VERSIONS> \
       <VERSION num='v1'> \
          <ELEM myattr='this is v1'><div> this is html content</div></ELEM> \
      </VERSION> \
       <VERSION num='v2'> \
          <ELEM myattr='this is v2'>text <div>this is html 2nd content </div></ELEM> \
      </VERSION> \
    </VERSIONS> \
  </HEAD>"

  const extractor = xml2Obj.extract(xml, {
    mycontent: {
      path: '/HEAD/VERSIONS/VERSION',
      mapping: {
        text: {
          path: '/ELEM',
          isHtml: true,
        }
      }
    }
  })


  t.deepEqual(extractor.mycontent, [
    {text: '<div> this is html content</div>'},
    {text: 'text <div>this is html 2nd content </div>'},
  ])

})



test('it should work with namespaces', (t) => {
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

  t.is(extractor.subtitle, 'My Sub Title')
  t.is(extractor.subtitle2, 'My Sub Title 2')
  t.is(extractor.content, ' Content ')
})

test('Can apply function to result', (t) => {

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

  t.is(extractor.title, 'My title')
  t.is(extractor.attr, 'truc')
});


test('should extract complex nested objects with relative path', (t) => {
  const xml = "\
  <HEAD> \
    <TITLE>My title</TITLE> \
    <VERSIONS> \
       <VERSION num='v1'> \
          <ELEM myattr='this is v1'><div> this is html content</div></ELEM> \
      </VERSION> \
       <VERSION num='v2'> \
          <ELEM myattr='this is v2'>text <div>this is html 2nd content </div></ELEM> \
      </VERSION> \
    </VERSIONS> \
  </HEAD>"

  const extractor = xml2Obj.extract(xml, {
    mycontent: {
      path: '//VERSIONS/VERSION',
      mapping: {
        text: {
          path: '/ELEM',
          isHtml: true,
        }
      }
    }
  })


  t.deepEqual(extractor.mycontent, [
    {text: '<div> this is html content</div>'},
    {text: 'text <div>this is html 2nd content </div>'},
  ])

})
