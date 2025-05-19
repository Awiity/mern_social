import users from './users.json' with {
    type: "json"
}
import axios, {
    AxiosError
} from 'axios';

const API_URL = 'http://localhost:4000/api/auth/register'; // Change to your actual endpoint

async function testUsers() {
    for (let i = 0; i < users.length; i++) {
        try {
            const response = await axios.post(API_URL, users[i]);
            console.log(`✅ Test #${i + 1}: Success`, response.data);
        } catch (error) {
            if (error instanceof AxiosError) {
                if (error.response) {
                    console.log(`❌ Test #${i + 1}: Error  ${error.response.status.message} 
                                                            ${error.response.status.errors.message}
                                                             - ${JSON.stringify(error.response.data)}`);
                } else {
                    console.log(`❌ Test #${i + 1}: Network/Error - ${error.message}`);
                }
            }
        }
    }
}

testUsers();