import mongoose, { ObjectId } from 'mongoose';
import { MongoClient } from 'mongodb';

const MONGO_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PW}@cluster0.s27k7g6.mongodb.net/testing?readPreference=primary`;

const MONGO_URI_SECONDARY = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PW}@cluster0.s27k7g6.mongodb.net/testing?readPreference=secondary`;

// async function main() {
//   const db = await MongoClient.connect(MONGO_URI, {
//     // useNewUrlParser: true,
//     connectTimeoutMS: 1000,
//     socketTimeoutMS: 1000,
//     maxIdleTimeMS: 1000,
//     maxPoolSize: 1, // Only 1 operation can run at a time
//   }).then((client) => client.db());

//   // db.dropCollection('Foo');
//   // db.dropCollection('Bar');

//   // db.createCollection('Foo');
//   // db.createCollection('Bar');

//   // console.log('before insert');

//   const foos = [];
//   for (let i = 0; i < 5000; ++i) {
//     foos.push({ _id: i });
//   }
//   await db.collection('foo').insertMany(foos);
//   console.log('Inserted foo docs');

//   const bars = [];
//   for (let i = 0; i < 5000; ++i) {
//     bars.push({ _id: i, fooId: i });
//   }
//   await db.collection('Bar').insertMany(bars);
//   console.log('Inserted bar docs');

//   console.log(db.collection('Foo').countDocuments());
//   console.log(db.collection('Bar').countDocuments());

//   // const promise = await db
//   //   .collection('Foo')
//   //   .aggregate([ { $lookup: { from: 'Bar', localField: '_id', foreignField: 'fooId', as: 'bars' } }, ])
//   //   .explain();

//   // console.log({
//   //   promise,
//   // });
// }
// main();

// Define Mongoose schemas for the Foo and Bar models
const FooSchema = new mongoose.Schema(
  {
    name: String,
  },
  {
    read: 'secondary',
  },
);

const BarSchema = new mongoose.Schema({
  // name: String,
  fooId: { type: mongoose.Types.ObjectId, ref: 'Foo' },
});

// Create Mongoose models for the Foo and Bar collections
const Foo = mongoose.model('Foo', FooSchema);
const Bar = mongoose.model('Bar', BarSchema);
const Bas = mongoose.model('Bas', BarSchema);

async function main() {
  try {
    // Connect to the MongoDB database
    await mongoose.connect(MONGO_URI_SECONDARY);
    // mongoose debug mode
    mongoose.set('debug', true);
    console.log('Connected to database');

    // const foos = (await Foo.find().select('id').lean().exec()) as any;
    // for (const foo of foos) {
    //   foo.fooId = foo._id;
    //   delete foo._id;
    // }

    // create 5000 foo
    // const fooData: { name: string }[] = [];
    // for (let i = 0; i < 5000; ++i) {
    //   fooData.push({ name: i.toString() });
    // }
    // const foos = await Foo.insertMany(fooData);
    // // foos[0]._id;

    // await Bar.insertMany(foos);

    console.time('populate');
    const f = await Foo.find().populate({
      path: 'bars',
      model: 'Bar',
      localField: '_id',
      foreignField: 'fooId',
      strictPopulate: false,
    });
    console.log('first item:', f[0]);
    console.log('length', f.length);
    console.timeEnd('populate');

    console.time('aggregate');
    const a1 = await Foo.aggregate([
      {
        $lookup: {
          from: 'bars',
          localField: '_id',
          foreignField: 'fooId',
          as: 'bars',
        },
      },
    ]);
    // console.log(JSON.stringify(a2));
    console.log('first item:', a1[0]);
    console.log('length', a1.length);
    console.timeEnd('aggregate');

    // console.time('populate');
    // const f2 = await Bar.find()
    //   .populate({
    //     path: 'fooId',
    //     model: 'Foo',
    //   })
    //   .lean()
    //   .exec();
    // // .explain();
    // // console.log(f2);
    // console.log('first item:', f2[0]);
    // console.log('length', f2.length);
    // console.timeEnd('populate');

    // console.time('aggregate');
    // const a2 = await Bar.aggregate([
    //   { $lookup: { from: 'foos', localField: 'fooId', foreignField: '_id', as: 'foos' } },
    // ]);
    // // .explain();
    // // console.log(JSON.stringify(a2));
    // console.log('first item:', a2[0]);
    // console.log('length', a2.length);
    // console.timeEnd('aggregate');

    // Disconnect from the database
    await mongoose.disconnect();
  } catch (err) {
    console.log('Error:', err);
    process.exit(1);
  }
}

// Call the main function
main();
