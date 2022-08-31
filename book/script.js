function ciniiReqUrlBuilder(keyword = "", from = 2017, to = 2021, p = 1) {
  let ciniiReqUrl = "https://da1.blue/prx/cib/format=json&type=1&sortorder=5"
  ciniiReqUrl += "&q=" + encodeURIComponent(keyword);
  ciniiReqUrl += "&year_from=" + from; + "&year_to=" + to;
  ciniiReqUrl += "&count=" + 20;
  ciniiReqUrl += "&p=" + p;
  return ciniiReqUrl;
}
async function getJson(url) {
  const res = await fetch(url)
  if (res.ok) {
    return await res.json();
  } else if (res.status >= 400) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return;
  } else {
    await new Promise(resolve => setTimeout(resolve, 100));
    return;
  }
}

async function getIntro(isbn) {
  let openBDUrl = "https://api.openbd.jp/v1/get?isbn=" + isbn
  let openBDJson = await getJson(openBDUrl)
  if (openBDJson[0]) {
    let _intro = []
    let txtArray = openBDJson[0].onix.CollateralDetail.TextContent
    for (let i in txtArray) {
      if (txtArray[i].TextType == "03") {
        _intro.push(txtArray[i].Text.replace(/\n+/g, '\n'))
      } else if (txtArray[i].TextType == "04") {
        _intro.push(txtArray[i].Text.replace(/\n+/g, '\n'))
      }
    }
    return _intro.join('\n\n\n');
  }
}

async function getReview(isbn) {
  let rakutenUrl = "https://app.rakuten.co.jp/services/api/BooksBook/Search/20170404?applicationId=1053729486094210141&formatVersion=2";
  rakutenUrl += "&elements=isbn,reviewCount,reviewAverage,itemUrl,largeImageUrl"
  rakutenUrl += "&isbn=" + isbn;
  let rakutenJson = null;
  rakutenJson = await getJson(rakutenUrl);
  if (rakutenJson.Items) {
    let reviewAverage = rakutenJson.Items[0].reviewAverage;
    let reviewCount = rakutenJson.Items[0].reviewCount;
    let rakutenItemUrl = rakutenJson.Items[0].itemUrl;
    return {
      reviewAverage: reviewAverage,
      reviewCount: reviewCount,
      rakutenItemUrl: rakutenItemUrl
    }
  } else {
    return;
  }
}

async function getWkpUrlFromP349(p349) {
  query = `SELECT * WHERE{
      ?qid wdt:P349 "${p349}" ;
           rdfs:label ?label.
      FILTER (LANG(?label) = "ja")
      OPTIONAL {
        ?jaWkp schema:about ?qid ;
             schema:inLanguage "ja" ;
             schema:isPartOf <https://ja.wikipedia.org/> ;
             schema:name ?jaWkpName .
        }
      }`
  let wkdUrl = "https://query.wikidata.org/sparql?format=json&query=" + encodeURIComponent(query);
  fetch(wkdUrl)
    .then(response => response.json())
    .then(data => {
      if (data.results.bindings[0]) {
        console.log(data.results.bindings[0]);
        const wkd = data.results.bindings[0].qid.value;
        const wkdLabel = data.results.bindings[0].label.value;
        const jaWkp = data.results.bindings[0].jaWkp.value;
        const jaWkpName = data.results.bindings[0].jaWkpName.value;
        let query = `select distinct * where { wikipedia-ja:${jaWkpName} foaf:primaryTopic/dbo:abstract ?abstract. }`
        let dbpUrl = "https://ja.dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fja.dbpedia.org&format=application%2Fsparql-results%2Bjson&query=" + encodeURIComponent(query);
        fetch(dbpUrl)
          .then(response => response.json())
          .then(data => {
            if (data.results.bindings[0].abstract) {
              console.log(data.results.bindings[0]);
              const abstract = data.results.bindings[0].abstract.value;
              return {jaWkp: jaWkp, jaWkpName: jaWkpName, abstract: abstract}
              inputForm.wkpUrl = jaWkp;
              inputForm.wkpName = jaWkpName;
              inputForm.abstract = abstract;
            } else {
              return null;
            }
          })
      }