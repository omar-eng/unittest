const mongoose = require('mongoose');

module.exports = async ()=>{
    const URI = process.env.MONGO_URI || 'mongodb+srv://omar010:XH9J7l76qXyiOBIg@cluster0.zlqj0ym.mongodb.net/?retryWrites=true&w=majority';
    await mongoose.connect(
        URI,
        { useNewUrlParser: true }
    ).then(()=> console.log('DB coonected'))
    .catch(err => console.error(err));
}