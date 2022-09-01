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

function getWkdReqUrlFromP349(p349) {
  return `SELECT * WHERE{
    ?qid wdt:P349 "${p349}" ;
         rdfs:label ?label.
    FILTER (LANG(?label) = "ja")
    OPTIONAL {
      ?jaWkp schema:about ?qid ;
           schema:isPartOf <https://ja.wikipedia.org/> ;
           schema:name ?jaWkpName .
      }
    }`
  }

  function getWkdReqUrlFromP271(p271) {
    return `SELECT * WHERE{
      ?qid wdt:P271 "DA14809269" ;
           rdfs:label ?label.
        FILTER (LANG(?label) = "ja")
        OPTIONAL {
          ?jaWkp schema:about ?qid ;
                 schema:isPartOf <https://ja.wikipedia.org/> ;
                 schema:name ?jaWkpName .
            }
        OPTIONAL {
          ?qid wdt:P349 ?p349 ;
        }
      }`
    }
  
