const https = require('https');

const urls = [
    'https://images.unsplash.com/photo-1610030469983-98e550d61dc0?w=500&q=80',
    'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&q=80',
    'https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=500&q=80',
    'https://images.unsplash.com/photo-1512496115851-a1c8524d0d22?w=500&q=80'
];

urls.forEach(url => {
    https.get(url, (res) => {
        console.log(url, res.statusCode);
    }).on('error', (e) => {
        console.error(url, e);
    });
});
