// Routes, stations and duties. Station names, codes and approximate positions are real; km are approximate rail
// distances from the first station. Train numbers, train names and loco numbers are made up for this game.
export const ROUTES = [
  { id: 'ker', title: 'Kerala coast', train: '90601', trainName: 'Coast Duty Express', loco: '30612', region: 'south', start: '06:10',
    stations: [
      { en: 'Thiruvananthapuram Central', hi: 'तिरुवनंतपुरम सेंट्रल', code: 'TVC', km: 0, lat: 8.487, lon: 76.952 },
      { en: 'Kollam Jn', hi: 'कोल्लम जं.', code: 'QLN', km: 65, lat: 8.886, lon: 76.595 },
      { en: 'Kayamkulam Jn', hi: 'कायमकुलम जं.', code: 'KYJ', km: 106, lat: 9.172, lon: 76.501 },
      { en: 'Kottayam', hi: 'कोट्टयम', code: 'KTYM', km: 158, lat: 9.594, lon: 76.526 },
      { en: 'Ernakulam Jn', hi: 'एर्णाकुलम जं.', code: 'ERS', km: 221, lat: 9.969, lon: 76.290 },
      { en: 'Thrissur', hi: 'तृश्शूर', code: 'TCR', km: 296, lat: 10.515, lon: 76.212 },
    ] },
  { id: 'mum', title: 'Mumbai to Pune (ghat section)', train: '90121', trainName: 'Deccan Duty Express', loco: '30418', region: 'west', start: '07:05',
    stations: [
      { en: 'Mumbai CSMT', hi: 'मुंबई सीएसएमटी', code: 'CSMT', km: 0, lat: 18.940, lon: 72.835 },
      { en: 'Thane', hi: 'ठाणे', code: 'TNA', km: 34, lat: 19.186, lon: 72.976 },
      { en: 'Kalyan Jn', hi: 'कल्याण जं.', code: 'KYN', km: 54, lat: 19.236, lon: 73.130 },
      { en: 'Karjat', hi: 'कर्जत', code: 'KJT', km: 100, lat: 18.910, lon: 73.320 },
      { en: 'Lonavala', hi: 'लोनावला', code: 'LNL', km: 128, lat: 18.750, lon: 73.405 },
      { en: 'Pune Jn', hi: 'पुणे जं.', code: 'PUNE', km: 192, lat: 18.528, lon: 73.874 },
    ] },
  { id: 'del', title: 'New Delhi to Jhansi', train: '90401', trainName: 'Yamuna Duty Express', loco: '30245', region: 'north', start: '06:00',
    stations: [
      { en: 'New Delhi', hi: 'नई दिल्ली', code: 'NDLS', km: 0, lat: 28.642, lon: 77.219 },
      { en: 'Mathura Jn', hi: 'मथुरा जं.', code: 'MTJ', km: 141, lat: 27.480, lon: 77.681 },
      { en: 'Agra Cantt', hi: 'आगरा कैंट', code: 'AGC', km: 195, lat: 27.158, lon: 77.990 },
      { en: 'Gwalior', hi: 'ग्वालियर', code: 'GWL', km: 313, lat: 26.218, lon: 78.182 },
      { en: 'Virangana Lakshmibai Jhansi', hi: 'वीरांगना लक्ष्मीबाई झाँसी', code: 'VGLJ', km: 410, lat: 25.449, lon: 78.568 },
    ] },
  { id: 'mas', title: 'Chennai to Bengaluru', train: '90207', trainName: 'Kaveri Duty Express', loco: '30733', region: 'south', start: '06:35',
    stations: [
      { en: 'MGR Chennai Central', hi: 'एमजीआर चेन्नई सेंट्रल', code: 'MAS', km: 0, lat: 13.082, lon: 80.275 },
      { en: 'Arakkonam Jn', hi: 'अरक्कोणम जं.', code: 'AJJ', km: 69, lat: 13.084, lon: 79.671 },
      { en: 'Katpadi Jn', hi: 'काटपाडी जं.', code: 'KPD', km: 129, lat: 12.972, lon: 79.138 },
      { en: 'Jolarpettai Jn', hi: 'जोलारपेट्टै जं.', code: 'JTJ', km: 213, lat: 12.565, lon: 78.575 },
      { en: 'Bangarapet Jn', hi: 'बंगारपेट जं.', code: 'BWT', km: 270, lat: 12.991, lon: 78.178 },
      { en: 'KSR Bengaluru', hi: 'केएसआर बेंगलूरु', code: 'SBC', km: 362, lat: 12.978, lon: 77.570 },
    ] },
];
export const SCALE = 40;          // game metres per real km: distances are compressed, speeds are true
export const TIME_X = 1000 / SCALE; // the clock runs this much faster than real time (so km/h stay honest)
