const https = require('https');

const urls = [
    'https://images.unsplash.com/photo-1610189013582-77eb931e5f88?w=500&q=80',
    'https://images.unsplash.com/photo-1583391733958-d25e07fac04f?w=500&q=80',
    'https://images.unsplash.com/photo-1631214500515-873950f58869?w=500&q=80',
    'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&q=80'
];

urls.forEach(url => {
    https.get(url, (res) => {
        console.log(url, res.statusCode);
    }).on('error', (e) => {
        console.error(url, e);
    });
});
