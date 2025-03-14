const fetch = require('node-fetch');

const getLanguageAndCountry = async ({ locale, location, req }) => {
  let languagePreference = null;
  let country = null;

  // ✅ 1️⃣ Prioritize Social Login Data (Google, Facebook)
  if (locale) {
    languagePreference = locale; // e.g., "en-US"
    country = locale.includes('-') ? locale.split('-')[1].toUpperCase() : null; // Extract country from "en-US"
  }
  if (location?.country) {
    country = location.country; // Facebook provides explicit country info
  }

  // ✅ 2️⃣ Fallback to `Accept-Language` Header
  if (!languagePreference && req?.headers['accept-language']) {
    languagePreference = req.headers['accept-language'].split(',')[0]; // e.g., "en-US,en;q=0.9"
  }

  // ✅ 3️⃣ Fallback to IP-Based Geolocation
  if (!country && req) {
    try {
      const userIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      console.log(`🌍 Fetching country from IP: ${userIP}`);

      // Try multiple geolocation providers in case of failure
      const geoApis = [
        `http://ip-api.com/json/${userIP}`,
        `https://ipinfo.io/${userIP}/json`,
        `https://api.country.is/${userIP}`,
      ];

      for (let api of geoApis) {
        try {
          const response = await fetch(api);
          const data = await response.json();
          country = data.country || data.countryCode || null;
          if (country) break; // Stop once we get a valid country
        } catch (error) {
          console.error(`⛔ Failed to fetch country from ${api}:`, error);
        }
      }
    } catch (error) {
      console.error('⛔ Error fetching country from IP:', error);
    }
  }

  // ✅ 4️⃣ Final Check: Log Missing Data
  if (!country) console.warn('⚠️ Country could not be determined.');
  if (!languagePreference)
    console.warn('⚠️ Language preference could not be determined.');

  return { language_preference: languagePreference, country };
};

module.exports = getLanguageAndCountry;
