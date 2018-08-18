## 1. Accesability

### Reviewer writes

> The form or its corresponding `<div>` tag needs to have an appropriate aria role. You can do it by adding `role="form"`.

### But: the `<form>` tag have dafault role definaed as... form

As we can read in [W3C Recommendation, 14 December 2017](https://www.w3.org/TR/html5/sec-forms.html#the-form-element)

> Allowed ARIA role attribute values: dd>**form (default - do not set)**, search or presentation.

A later [in the same document](https://www.w3.org/TR/html5/dom.html#do-not-set)

> In the majority of cases setting an ARIA role and/or aria-\* attribute that matches the default implicit ARIA semantics is unnecessary and not recommended as these properties are already set by the browser.

## 2. Audit results

### Reviewer writes

> So far, the accessibility result is great. However the performance and the PWA score is not at the required benchmark.

and show these results:
![Reviewers audit results](http://imghst.co/84/L8qlj5EdPt.png)

### But they don't write in which environment they do the audit

My scores looks different for different environments *(if you don't see images then allow loading them from external hosting)*:

1. **Development** version (server runned by `npm run dev`) tested on **standard** mode of Chrome browser:

   ![Development server and standard mode](http://imghst.co/78/9&v3k0yOlS.png)

1. **Production** version (server runned by `npm run build; npm start`) tested on **standard** mode of Chrome browser:

   ![Production server and standard mode](http://imghst.co/89/qwm=vZO!L2.png)

1. **Development** version (server runned by `npm run dev`) tested on **incognito** mode of Chrome browser:

   ![Development server and incognito mode](http://imghst.co/92/D1!~nf4!tT.png)

1. **Production** version (server runned by `npm run build; npm start`) tested on **incognito** mode of Chrome browser:

   ![Production server and incognito mode](http://imghst.co/75/=V1sZmts6O.png)

## Conclusion:

1. In development version the manifest file is not generated. This imapct PWA audit score.

2. When you run the audit in standard mode of browser, the javascript from browser extensions is executed too. This have big impact to the performance score of the audit. The difference may be bigger or smaller depends on which browser extensions you have installed but is significant. Sadly we have no controll over extensions code...

**Therefore, the only proper environment for the audit this project is production version of app in incognito mode of the browser and default audit configuration** where the results is very good on my machine (the last one screenshot).

Additionaly if you run the page from [external server](https://mws-restaurants.netlify.com) (in current configuration the mws-restaurants-stage-3 server still need works locally) the audit scores in incognito mode (without browser extensions code) are very good ;)

![external server in incognito mode](http://imghst.co/76/UdI3IWzFL7.png)

## PS. Audit configuration

I used default config of audit:

![Default config of audit tool](http://imghst.co/90/H2CaIlPE7Q.png)
