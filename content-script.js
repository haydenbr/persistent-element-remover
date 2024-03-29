
(async () => {

	let store;
	const extId = 'PER';
	const generators = [];
	const temporary = browser.runtime.id.endsWith('@temporary-addon'); // debugging?

	const log = (level, msg) => { 
		level = level.trim().toLowerCase();
		if (['error','warn'].includes(level) 
			|| ( temporary && ['debug','info','log'].includes(level))
		) {
			console[level](extId + '::' + level.toUpperCase() + '::' + msg); 
			return;
		}
	}

	const remove_elements = (els) => {
		if ( typeof els.forEach !== 'function') { return; }
		els.forEach( (el) => { 
			if(typeof el.remove === 'function'){
				el.remove();
				log('DEBUG','element removed');
			}
		});
	}

	const onChange = () => {
		generators.forEach( (gen) => { remove_elements(gen()); });
	}


	try {
		store = await browser.storage.local.get('selectors');
	}catch(e){
		log('ERROR', 'access to rules storage failed');
		return;
	}

	if ( typeof store.selectors.forEach !== 'function' ) { 
		log('ERROR', 'rules selectors not iterable');
		return;
	}

	store.selectors.forEach( (selector) => {

		// check activ
		if(typeof selector.activ !== 'boolean') { return; }
		if(selector.activ !== true) { return; }

		// check url regex 
		if(typeof selector.url_regex !== 'string') { return; }
		selector.url_regex = selector.url_regex.trim(); 
		if(selector.url_regex === ''){ return; }

		try { 
			if(!(new RegExp(selector.url_regex)).test(window.location.href)){ return; }
		} catch(e) {
			log('WARN', 'invalid url regex : ' + selectors.url_regex);
			return;
		}

		if ( typeof selector.code !== 'string' ) { return; }
		if ( selector.code === '' ) { return; }

		try {
			const gen = new Function(selector.code); // build function
			remove_elements(gen()); // execute function
			generators.push(gen); // store function 
		}catch(e){
			log('WARN', 'code execution failed :' + selectors.code);
		}
	});

	if(generators.length > 0){
		log('INFO', 'registered mutation observer');
		(new MutationObserver(onChange)).observe(document.body, { attributes: false, childList: true, subtree: true }); 
	}else{
		log('DEBUG','no matching rules');
	}

})();
