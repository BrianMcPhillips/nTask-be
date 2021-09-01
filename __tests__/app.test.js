require('dotenv').config();

const { execSync } = require('child_process');

const fakeRequest = require('supertest');
const app = require('../lib/app');
const client = require('../lib/client');

describe('app routes', () => {
  describe('routes', () => {
    let token;
  
    beforeAll(async done => {
      execSync('npm run setup-db');
  
      client.connect();
  
      const signInData = await fakeRequest(app)
        .post('/auth/signup')
        .send({
          email: 'jon@user.com',
          password: '1234'
        });
      
      token = signInData.body.token; // eslint-disable-line
  
      return done();
    });
  
    afterAll(done => {
      return client.end(done);
    });

    test('creates tasks', async() => {

      const newTask = {
        todo: 'Something',
        completed: false
      };

      const data = await fakeRequest(app)
        .post('/api/tasks')
        .set('Authorization', token)
        .send(newTask)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(data.body).toEqual(newTask);
    });
  });
});
