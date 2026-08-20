const fs = require('fs');
const https = require('https');

async function fetchCountries() {
  try {
    const res = await fetch('https://raw.githubusercontent.com/mledoze/countries/master/countries.json');
    const data = await res.json();
    
    let countries = data.map(c => {
      let nameEn = c.name.common;
      let nameEs = c.name.common;

      // Handle Palestine explicitly
      if (nameEn === "Palestine" || nameEn === "State of Palestine") {
         nameEs = "Palestina";
         nameEn = "Palestine";
      }

      // Translate Spanish names if available
      if (c.translations && c.translations.spa) {
         nameEs = c.translations.spa.common;
      }
      
      let capitalEn = c.capital && c.capital.length > 0 ? c.capital[0] : 'Unknown';
      let capitalEs = c.capital && c.capital.length > 0 ? c.capital[0] : 'Desconocida';
      
      // Translating some known capitals to Spanish if needed could be done here, 
      // but for simplicity we rely on the API's default which is often English.
      if (nameEs === "Palestina") {
        capitalEs = "Jerusalén Este";
        capitalEn = "East Jerusalem";
      }

      return {
        id: c.cca3, 
        name: nameEs,
        nameEn: nameEn,
        continent: c.region, // temporary, will be replaced
        capital: capitalEs,
        capitalEn: capitalEn,
        isoCode: c.cca2.toLowerCase(), // flagcdn uses lowercase cca2
        lat: c.latlng && c.latlng.length >= 2 ? c.latlng[0] : 0,
        lng: c.latlng && c.latlng.length >= 2 ? c.latlng[1] : 0,
      };
    });

    const continentMap = {
      'Europe': 'Europa',
      'Asia': 'Asia',
      'Africa': 'África',
      'Oceania': 'Oceanía',
      'Americas': 'América',
      'Antarctic': 'Antártida'
    };

    countries = countries.map(c => {
      const original = data.find(d => d.cca3 === c.id);
      let continentEs = continentMap[c.continent] || c.continent;
      let continentEn = c.continent;
      
      if (c.continent === 'Americas' && original) {
         if (original.subregion === 'South America') {
            continentEs = 'América del Sur';
            continentEn = 'South America';
         } else {
            continentEs = 'América del Norte';
            continentEn = 'North America';
         }
      }

      return { ...c, continent: continentEs, continentEn: continentEn };
    }).filter(c => c.continent !== 'Antártida');

    if (!countries.find(c => c.id === 'PSE')) {
       countries.push({
          id: 'PSE',
          name: 'Palestina',
          nameEn: 'Palestine',
          continent: 'Asia',
          continentEn: 'Asia',
          capital: 'Jerusalén Este',
          capitalEn: 'East Jerusalem',
          isoCode: 'ps',
          lat: 31.9,
          lng: 35.2
       });
    }

    fs.writeFileSync('prisma/countries.json', JSON.stringify(countries, null, 2));
    console.log(`Saved ${countries.length} countries to prisma/countries.json`);
  } catch (error) {
    console.error('Error fetching countries:', error);
  }
}

fetchCountries();
