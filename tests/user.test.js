//tests/user.test.js

const it = require('ava').default;
const chai = require('chai');
var expect = chai.expect;
const startDB = require('../helpers/DB');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { addUser,getUsers,getSingleUser, deleteUser, updateUser } = require('../controllers/user')
const sinon = require("sinon");
const utils = require('../helpers/utils');
const User = require('../models/user');
const mongoose = require('mongoose');
//start db before runner

it.before(async (t) => {
    t.context.mongod = await MongoMemoryServer.create();
    process.env.MONGOURI = t.context.mongod.getUri('itiUnitTesting');
    await startDB();
})

it.after(async (t) => {
    await t.context.mongod.stop({ doCleanUp: true });
})

it('should create one user', async (t) => {
    // setup
    const fullName = 'menna hamdy';
    const request = {
        body: {
            "firstName": "menna",
            "lastName": "hamdy",
            "age": 3,
            "job": "developer"
        }
    };
    expectedResult = {
        fullName,
        age: 3,
        "job": "developer",
    }
    // exercise 
    // sinon.stub(utils, 'getFullName').returns(fullName);
    const stub1 = sinon.stub(utils, 'getFullName').callsFake((fname, lname) => {
        expect(fname).to.be.equal(request.body.firstName);
        expect(lname).to.be.equal(request.body.lastName);
        return fullName;
    })
    t.teardown(async ()=>{
        await User.deleteMany({
            fullName: request.body.fullName,
        });
        stub1.restore();
    })
    const actualResult = await addUser(request);
    // verify
    expect(actualResult._doc).to.deep.equal({_id: actualResult._id, __v: actualResult.__v,...expectedResult});
    const users = await User.find({
        fullName,
    }).lean();
    expect(users).to.have.length(1);
    expect(users[0]).to.deep.equal({_id: actualResult._id, __v: actualResult.__v,...expectedResult});
    t.pass();
})


//    getallUsers 
it('should get all users', async (t) => {
    //setup
    const usersToInsert = [
        { fullName: 'ahmed ibrahim', age: 25, job: 'Developer' },
        { fullName: 'sameh hussien', age: 30, job: 'Designer' },
    ];

    const insertedUsers = await User.insertMany(usersToInsert);

    // Exercise: Call the getUsers controller
    const actualResult = await getUsers();

    // Verify: Check if the returned result has the expected length
    const expectedLength = usersToInsert.length;
    expect(actualResult.length).to.equal(expectedLength);

    // Teardown: Clean up inserted users
    t.teardown(async () => {
        for (const user of insertedUsers) {
            await User.deleteOne({ _id: user._id });
        }
    });

    t.pass();
});


it('should get a single user by id (existing user)', async (t) => {
    // Setup
    const insertedUser = await User.create({ fullName: 'ahmed hussien', age: 30 });
    const userId = insertedUser._id.toString();

    sinon.stub(User, 'findById').returns(insertedUser);

    try {
        // Exercise
        const result = await getSingleUser({ params: { id: userId } });

        // Verify
        expect(result).to.deep.equal(insertedUser);
    } finally {
        // Teardown
        User.findById.restore(); 
        await User.deleteOne({ _id: insertedUser._id });
    }

    t.pass();
});

it('should return USER NOT FOUND for non-existent user', async (t) => {
    // Setup
    const nonExistentId = '555'; // Invalid ID

    sinon.stub(User, 'findById').returns(null);

    try {
        // Exercise
        await t.throwsAsync(async () => {
            await getSingleUser({ params: { id: nonExistentId } });
        }, { instanceOf: Error, message: 'User not found' });
    } finally {
        // Teardown
        User.findById.restore(); 
    }

    t.pass();
});

it('deleteUser should delete a user by id', async (t) => {
    // Insert a user for testing
    const user = await User.create({ fullName: 'John khaled', age: 30 });
  
    // Call deleteUser controller
    const deletedUser = await deleteUser({ params: { id: user._id.toString() } });
  
    // Verify
    t.is(deletedUser.fullName, 'John khaled');
  
    // Check if the user is deleted from the database
    const userFromDB = await User.findById(user._id);
    t.is(userFromDB, null);
  });
  
//   it('deleteUser should return USER NOT FOUND for non-existent user', async (t) => {
//     const nonExistentId = '555';
//     const response = await deleteUser({ params: {id: nonExistentId } });
  
//     // Verify
//     // t.is(response.statusCode, 404);
//     t.is(response.body.error, 'User not found');
//   });
  