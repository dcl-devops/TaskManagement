const { pool } = require('../config/database');

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Seed Countries
    const countries = [
      ['Afghanistan','AF'],['Albania','AL'],['Algeria','DZ'],['Andorra','AD'],['Angola','AO'],
      ['Argentina','AR'],['Armenia','AM'],['Australia','AU'],['Austria','AT'],['Azerbaijan','AZ'],
      ['Bahamas','BS'],['Bahrain','BH'],['Bangladesh','BD'],['Barbados','BB'],['Belarus','BY'],
      ['Belgium','BE'],['Belize','BZ'],['Benin','BJ'],['Bhutan','BT'],['Bolivia','BO'],
      ['Bosnia and Herzegovina','BA'],['Botswana','BW'],['Brazil','BR'],['Brunei','BN'],['Bulgaria','BG'],
      ['Burkina Faso','BF'],['Burundi','BI'],['Cambodia','KH'],['Cameroon','CM'],['Canada','CA'],
      ['Cape Verde','CV'],['Central African Republic','CF'],['Chad','TD'],['Chile','CL'],['China','CN'],
      ['Colombia','CO'],['Comoros','KM'],['Congo','CG'],['Costa Rica','CR'],['Croatia','HR'],
      ['Cuba','CU'],['Cyprus','CY'],['Czech Republic','CZ'],['Denmark','DK'],['Djibouti','DJ'],
      ['Dominican Republic','DO'],['Ecuador','EC'],['Egypt','EG'],['El Salvador','SV'],['Estonia','EE'],
      ['Ethiopia','ET'],['Fiji','FJ'],['Finland','FI'],['France','FR'],['Gabon','GA'],
      ['Gambia','GM'],['Georgia','GE'],['Germany','DE'],['Ghana','GH'],['Greece','GR'],
      ['Guatemala','GT'],['Guinea','GN'],['Guyana','GY'],['Haiti','HT'],['Honduras','HN'],
      ['Hungary','HU'],['Iceland','IS'],['India','IN'],['Indonesia','ID'],['Iran','IR'],
      ['Iraq','IQ'],['Ireland','IE'],['Israel','IL'],['Italy','IT'],['Jamaica','JM'],
      ['Japan','JP'],['Jordan','JO'],['Kazakhstan','KZ'],['Kenya','KE'],['Kuwait','KW'],
      ['Kyrgyzstan','KG'],['Laos','LA'],['Latvia','LV'],['Lebanon','LB'],['Libya','LY'],
      ['Lithuania','LT'],['Luxembourg','LU'],['Madagascar','MG'],['Malawi','MW'],['Malaysia','MY'],
      ['Maldives','MV'],['Mali','ML'],['Malta','MT'],['Mauritania','MR'],['Mauritius','MU'],
      ['Mexico','MX'],['Moldova','MD'],['Monaco','MC'],['Mongolia','MN'],['Montenegro','ME'],
      ['Morocco','MA'],['Mozambique','MZ'],['Myanmar','MM'],['Namibia','NA'],['Nepal','NP'],
      ['Netherlands','NL'],['New Zealand','NZ'],['Nicaragua','NI'],['Niger','NE'],['Nigeria','NG'],
      ['North Korea','KP'],['North Macedonia','MK'],['Norway','NO'],['Oman','OM'],['Pakistan','PK'],
      ['Panama','PA'],['Papua New Guinea','PG'],['Paraguay','PY'],['Peru','PE'],['Philippines','PH'],
      ['Poland','PL'],['Portugal','PT'],['Qatar','QA'],['Romania','RO'],['Russia','RU'],
      ['Rwanda','RW'],['Saudi Arabia','SA'],['Senegal','SN'],['Serbia','RS'],['Sierra Leone','SL'],
      ['Singapore','SG'],['Slovakia','SK'],['Slovenia','SI'],['Somalia','SO'],['South Africa','ZA'],
      ['South Korea','KR'],['South Sudan','SS'],['Spain','ES'],['Sri Lanka','LK'],['Sudan','SD'],
      ['Suriname','SR'],['Sweden','SE'],['Switzerland','CH'],['Syria','SY'],['Taiwan','TW'],
      ['Tajikistan','TJ'],['Tanzania','TZ'],['Thailand','TH'],['Togo','TG'],['Trinidad and Tobago','TT'],
      ['Tunisia','TN'],['Turkey','TR'],['Turkmenistan','TM'],['Uganda','UG'],['Ukraine','UA'],
      ['United Arab Emirates','AE'],['United Kingdom','GB'],['United States','US'],['Uruguay','UY'],['Uzbekistan','UZ'],
      ['Vatican City','VA'],['Venezuela','VE'],['Vietnam','VN'],['Yemen','YE'],['Zambia','ZM'],['Zimbabwe','ZW']
    ];

    for (const [name, code] of countries) {
      await client.query('INSERT INTO countries(name, code) VALUES($1, $2) ON CONFLICT(name) DO NOTHING', [name, code]);
    }
    console.log(`Seeded ${countries.length} countries`);

    // Get India ID
    const indiaRes = await client.query("SELECT id FROM countries WHERE code='IN'");
    const indiaId = indiaRes.rows[0].id;

    // Seed Indian States + UTs
    const indianStates = [
      'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
      'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
      'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan',
      'Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
      'Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli and Daman and Diu',
      'Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry'
    ];

    const stateIdMap = {};
    for (const sName of indianStates) {
      const r = await client.query('INSERT INTO states(name, country_id) VALUES($1, $2) ON CONFLICT(name, country_id) DO UPDATE SET name=$1 RETURNING id', [sName, indiaId]);
      stateIdMap[sName] = r.rows[0].id;
    }
    console.log(`Seeded ${indianStates.length} Indian states`);

    // Seed Indian Cities (major cities mapped to states)
    const indianCities = {
      'Andhra Pradesh': ['Visakhapatnam','Vijayawada','Guntur','Nellore','Kurnool','Tirupati','Kakinada','Rajahmundry','Anantapur','Eluru'],
      'Arunachal Pradesh': ['Itanagar','Naharlagun','Pasighat'],
      'Assam': ['Guwahati','Silchar','Dibrugarh','Jorhat','Nagaon','Tinsukia','Tezpur'],
      'Bihar': ['Patna','Gaya','Bhagalpur','Muzaffarpur','Purnia','Darbhanga','Arrah'],
      'Chhattisgarh': ['Raipur','Bhilai','Bilaspur','Korba','Durg','Rajnandgaon'],
      'Goa': ['Panaji','Margao','Vasco da Gama','Mapusa','Ponda'],
      'Gujarat': ['Ahmedabad','Surat','Vadodara','Rajkot','Bhavnagar','Jamnagar','Junagadh','Gandhinagar','Anand','Nadiad','Morbi','Mehsana','Bharuch'],
      'Haryana': ['Gurugram','Faridabad','Panipat','Ambala','Karnal','Hisar','Rohtak','Sonipat'],
      'Himachal Pradesh': ['Shimla','Dharamshala','Mandi','Solan','Kullu','Manali'],
      'Jharkhand': ['Ranchi','Jamshedpur','Dhanbad','Bokaro','Deoghar','Hazaribag'],
      'Karnataka': ['Bengaluru','Mysuru','Hubballi','Mangaluru','Belagavi','Davanagere','Ballari','Tumakuru','Shivamogga'],
      'Kerala': ['Thiruvananthapuram','Kochi','Kozhikode','Thrissur','Kollam','Kannur','Alappuzha','Palakkad','Malappuram'],
      'Madhya Pradesh': ['Bhopal','Indore','Jabalpur','Gwalior','Ujjain','Sagar','Dewas','Satna','Rewa'],
      'Maharashtra': ['Mumbai','Pune','Nagpur','Thane','Nashik','Aurangabad','Solapur','Kolhapur','Amravati','Navi Mumbai','Sangli','Akola','Latur','Nanded'],
      'Manipur': ['Imphal','Thoubal','Bishnupur'],
      'Meghalaya': ['Shillong','Tura','Jowai'],
      'Mizoram': ['Aizawl','Lunglei','Champhai'],
      'Nagaland': ['Kohima','Dimapur','Mokokchung'],
      'Odisha': ['Bhubaneswar','Cuttack','Rourkela','Berhampur','Sambalpur','Puri'],
      'Punjab': ['Ludhiana','Amritsar','Jalandhar','Patiala','Bathinda','Mohali','Hoshiarpur'],
      'Rajasthan': ['Jaipur','Jodhpur','Kota','Bikaner','Ajmer','Udaipur','Bhilwara','Alwar','Sikar'],
      'Sikkim': ['Gangtok','Namchi','Pelling'],
      'Tamil Nadu': ['Chennai','Coimbatore','Madurai','Tiruchirappalli','Salem','Tirunelveli','Erode','Vellore','Thoothukudi'],
      'Telangana': ['Hyderabad','Warangal','Nizamabad','Karimnagar','Khammam','Ramagundam'],
      'Tripura': ['Agartala','Udaipur','Dharmanagar'],
      'Uttar Pradesh': ['Lucknow','Kanpur','Agra','Varanasi','Meerut','Prayagraj','Ghaziabad','Noida','Bareilly','Aligarh','Moradabad','Gorakhpur','Firozabad'],
      'Uttarakhand': ['Dehradun','Haridwar','Roorkee','Haldwani','Rishikesh','Kashipur','Nainital'],
      'West Bengal': ['Kolkata','Howrah','Durgapur','Asansol','Siliguri','Bardhaman','Malda','Kharagpur'],
      'Delhi': ['New Delhi','Delhi'],
      'Chandigarh': ['Chandigarh'],
      'Puducherry': ['Puducherry','Karaikal'],
      'Jammu and Kashmir': ['Srinagar','Jammu','Anantnag','Baramulla'],
      'Ladakh': ['Leh','Kargil'],
      'Andaman and Nicobar Islands': ['Port Blair']
    };

    let cityCount = 0;
    for (const [stateName, cities] of Object.entries(indianCities)) {
      const stateId = stateIdMap[stateName];
      if (!stateId) continue;
      for (const city of cities) {
        await client.query('INSERT INTO cities(name, state_id) VALUES($1, $2) ON CONFLICT(name, state_id) DO NOTHING', [city, stateId]);
        cityCount++;
      }
    }
    console.log(`Seeded ${cityCount} Indian cities`);

    await client.query('COMMIT');
    console.log('Geography seed complete');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', err);
  } finally {
    client.release();
    process.exit(0);
  }
}

seed();
