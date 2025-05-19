import users from './users.json';
import axios, { AxiosError } from 'axios';

const API_URL = 'http://localhost:3000/api/users/register'; // Change to your actual endpoint

async function testUsers() {
    for (let i = 0; i < users.length; i++) {
        try {
            const response = await axios.post(API_URL, users[i]);
            console.log(`✅ Test #${i + 1}: Success`, response.data);
        } catch (error) {
            if (error instanceof AxiosError) {
                if (error.response) {
                    console.log(`❌ Test #${i + 1}: Error ${error.response.status} - ${JSON.stringify(error.response.data)}`);
                } else {
                    console.log(`❌ Test #${i + 1}: Network/Error - ${error.message}`);
                }
            }
        }
    }
}

testUsers();